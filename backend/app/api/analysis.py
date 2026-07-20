from __future__ import annotations

import asyncio
import json
import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
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
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token")
        try:
            user_id = int(sub)
        except (TypeError, ValueError):
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
    page: int = 1,
    limit: int = 20,
    status: str | None = None,
    ticker: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    limit = min(limit, 100)
    page = max(page, 1)
    offset = (page - 1) * limit

    query = select(Analysis).where(Analysis.user_id == current_user.id)
    count_query = select(func.count(Analysis.id)).where(Analysis.user_id == current_user.id)

    if status:
        query = query.where(Analysis.status == status)
        count_query = count_query.where(Analysis.status == status)

    if ticker:
        query = query.where(Analysis.ticker.ilike(f"%{ticker}%"))
        count_query = count_query.where(Analysis.ticker.ilike(f"%{ticker}%"))

    if search:
        search_filter = Analysis.ticker.ilike(f"%{search}%") | Analysis.final_recommendation.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(
        query.order_by(Analysis.created_at.desc()).offset(offset).limit(limit)
    )
    analyses = result.scalars().all()

    pages = max(1, -(-total // limit))  # ceil division

    return {
        "items": [
            {
                "id": a.id,
                "ticker": a.ticker,
                "status": a.status.value,
                "final_recommendation": a.final_recommendation,
                "confidence_score": a.confidence_score,
                "risk_score": a.risk_score,
                "current_phase": a.current_phase.value if a.current_phase else None,
                "progress": a.progress,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "updated_at": a.updated_at.isoformat() if a.updated_at else None,
            }
            for a in analyses
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
    }


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


@router.delete("/analysis/{analysis_id}")
async def delete_analysis(
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

    task = _active_tasks.pop(analysis_id, None)
    if task and not task.done():
        task.cancel()

    queue = _analysis_queues.get(analysis_id)
    if queue:
        _analysis_queues.pop(analysis_id, None)

    await db.delete(analysis)
    await db.commit()

    return {"ok": True}


@router.post("/analysis/bulk-delete")
async def bulk_delete_analyses(
    request_body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ids = request_body.get("ids", [])
    if not ids or not isinstance(ids, list):
        raise HTTPException(status_code=400, detail="ids must be a non-empty list")

    result = await db.execute(
        select(Analysis).where(
            Analysis.id.in_(ids),
            Analysis.user_id == current_user.id,
        )
    )
    analyses = result.scalars().all()

    deleted_count = 0
    for analysis in analyses:
        task = _active_tasks.pop(analysis.id, None)
        if task and not task.done():
            task.cancel()
        _analysis_queues.pop(analysis.id, None)
        await db.delete(analysis)
        deleted_count += 1

    await db.commit()

    return {"deleted": deleted_count}


@router.post("/analysis/{analysis_id}/retry")
async def retry_analysis(
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
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Analysis not found")

    if original.status.value not in ("failed", "cancelled", "stale"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot retry analysis with status '{original.status.value}'",
        )

    config = original.config_snapshot or {}
    date = config.get("date", "") or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Create new analysis from the same config
    new_analysis = Analysis(
        user_id=current_user.id,
        ticker=original.ticker,
        status=AnalysisStatus.PENDING,
        config_snapshot=config,
    )
    db.add(new_analysis)
    await db.flush()

    # Create agent records
    from app.agents import PHASE_ORDER, PHASE_AGENTS
    sequence = 0
    for phase in PHASE_ORDER:
        for agent_name in PHASE_AGENTS[phase]:
            sequence += 1
            agent_record = AnalysisAgent(
                analysis_id=new_analysis.id,
                name=agent_name,
                phase=AgentPhase(phase),
                sequence=sequence,
                status=AgentStatus.PENDING,
                provider=config.get("provider", "openai"),
                model=config.get("model", "gpt-4o-mini"),
            )
            db.add(agent_record)
    await db.commit()

    # Create queue and start background task
    queue: asyncio.Queue = asyncio.Queue()
    _analysis_queues[new_analysis.id] = queue

    request = AnalysisRequest(
        ticker=original.ticker,
        date=date,
        analysts=config.get("analysts", ["market", "news", "social", "fundamentals"]),
        research_depth=config.get("research_depth", 3),
        provider=config.get("provider", "openai"),
        model=config.get("model", "gpt-4o-mini"),
    )
    task = asyncio.create_task(
        _run_analysis(new_analysis.id, current_user.id, request, queue)
    )
    _active_tasks[new_analysis.id] = task

    return {"analysis_id": new_analysis.id, "status": "pending"}


# ---------------------------------------------------------------------------
# Stale workflow reactivation
# ---------------------------------------------------------------------------

async def mark_stale_analyses():
    """Mark analyses stuck in 'running' state as 'stale'. Called on startup."""
    from app.core.database import async_session_maker

    try:
        async with async_session_maker() as db:
            from datetime import timedelta
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
            result = await db.execute(
                select(Analysis).where(
                    Analysis.status == AnalysisStatus.RUNNING,
                    Analysis.updated_at < cutoff,
                )
            )
            stale = result.scalars().all()
            for analysis in stale:
                analysis.status = AnalysisStatus.STALE
                analysis.error_message = "Analysis was running when server restarted"
                analysis.completed_at = datetime.now(timezone.utc)
                queue = _analysis_queues.pop(analysis.id, None)
                _active_tasks.pop(analysis.id, None)
            if stale:
                await db.commit()
                logger.warning("Marked %d stale analyses", len(stale))
    except Exception:
        logger.exception("Failed to mark stale analyses")


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
