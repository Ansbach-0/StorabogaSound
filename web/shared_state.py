"""Shared state memory bridge between bot and web server."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
import json
import logging
import aiosqlite
from discord.ext import commands

from bot.audio.player import AudioPlayer
from bot.audio.queue_manager import QueueManager

logger = logging.getLogger(__name__)


class EventBroadcaster:
    """Manages SSE subscriber queues and broadcasts events."""

    def __init__(self) -> None:
        self._subscribers: list[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        if q in self._subscribers:
            self._subscribers.remove(q)

    async def broadcast(self, event: str, data: dict) -> None:
        message = {"event": event, "data": json.dumps(data)}
        for q in list(self._subscribers):
            await q.put(message)


@dataclass
class SharedState:
    """Memory bridge between bot and web server (shared process)."""

    bot: commands.Bot
    player: AudioPlayer
    queue_manager: QueueManager
    db: aiosqlite.Connection
    started_at: float  # time.time() for uptime calculation
    broadcaster: EventBroadcaster
