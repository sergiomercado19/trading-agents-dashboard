from __future__ import annotations

import asyncio
import logging
import time

from fastapi import APIRouter, HTTPException

from backend.app.models.schemas import AnalyzeRequest, RunSnapshot
from backend.app.services.run_manager import run_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])

# Background run storage for in-progress analysis
_active_runs: dict[str, asyncio.Task] = {}


async def _run_analysis_background(run_id: str, request: AnalyzeRequest) -> None:
    """Run the TradingAgents analysis in the background, streaming events to the queue."""
    from tradingagents.default_config import DEFAULT_CONFIG
    from tradingagents.graph.trading_graph import TradingAgentsGraph

    queue = await run_manager.get_queue(run_id)
    if not queue:
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

        # Notify agents starting
        agent_names = ["market_analyst", "social_media_analyst", "news_analyst", "fundamentals_analyst"]
        for agent in agent_names:
            await run_manager.add_event(run_id, {
                "type": "agent_update",
                "run_id": run_id,
                "agent": agent,
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

        # Stream the graph
        final_state = {}
        for chunk in graph.graph.stream(init_state, **args):
            if run_id not in _active_runs:
                await run_manager.add_event(run_id, {
                    "type": "status",
                    "run_id": run_id,
                    "status": "stopped",
                    "message": "Analysis stopped by user",
                })
                return

            for node_name, node_output in chunk.items():
                if isinstance(node_output, dict) and "messages" in node_output:
                    messages = node_output["messages"]
                    if messages:
                        last_msg = messages[-1]
                        content = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
                        # Update agent status
                        agent_status = "completed"
                        await run_manager.add_event(run_id, {
                            "type": "agent_update",
                            "run_id": run_id,
                            "agent": node_name,
                            "status": agent_status,
                        })
                        # Send message event
                        await run_manager.add_event(run_id, {
                            "type": "message",
                            "run_id": run_id,
                            "agent": node_name,
                            "content": content[:2000],
                        })

                final_state.update(node_output)

            # Update stats periodically
            await run_manager.add_event(run_id, {
                "type": "stats",
                "run_id": run_id,
                "elapsed": time.time() - (await run_manager.get(run_id)).started,
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
