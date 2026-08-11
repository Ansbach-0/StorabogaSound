"""SSE endpoint for real-time updates via sse-starlette."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from web.shared_state import SharedState

logger = logging.getLogger(__name__)

router = APIRouter()


async def event_generator(request: Request, state: SharedState) -> AsyncGenerator[dict, None]:
    """Generate SSE events matching the SPEC's SSE Event Contract."""
    q = state.broadcaster.subscribe()
    try:
        # On connect: send {status: "connected"} as "connection" event
        yield {"event": "connection", "data": json.dumps({"status": "connected"})}

        while True:
            if await request.is_disconnected():
                break
            try:
                msg = await asyncio.wait_for(q.get(), timeout=1.0)
                yield msg
            except asyncio.TimeoutError:
                continue
    except Exception as e:
        logger.debug(f"SSE subscriber disconnected: {e}")
    finally:
        state.broadcaster.unsubscribe(q)


@router.get("/events")
async def sse_events(request: Request) -> EventSourceResponse:
    """Stream real-time server events via SSE."""
    state: SharedState = request.app.state.state
    return EventSourceResponse(event_generator(request, state))
