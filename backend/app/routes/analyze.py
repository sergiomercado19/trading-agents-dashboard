from __future__ import annotations

import asyncio
import logging
import queue
import threading
import time

from fastapi import APIRouter, HTTPException

from backend.app.models.schemas import AnalyzeRequest, RunSnapshot
from backend.app.services.run_manager import run_manager

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
        await run_manager.update(run_id, status="running")
        await run_manager.add_event(run_id, {
            "type": "status",
            "run_id": run_id,
            "status": "running",
            "message": "Analysis started",
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
        started_at = (await run_manager.get(run_id)).started

        # --- stage detection helpers -----------------------------------
        # Analyst stages are detected by their report field appearing.
        _REPORT_STAGES = {
            "market_report": "market_analyst",
            "sentiment_report": "social_media_analyst",
            "news_report": "news_analyst",
            "fundamentals_report": "fundamentals_analyst",
        }

        async def _emit(agent: str, status: str) -> None:
            await run_manager.add_event(run_id, {
                "type": "agent_update",
                "run_id": run_id,
                "agent": agent,
                "status": status,
            })

        async def _detect_stages(chunk: dict) -> None:
            """Compare *chunk* against ``prev_state`` and emit agent_update
            events for every pipeline stage that transitioned."""
            nonlocal prev_state

            # --- analysts (report fields) ---
            for field, stage in _REPORT_STAGES.items():
                new_val = chunk.get(field)
                if new_val and stage not in completed_stages:
                    completed_stages.add(stage)
                    await _emit(stage, "completed")

            # --- investment debate (bull / bear / research manager) ---
            debate = chunk.get("investment_debate_state") or {}
            prev_debate = prev_state.get("investment_debate_state") or {}

            bull_new = debate.get("bull_history", "")
            bull_old = prev_debate.get("bull_history", "")
            if bull_new and bull_new != bull_old and "bull_researcher" not in completed_stages:
                completed_stages.add("bull_researcher")
                await _emit("bull_researcher", "completed")

            bear_new = debate.get("bear_history", "")
            bear_old = prev_debate.get("bear_history", "")
            if bear_new and bear_new != bear_old and "bear_researcher" not in completed_stages:
                completed_stages.add("bear_researcher")
                await _emit("bear_researcher", "completed")

            judge_new = debate.get("judge_decision", "")
            judge_old = prev_debate.get("judge_decision", "")
            if judge_new and not judge_old and "research_manager" not in completed_stages:
                completed_stages.add("research_manager")
                await _emit("research_manager", "completed")

            # --- trader ---
            tip_new = chunk.get("trader_investment_plan", "")
            tip_old = prev_state.get("trader_investment_plan", "")
            if tip_new and tip_new != tip_old and "trader" not in completed_stages:
                completed_stages.add("trader")
                await _emit("trader", "completed")

            # --- portfolio manager (final_trade_decision) ---
            ftd_new = chunk.get("final_trade_decision", "")
            ftd_old = prev_state.get("final_trade_decision", "")
            if ftd_new and ftd_new != ftd_old and "portfolio_manager" not in completed_stages:
                completed_stages.add("portfolio_manager")
                await _emit("portfolio_manager", "completed")
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
                await run_manager.add_event(run_id, {
                    "type": "status",
                    "run_id": run_id,
                    "status": "stopped",
                    "message": "Analysis stopped by user",
                })
                return

            # Detect pipeline stage transitions from state field changes.
            await _detect_stages(chunk)

            # Forward message content to the SSE message feed.
            if "messages" in chunk:
                messages = chunk["messages"]
                if messages:
                    last_msg = messages[-1]
                    content = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
                    agent = getattr(last_msg, "name", None) or "agent"
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

        await run_manager.update(
            run_id,
            status="completed",
            ended=time.time(),
            decision=decision,
            reports=reports,
        )
        await run_manager.add_event(run_id, {
            "type": "final_report",
            "run_id": run_id,
            "decision": decision,
        })
        await run_manager.add_event(run_id, {
            "type": "done",
            "run_id": run_id,
        })

    except Exception as e:
        logger.exception("Analysis failed for run %s", run_id)
        await run_manager.update(run_id, status="error", ended=time.time(), error=str(e))
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


@router.post("/analyze")
async def start_analysis(request: AnalyzeRequest):
    run = await run_manager.create(
        ticker=request.ticker,
        date=request.date,
    )
    task = asyncio.create_task(_run_analysis_background(run.run_id, request))
    _active_runs[run.run_id] = task
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
