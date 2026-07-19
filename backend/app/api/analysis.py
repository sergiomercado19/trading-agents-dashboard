from __future__ import annotations

import asyncio
import json
import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from starlette.responses import StreamingResponse

from app.core.database import get_db
from app.core.sse import sse_generator
from app.api.dependencies import get_current_user
from app.models import User, Analysis, AnalysisAgent, AnalysisStatus, AgentPhase, AgentStatus
from app.schemas.analysis import AnalysisRequest
from app.workflow.engine import WorkflowEngine

logger = logging.getLogger(__name__)

router = APIRouter(tags=["analysis"])

# In-memory store for active analysis queues
_analysis_queues: dict[int, asyncio.Queue] = {}
_active_tasks: dict[int, asyncio.Task] = {}


@router.post("/analysis/start")
async def start_analysis(
    request: AnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    date = request.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Create analysis record
    analysis = Analysis(
        user_id=current_user.id,
        ticker=request.ticker.upper(),
        status=AnalysisStatus.PENDING,
        config_snapshot={
            "analysts": request.analysts,
            "research_depth": request.research_depth,
            "provider": request.provider,
            "model": request.model,
        },
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)

    # Create agent records
    from app.agents import PHASE_ORDER, PHASE_AGENTS
    sequence = 0
    for phase in PHASE_ORDER:
        for agent_name in PHASE_AGENTS[phase]:
            sequence += 1
            agent_record = AnalysisAgent(
                analysis_id=analysis.id,
                name=agent_name,
                phase=AgentPhase(phase),
                sequence=sequence,
                status=AgentStatus.PENDING,
                provider=request.provider,
                model=request.model,
            )
            db.add(agent_record)
    await db.commit()

    # Create queue and start background task
    queue: asyncio.Queue = asyncio.Queue()
    _analysis_queues[analysis.id] = queue

    task = asyncio.create_task(
        _run_analysis(analysis.id, current_user.id, request, queue)
    )
    _active_tasks[analysis.id] = task

    return {"analysis_id": analysis.id, "status": "pending"}


@router.get("/analysis/stream/{analysis_id}")
async def stream_analysis(
    analysis_id: int,
    request: Request,
    token: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    # EventSource can't send custom headers, so accept token as query param
    if token:
        from app.core.security import decode_token, verify_token_type
        payload = decode_token(token)
        if not payload or not verify_token_type(payload, "access"):
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        result = await db.execute(select(User).where(User.id == user_id))
        current_user = result.scalar_one_or_none()
        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")
    else:
        raise HTTPException(status_code=401, detail="Token required")

    queue = _analysis_queues.get(analysis_id)
    if not queue:
        queue = asyncio.Queue()
        await queue.put({"type": "done", "analysis_id": analysis_id})

    return StreamingResponse(
        sse_generator(queue, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/analysis/{analysis_id}")
async def get_analysis(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Analysis).where(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Fetch agent records
    agent_result = await db.execute(
        select(AnalysisAgent)
        .where(AnalysisAgent.analysis_id == analysis_id)
        .order_by(AnalysisAgent.sequence)
    )
    agents = agent_result.scalars().all()

    return {
        "id": analysis.id,
        "ticker": analysis.ticker,
        "status": analysis.status.value,
        "progress": analysis.progress,
        "current_phase": analysis.current_phase.value if analysis.current_phase else None,
        "current_agent": analysis.current_agent,
        "final_recommendation": analysis.final_recommendation,
        "confidence_score": analysis.confidence_score,
        "risk_score": analysis.risk_score,
        "config_snapshot": analysis.config_snapshot,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
        "started_at": analysis.started_at.isoformat() if analysis.started_at else None,
        "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
        "agents": [
            {
                "id": a.id,
                "name": a.name,
                "phase": a.phase.value,
                "status": a.status.value,
                "provider": a.provider,
                "model": a.model,
                "output_data": a.output_data,
                "error_message": a.error_message,
                "tokens_used": a.tokens_used,
                "duration_ms": int((a.completed_at - a.started_at).total_seconds() * 1000)
                if a.completed_at and a.started_at
                else 0,
            }
            for a in agents
        ],
    }


@router.get("/analysis")
async def list_analyses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Analysis)
        .where(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .limit(50)
    )
    analyses = result.scalars().all()
    return [
        {
            "id": a.id,
            "ticker": a.ticker,
            "status": a.status.value,
            "progress": a.progress,
            "final_recommendation": a.final_recommendation,
            "confidence_score": a.confidence_score,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in analyses
    ]


@router.post("/analysis/{analysis_id}/cancel")
async def cancel_analysis(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = _active_tasks.pop(analysis_id, None)
    if task and not task.done():
        task.cancel()

    result = await db.execute(
        select(Analysis).where(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis.status = AnalysisStatus.CANCELLED
    analysis.completed_at = datetime.now(timezone.utc)
    await db.commit()

    queue = _analysis_queues.get(analysis_id)
    if queue:
        await queue.put({"type": "done", "analysis_id": analysis_id})

    return {"status": "cancelled"}


# ---------------------------------------------------------------------------
# Background runner
# ---------------------------------------------------------------------------

async def _run_analysis(
    analysis_id: int,
    user_id: int,
    request: AnalysisRequest,
    queue: asyncio.Queue,
):
    """Background task that runs the workflow and streams events."""
    from app.core.database import async_session_maker

    try:
        async with async_session_maker() as db:
            # Mark analysis as running
            result = await db.execute(
                select(Analysis).where(Analysis.id == analysis_id)
            )
            analysis = result.scalar_one_or_none()
            if not analysis:
                return

            analysis.status = AnalysisStatus.RUNNING
            analysis.started_at = datetime.now(timezone.utc)
            await db.commit()

        # Run the workflow
        engine = WorkflowEngine(provider=request.provider, model=request.model)
        result_data = await engine.run(
            ticker=request.ticker.upper(),
            event_queue=queue,
            analysis_id=analysis_id,
            selected_analysts=request.analysts,
            date=request.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        )

        # Update analysis with results
        async with async_session_maker() as db:
            result = await db.execute(
                select(Analysis).where(Analysis.id == analysis_id)
            )
            analysis = result.scalar_one_or_none()
            if analysis:
                analysis.status = AnalysisStatus.COMPLETED
                analysis.completed_at = datetime.now(timezone.utc)
                analysis.final_recommendation = result_data.get("recommendation", "")
                analysis.confidence_score = result_data.get("confidence", 0.0)
                analysis.risk_score = result_data.get("risk_score", 0.0)
                analysis.progress = 100
                await db.commit()

            # Update individual agent records
            for agent_data in result_data.get("agents", []):
                agent_result = await db.execute(
                    select(AnalysisAgent).where(
                        AnalysisAgent.analysis_id == analysis_id,
                        AnalysisAgent.name == agent_data["name"],
                    )
                )
                agent_record = agent_result.scalar_one_or_none()
                if agent_record:
                    agent_record.status = (
                        AgentStatus.COMPLETED if agent_data["status"] == "completed"
                        else AgentStatus.FAILED
                    )
                    agent_record.output_data = {"content": agent_data.get("content", "")}
                    agent_record.tokens_used = agent_data.get("tokens_used", 0)
                    agent_record.started_at = datetime.now(timezone.utc)
                    agent_record.completed_at = datetime.now(timezone.utc)
            await db.commit()

        # Send result event
        await queue.put({
            "type": "result",
            "analysis_id": analysis_id,
            "ticker": result_data.get("ticker", ""),
            "recommendation": result_data.get("recommendation", ""),
            "confidence": result_data.get("confidence", 0.0),
            "risk_score": result_data.get("risk_score", 0.0),
            "summary": result_data.get("summary", ""),
            "agents": result_data.get("agents", []),
        })

        await queue.put({"type": "done", "analysis_id": analysis_id})

    except asyncio.CancelledError:
        logger.info("Analysis %s cancelled", analysis_id)
        async with async_session_maker() as db:
            result = await db.execute(
                select(Analysis).where(Analysis.id == analysis_id)
            )
            analysis = result.scalar_one_or_none()
            if analysis:
                analysis.status = AnalysisStatus.CANCELLED
                analysis.completed_at = datetime.now(timezone.utc)
                await db.commit()
        await queue.put({"type": "done", "analysis_id": analysis_id})

    except Exception as e:
        logger.exception("Analysis %s failed", analysis_id)
        async with async_session_maker() as db:
            result = await db.execute(
                select(Analysis).where(Analysis.id == analysis_id)
            )
            analysis = result.scalar_one_or_none()
            if analysis:
                analysis.status = AnalysisStatus.FAILED
                analysis.error_message = str(e)
                analysis.completed_at = datetime.now(timezone.utc)
                await db.commit()

        await queue.put({"type": "error", "analysis_id": analysis_id, "error": str(e)})
        await queue.put({"type": "done", "analysis_id": analysis_id})

    finally:
        _analysis_queues.pop(analysis_id, None)
        _active_tasks.pop(analysis_id, None)
