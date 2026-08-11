"""REST API endpoints matching SPEC conventions."""

from __future__ import annotations

import math
import time
from typing import Any
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import psutil

from bot.db.models import ServerConfig
from bot.db import queries
from web.auth import get_session_data, get_session_id_from_cookie
from web.shared_state import SharedState

router = APIRouter()


class SettingsPatch(BaseModel):
    dj_role_id: str | None = None
    default_volume: int | None = None


def get_session_user(request: Request) -> dict | None:
    """Retrieve session data from in-memory session store using session_id from cookie."""
    session_id = get_session_id_from_cookie(request)
    return get_session_data(session_id)


def require_user(request: Request) -> dict:
    """Require an authenticated user session."""
    user = get_session_user(request)
    if not user or not user.get("user_id"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


def require_moderator(request: Request) -> dict:
    """Require user session with moderator or admin tier."""
    user = require_user(request)
    tier = user.get("tier", "user")
    if tier not in ("moderator", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden: Moderator tier required")
    return user


def require_admin(request: Request) -> dict:
    """Require user session with admin tier."""
    user = require_user(request)
    tier = user.get("tier", "user")
    if tier != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin tier required")
    return user


def get_guild_id(request: Request, session_user: dict | None = None) -> int:
    """Determine target guild ID from session, query params, or bot guilds."""
    if session_user and session_user.get("guild_id"):
        try:
            return int(session_user["guild_id"])
        except ValueError:
            pass

    query_g = request.query_params.get("guild_id")
    if query_g:
        try:
            return int(query_g)
        except ValueError:
            pass

    state: SharedState = request.app.state.state
    if state.bot.guilds:
        return state.bot.guilds[0].id
    return 0


@router.get("/me")
async def get_me(request: Request) -> dict[str, Any]:
    """Get current authenticated user info."""
    user = require_user(request)
    return {
        "id": user["user_id"],
        "username": user.get("username", "User"),
        "avatar_url": user.get("avatar_url"),
        "guild_id": str(user.get("guild_id", "")),
        "tier": user.get("tier", "user"),
    }


@router.get("/now-playing")
async def get_now_playing(request: Request) -> dict[str, Any] | None:
    """Get currently active track or null."""
    state: SharedState = request.app.state.state
    session_user = get_session_user(request)
    guild_id = get_guild_id(request, session_user)

    active = state.player.queue_manager.get_active(guild_id)
    if not active:
        return None
    return active.to_dict()


@router.get("/queue")
async def get_queue(request: Request) -> dict[str, Any]:
    """Get current queue state."""
    state: SharedState = request.app.state.state
    session_user = get_session_user(request)
    guild_id = get_guild_id(request, session_user)

    return state.player.queue_manager.to_queue_state(guild_id)


@router.post("/skip")
async def post_skip(request: Request) -> dict[str, bool]:
    """Skip currently playing track."""
    state: SharedState = request.app.state.state
    session_user = require_user(request)
    guild_id = get_guild_id(request, session_user)

    await state.player.skip(guild_id)
    return {"ok": True}


@router.post("/pause")
async def post_pause(request: Request) -> dict[str, Any]:
    """Toggle pause/resume playback."""
    state: SharedState = request.app.state.state
    session_user = require_moderator(request)
    guild_id = get_guild_id(request, session_user)

    paused = await state.player.pause(guild_id)
    return {"ok": True, "paused": paused}


@router.post("/leave")
async def post_leave(request: Request) -> dict[str, bool]:
    """Leave voice channel and clear queue."""
    state: SharedState = request.app.state.state
    session_user = require_moderator(request)
    guild_id = get_guild_id(request, session_user)

    await state.player.leave(guild_id)
    return {"ok": True}


@router.get("/volume")
async def get_volume(request: Request) -> dict[str, int]:
    """Get current playback volume."""
    state: SharedState = request.app.state.state
    session_user = get_session_user(request)
    guild_id = get_guild_id(request, session_user)

    if guild_id in state.player._volumes:
        return {"volume": state.player._volumes[guild_id]}

    config = await queries.get_server_config(state.db, str(guild_id))
    vol = config.default_volume if config else 50
    return {"volume": vol}


@router.post("/volume/{value}")
async def post_volume(value: int, request: Request) -> dict[str, Any]:
    """Set playback volume (0-100)."""
    state: SharedState = request.app.state.state
    session_user = require_moderator(request)
    guild_id = get_guild_id(request, session_user)

    guild_obj = next((g for g in state.bot.guilds if g.id == guild_id), None)
    if guild_obj:
        new_vol = await state.player.set_volume(guild_obj, value)
    else:
        new_vol = max(0, min(100, value))
        state.player._volumes[guild_id] = new_vol

    # Persist volume to DB
    config = await queries.get_server_config(state.db, str(guild_id))
    dj_role = config.dj_role_id if config else None
    await queries.set_server_config(
        state.db,
        ServerConfig(guild_id=str(guild_id), dj_role_id=dj_role, default_volume=new_vol),
    )

    return {"ok": True, "volume": new_vol}


@router.get("/settings")
async def get_settings(request: Request) -> dict[str, Any]:
    """Get server settings."""
    state: SharedState = request.app.state.state
    session_user = get_session_user(request)
    guild_id = get_guild_id(request, session_user)

    config = await queries.get_server_config(state.db, str(guild_id))
    if not config:
        return {"dj_role_id": None, "default_volume": 50}

    return {
        "dj_role_id": config.dj_role_id,
        "default_volume": config.default_volume,
    }


@router.patch("/settings")
async def patch_settings(patch: SettingsPatch, request: Request) -> dict[str, Any]:
    """Update server settings (admin only)."""
    state: SharedState = request.app.state.state
    session_user = require_admin(request)
    guild_id = get_guild_id(request, session_user)

    config = await queries.get_server_config(state.db, str(guild_id))
    dj_role_id = patch.dj_role_id if patch.dj_role_id is not None else (config.dj_role_id if config else None)
    default_vol = (
        max(0, min(100, patch.default_volume))
        if patch.default_volume is not None
        else (config.default_volume if config else 50)
    )

    new_config = ServerConfig(
        guild_id=str(guild_id),
        dj_role_id=dj_role_id,
        default_volume=default_vol,
    )
    await queries.set_server_config(state.db, new_config)

    return {
        "dj_role_id": new_config.dj_role_id,
        "default_volume": new_config.default_volume,
    }


@router.get("/status")
async def get_status(request: Request) -> dict[str, Any]:
    """Get bot system status metrics."""
    state: SharedState = request.app.state.state
    uptime_seconds = int(time.time() - state.started_at)
    servers_connected = len(state.bot.guilds)
    voice_connections = len(state.bot.voice_clients)

    latency = state.bot.latency
    latency_ms = round(latency * 1000) if (latency and not math.isinf(latency) and not math.isnan(latency)) else 0

    mem_rss = psutil.Process().memory_info().rss
    memory_mb = round(mem_rss / 1024 / 1024, 2)

    return {
        "uptime_seconds": uptime_seconds,
        "servers_connected": servers_connected,
        "voice_connections": voice_connections,
        "latency_ms": latency_ms,
        "memory_mb": memory_mb,
        "memory_limit_mb": 1024,
        "version": "1.0.0",
    }


@router.get("/history")
async def get_history(request: Request) -> list[dict[str, Any]]:
    """Get recent track playback history (last 20)."""
    state: SharedState = request.app.state.state
    session_user = get_session_user(request)
    guild_id = get_guild_id(request, session_user)

    entries = await queries.get_history(state.db, str(guild_id), limit=20)
    return [
        {
            "id": entry.track_id,
            "title": entry.title,
            "artist": entry.artist,
            "album": entry.album,
            "url": entry.url,
            "duration_ms": entry.duration_ms,
            "position_ms": 0,
            "artwork_url": entry.artwork_url,
            "accent_hex": entry.accent_hex,
            "requester": {
                "id": entry.requester_id,
                "name": entry.requester_name,
                "avatar_url": None,
            },
            "source": entry.source or "youtube",
            "is_active": False,
            "added_at": entry.played_at,
        }
        for entry in entries
    ]
