from __future__ import annotations

import asyncio
import logging
import queue
import threading
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalyzeRequest, RunSnapshot, RunStats
from app.services.analysis_queue import analysis_queue
from app.services.run_manager import run_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])

# Background run storage for in-progress analysis
_active_runs: dict[str, asyncio.Task] = {}

# Sentinel to signal the end of the graph stream from the worker thread.
_SENTINEL = object()


def _stream_graph_chunks(graph, init_state, args, out_queue: queue.Queue) -> None:
    """Run the synchronous LangGraph stream in a worker thread.

    Pushes each chunk onto *out_queue* and puts ``_SENTINEL`` when done.
    Exceptions are forwarded as-is so the caller can re-raise.
    """
    try:
        for chunk in graph.graph.stream(init_state, **args):
            out_queue.put(chunk)
    except BaseException as exc:
        out_queue.put(exc)
    finally:
        out_queue.put(_SENTINEL)


async def _run_analysis_background(run_id: str, request: AnalyzeRequest) -> None:
    """Run the TradingAgents analysis in the background, streaming events to the queue."""
    from tradingagents.default_config import DEFAULT_CONFIG
    from tradingagents.graph.trading_graph import TradingAgentsGraph

    event_queue = await run_manager.get_queue(run_id)
    if not event_queue:
        return

    try:
        run = await run_manager.get(run_id)
        if run:
            await run_manager.add_event(run_id, {
                "type": "snapshot",
                "data": run.model_dump(),
            })

        # Build config from request
        config = dict(DEFAULT_CONFIG)
        config["llm_provider"] = request.provider
        config["quick_think_llm"] = request.quick_model
        config["deep_think_llm"] = request.deep_model
        config["output_language"] = request.output_language
        config["checkpoint_enabled"] = request.checkpoint

        # Research depth maps to debate rounds
        depth = request.research_depth
        config["max_debate_rounds"] = max(1, depth // 2)
        config["max_risk_discuss_rounds"] = max(1, depth // 2)

        if request.data_vendors:
            config["data_vendors"] = {**config.get("data_vendors", {}), **request.data_vendors}

        # Notify all pipeline stages as pending up front so the
        # PipelineVisualization renders every stage immediately.
        all_stages = [
            "market_analyst", "social_media_analyst",
            "news_analyst", "fundamentals_analyst",
            "bull_researcher", "bear_researcher",
            "research_manager", "trader", "portfolio_manager",
        ]
        for stage in all_stages:
            await run_manager.add_event(run_id, {
                "type": "agent_update",
                "run_id": run_id,
                "agent": stage,
                "status": "pending",
            })

        # Build graph
        graph = TradingAgentsGraph(
            selected_analysts=request.analysts,
            config=config,
            debug=False,
        )

        # Get initial state
        init_state = graph.propagator.create_initial_state(
            request.ticker, request.date, "stock"
        )
        args = graph.propagator.get_graph_args()

        # Stream the graph in a worker thread so the asyncio event loop
        # remains free to serve SSE events and other requests.
        chunk_queue: queue.Queue = queue.Queue()
        worker = threading.Thread(
            target=_stream_graph_chunks,
            args=(graph, init_state, args, chunk_queue),
            daemon=True,
        )
        worker.start()

        final_state: dict = {}
        prev_state: dict = {}
        completed_stages: set[str] = set()
        started_stages: set[str] = set()
        started_at = (await run_manager.get(run_id)).started
        # Track message IDs already sent to avoid duplicates and empty msgs.
        _seen_msg_ids: set[int] = set()
        _last_sent_content: str = ""

        # --- stage detection helpers -----------------------------------
        # Analyst stages are detected by their report field appearing.
        _REPORT_STAGES = {
            "market_report": "market_analyst",
            "sentiment_report": "social_media_analyst",
            "news_report": "news_analyst",
            "fundamentals_report": "fundamentals_analyst",
        }

        # All pipeline agents in order
        _ALL_AGENTS = [
            "market_analyst", "social_media_analyst",
            "news_analyst", "fundamentals_analyst",
            "bull_researcher", "bear_researcher",
            "research_manager", "trader", "portfolio_manager",
        ]

        async def _emit(agent: str, status: str) -> None:
            run = await run_manager.get(run_id)
            if run:
                agents = {**run.agents, agent: status}
                await run_manager.update(run_id, agents=agents)
            await run_manager.add_event(run_id, {
                "type": "agent_update",
                "run_id": run_id,
                "agent": agent,
                "status": status,
            })

        async def _recompute_all_statuses() -> None:
            """Re-evaluate ALL agent statuses from accumulated state (like CLI)."""
            # Check accumulated final_state for each agent's completion criteria
            # --- Analysts ---
            found_active = False
            for field, stage in _REPORT_STAGES.items():
                has_report = bool(final_state.get(field))
                if has_report:
                    if stage not in completed_stages:
                        completed_stages.add(stage)
                        await _emit(stage, "completed")
                elif not found_active and stage not in completed_stages:
                    # First analyst without report -> in_progress
                    found_active = True
                    if stage not in started_stages:
                        started_stages.add(stage)
                        await _emit(stage, "in_progress")
                # else: waiting analysts stay pending (default)

            # --- Research team (bull/bear/research_manager) ---
            debate = final_state.get("investment_debate_state") or {}
            bull_history = debate.get("bull_history", "")
            bear_history = debate.get("bear_history", "")
            judge_decision = debate.get("judge_decision", "")

            # Bull/Bear: in_progress when their history appears, completed when judge_decision appears
            if bull_history:
                if "bull_researcher" not in started_stages:
                    started_stages.add("bull_researcher")
                    await _emit("bull_researcher", "in_progress")
            if bear_history:
                if "bear_researcher" not in started_stages:
                    started_stages.add("bear_researcher")
                    await _emit("bear_researcher", "in_progress")

            # When judge_decision appears, mark both bull/bear and research_manager as completed
            if judge_decision:
                if "bull_researcher" not in completed_stages:
                    completed_stages.add("bull_researcher")
                    await _emit("bull_researcher", "completed")
                if "bear_researcher" not in completed_stages:
                    completed_stages.add("bear_researcher")
                    await _emit("bear_researcher", "completed")
                if "research_manager" not in completed_stages:
                    completed_stages.add("research_manager")
                    await _emit("research_manager", "completed")
            elif "research_manager" not in started_stages and (bull_history or bear_history):
                # Research manager in_progress when debate starts
                started_stages.add("research_manager")
                await _emit("research_manager", "in_progress")

            # --- Trader ---
            trader_plan = final_state.get("trader_investment_plan", "")
            if trader_plan:
                if "trader" not in completed_stages:
                    completed_stages.add("trader")
                    await _emit("trader", "completed")
                elif "trader" not in started_stages:
                    started_stages.add("trader")
                    await _emit("trader", "in_progress")

            # --- Portfolio Manager ---
            final_decision = final_state.get("final_trade_decision", "")
            if final_decision:
                if "portfolio_manager" not in completed_stages:
                    completed_stages.add("portfolio_manager")
                    await _emit("portfolio_manager", "completed")
                elif "portfolio_manager" not in started_stages:
                    started_stages.add("portfolio_manager")
                    await _emit("portfolio_manager", "in_progress")

        async def _detect_stages(chunk: dict) -> None:
            """Merge chunk into accumulated state and re-evaluate all statuses."""
            for key, value in chunk.items():
                if value:
                    final_state[key] = value
            await _recompute_all_statuses()
        # --- end helpers -----------------------------------------------

        while True:
            # yield control between chunks so SSE pings and other
            # coroutines can run while we wait for the worker thread.
            chunk = await asyncio.to_thread(chunk_queue.get)

            if chunk is _SENTINEL:
                break

            if isinstance(chunk, BaseException):
                raise chunk

            if run_id not in _active_runs:
                await run_manager.update(run_id, status="stopped", ended=time.time())
                run = await run_manager.get(run_id)
                if run:
                    await run_manager.add_event(run_id, {
                        "type": "snapshot",
                        "data": run.model_dump(),
                    })
                return

            # Detect pipeline stage transitions from state field changes.
            await _detect_stages(chunk)

            # Forward ALL new message content to the SSE message feed.
            # Skip empty-content messages (e.g. AIMessages with only
            # tool_calls) and duplicates across consecutive chunks.
            if "messages" in chunk:
                messages = chunk["messages"]
                for msg in messages:
                    msg_id = id(msg)
                    if msg_id in _seen_msg_ids:
                        continue
                    _seen_msg_ids.add(msg_id)
                    content = msg.content if hasattr(msg, "content") else str(msg)
                    if not content or not content.strip():
                        continue
                    # Skip if identical to the last sent message (dedup).
                    if content == _last_sent_content:
                        continue
                    _last_sent_content = content
                    agent = getattr(msg, "name", None) or "agent"
                    await run_manager.add_message(run_id, agent, content[:2000])
                    await run_manager.add_event(run_id, {
                        "type": "message",
                        "run_id": run_id,
                        "agent": agent,
                        "content": content[:2000],
                    })

            final_state.update(chunk)
            prev_state = chunk  # track previous chunk for diff detection

            # Update stats periodically
            await run_manager.add_event(run_id, {
                "type": "stats",
                "run_id": run_id,
                "elapsed": time.time() - started_at,
            })

        # Extract final decision
        decision = None
        reports = {}
        if "final_decision" in final_state:
            fd = final_state["final_decision"]
            decision = fd.content if hasattr(fd, "content") else str(fd)
        if "final_report" in final_state:
            fr = final_state["final_report"]
            reports["final"] = fr.content if hasattr(fr, "content") else str(fr)

        # Save the report tree to disk (same structure as the CLI).
        report_path = None
        try:
            from tradingagents.reporting import write_report_tree
            from tradingagents.dataflows.utils import safe_ticker_component
            from tradingagents.default_config import DEFAULT_CONFIG as _DC
            from datetime import datetime as _dt

            _results = Path(config.get("results_dir", _DC["results_dir"]))
            _stamp = _dt.now().strftime("%Y%m%d_%H%M%S")
            _save = _results / f"{safe_ticker_component(request.ticker)}_{_stamp}"
            complete = write_report_tree(final_state, request.ticker, _save)
            report_path = str(complete)
            logger.info("Report saved for run %s → %s", run_id, report_path)
        except Exception:
            logger.exception("Failed to save report tree for run %s", run_id)

        # Persist resolved company name for sidebar display.
        try:
            from tradingagents.agents.utils.agent_utils import resolve_instrument_identity
            from app.services.tickers_store import tickers_store
            identity = resolve_instrument_identity(request.ticker)
            company_name = identity.get("company_name")
            if company_name:
                tickers_store.update({request.ticker: company_name})
        except Exception:
            logger.debug("Could not persist company name for %s", request.ticker)

        # Finalize: ensure all agents marked completed (matching CLI behavior)
        for agent in _ALL_AGENTS:
            if agent not in completed_stages:
                completed_stages.add(agent)
                await _emit(agent, "completed")

        await run_manager.update(
            run_id,
            status="completed",
            ended=time.time(),
            decision=decision,
            reports=reports,
            stats=RunStats(elapsed_s=time.time() - started_at),
        )
        run = await run_manager.get(run_id)
        if run:
            await run_manager.add_event(run_id, {
                "type": "snapshot",
                "data": run.model_dump(),
            })
        await run_manager.add_event(run_id, {
            "type": "final_report",
            "run_id": run_id,
            "decision": decision,
            "report_path": report_path,
        })
        await run_manager.add_event(run_id, {
            "type": "done",
            "run_id": run_id,
        })

    except Exception as e:
        logger.exception("Analysis failed for run %s", run_id)
        await run_manager.update(run_id, status="error", ended=time.time(), error=str(e))
        run = await run_manager.get(run_id)
        if run:
            await run_manager.add_event(run_id, {
                "type": "snapshot",
                "data": run.model_dump(),
            })
        await run_manager.add_event(run_id, {
            "type": "error",
            "run_id": run_id,
            "error": str(e),
        })
        await run_manager.add_event(run_id, {
            "type": "done",
            "run_id": run_id,
        })
    finally:
        _active_runs.pop(run_id, None)
        analysis_queue.on_run_finished(run_id)


@router.post("/analyze")
async def start_analysis(request: AnalyzeRequest):
    run = await run_manager.create(
        ticker=request.ticker,
        date=request.date,
    )
    analysis_queue.enqueue(run.run_id, request)
    return run.model_dump()


@router.post("/stop/{run_id}")
async def stop_analysis(run_id: str):
    task = _active_runs.pop(run_id, None)
    if task and not task.done():
        task.cancel()
    run = await run_manager.stop(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run.model_dump()


@router.delete("/queue/{run_id}")
async def remove_from_queue(run_id: str):
    removed = analysis_queue.remove(run_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Run not in queue or already running")
    await run_manager.delete(run_id)
    return {"success": True}
