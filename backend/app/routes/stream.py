from __future__ import annotations

import asyncio
from fastapi import APIRouter, HTTPException, Request

from app.core.sse import create_sse_response
from app.services.run_manager import run_manager

router = APIRouter(prefix="/api", tags=["stream"])


@router.get("/stream")
async def stream_events(request: Request, run_id: str | None = None):
    if run_id:
        run = await run_manager.get(run_id)
        queue = await run_manager.get_queue(run_id)
        if not queue:
            raise HTTPException(status_code=404, detail="Run queue not found")
        if run:
            # Send initial snapshot so the frontend knows the current state
            await queue.put({"type": "snapshot", "data": run.model_dump()})
    else:
        # Global stream — return snapshot of all runs then ping
        queue = asyncio.Queue()
        runs = await run_manager.list_runs()
        for run in runs:
            await queue.put({"type": "snapshot", "data": run.model_dump()})
        await queue.put({"type": "ping", "data": {}})

    return create_sse_response(queue, request)
