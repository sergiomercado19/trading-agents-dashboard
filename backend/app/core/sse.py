from __future__ import annotations

import asyncio
import json
import time
from typing import Any

from starlette.requests import Request
from starlette.responses import StreamingResponse


async def sse_generator(queue: asyncio.Queue, request: Request):
    """Yield SSE-formatted events from an asyncio.Queue."""
    while True:
        if await request.is_disconnected():
            break
        try:
            event: dict[str, Any] = await asyncio.wait_for(queue.get(), timeout=20)
            event_type = event.get("type", "message")
            data = json.dumps(event, default=str)
            yield f"event: {event_type}\ndata: {data}\n\n"
            if event_type == "done":
                break
        except asyncio.TimeoutError:
            yield "event: ping\ndata: {}\n\n"


def create_sse_response(queue: asyncio.Queue, request: Request) -> StreamingResponse:
    return StreamingResponse(
        sse_generator(queue, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
