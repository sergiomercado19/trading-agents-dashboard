from __future__ import annotations

from fastapi import APIRouter, Request

from backend.app.core.sse import create_sse_response
from backend.app.services.run_manager import run_manager

router = APIRouter(prefix="/api", tags=["stream"])


@router.get("/stream")
async def stream_events(request: Request, run_id: str | None = None):
    if run_id:
        queue = await run_manager.get_queue(run_id)
        if not queue:
            # Create a queue that just sends done immediately
            import asyncio
            queue = asyncio.Queue()
            await queue.put({"type": "done", "run_id": run_id})
    else:
        # Global stream — return snapshot of all runs then ping
        import asyncio
        queue = asyncio.Queue()
        runs = await run_manager.list_runs()
        for run in runs:
            await queue.put({"type": "snapshot", "data": run.model_dump()})
        await queue.put({"type": "ping", "data": {}})

    return create_sse_response(queue, request)
