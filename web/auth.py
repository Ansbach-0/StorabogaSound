"""Discord OAuth2 flow and session management via signed HTTP-only cookies."""

from __future__ import annotations

import os
import secrets
from urllib.parse import urlencode
import aiosqlite
from fastapi import Request, Response
import httpx
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from bot.db.queries import get_server_config

OAUTH_AUTHORIZE_URL = "https://discord.com/api/oauth2/authorize"
OAUTH_TOKEN_URL = "https://discord.com/api/oauth2/token"
OAUTH_SCOPES = ["identify", "guilds", "guilds.members.read"]

COOKIE_NAME = "storaboga_session"
MAX_AGE = 7 * 24 * 3600  # 7 days in seconds

_sessions: dict[str, dict] = {}  # session_id → {user_id, username, avatar_url, guild_id, tier, access_token}


def create_session(user_data: dict, access_token: str) -> str:
    """Create server-side session, return session_id to store in cookie."""
    session_id = secrets.token_urlsafe(32)
    _sessions[session_id] = {**user_data, "access_token": access_token}
    return session_id


def get_session_data(session_id: str | None) -> dict | None:
    """Retrieve session data by session_id. Returns None if not found."""
    if not session_id:
        return None
    return _sessions.get(session_id)


def clear_session(session_id: str) -> None:
    """Remove a session from the store."""
    _sessions.pop(session_id, None)



def get_serializer() -> URLSafeTimedSerializer:
    secret = os.getenv("SECRET_KEY", "storaboga_default_secret_key_change_me")
    return URLSafeTimedSerializer(secret, salt="storaboga_session_salt")


async def get_oauth_url(client_id: str | None = None, redirect_uri: str | None = None) -> str:
    """Build the Discord OAuth2 authorization URL with scopes."""
    cid = client_id or os.getenv("DISCORD_CLIENT_ID", "")
    r_uri = redirect_uri or os.getenv("DISCORD_REDIRECT_URI", "http://localhost:2497/auth/callback")
    params = {
        "client_id": cid,
        "redirect_uri": r_uri,
        "response_type": "code",
        "scope": " ".join(OAUTH_SCOPES),
    }
    return f"{OAUTH_AUTHORIZE_URL}?{urlencode(params)}"


async def exchange_code(
    code: str,
    client_id: str | None = None,
    client_secret: str | None = None,
    redirect_uri: str | None = None,
) -> dict:
    """Exchange OAuth2 code for access token via httpx POST to Discord token endpoint."""
    cid = client_id or os.getenv("DISCORD_CLIENT_ID", "")
    csecret = client_secret or os.getenv("DISCORD_CLIENT_SECRET", "")
    r_uri = redirect_uri or os.getenv("DISCORD_REDIRECT_URI", "http://localhost:2497/auth/callback")
    payload = {
        "client_id": cid,
        "client_secret": csecret,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": r_uri,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    async with httpx.AsyncClient() as client:
        res = await client.post(OAUTH_TOKEN_URL, data=payload, headers=headers)
        res.raise_for_status()
        return res.json()


async def fetch_user_profile(access_token: str) -> dict:
    """GET https://discord.com/api/users/@me — returns id, username, avatar hash."""
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient() as client:
        res = await client.get("https://discord.com/api/users/@me", headers=headers)
        res.raise_for_status()
        return res.json()


async def fetch_user_guilds(access_token: str) -> list[dict]:
    """GET https://discord.com/api/users/@me/guilds — returns list of guilds."""
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient() as client:
        res = await client.get("https://discord.com/api/users/@me/guilds", headers=headers)
        res.raise_for_status()
        return res.json()


def get_avatar_url(user_id: str, avatar_hash: str | None) -> str | None:
    """Build CDN avatar URL from user_id + avatar_hash. Return None if no avatar (use default avatar)."""
    if not avatar_hash:
        return None
    return f"https://cdn.discordapp.com/avatars/{user_id}/{avatar_hash}.png"


async def fetch_member_roles(access_token: str, guild_id: str) -> list[str]:
    """Fetch user's role IDs in a specific guild via Discord API."""
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://discord.com/api/users/@me/guilds/{guild_id}/member",
            headers=headers,
        )
        if res.status_code == 200:
            data = res.json()
            return data.get("roles", [])
    return []


async def determine_tier(
    user_id: str,
    guilds: list[dict],
    guild_id: str,
    db: aiosqlite.Connection | None,
    bot_owner_id: int,
    access_token: str | None = None,
) -> str:
    """Determine user's permission tier ('user' | 'moderator' | 'admin') for a specific guild.
    - Admin: guild owner or bot owner
    - Moderator: has DJ role (from DB server_configs)
    - User: default
    """
    try:
        if int(user_id) == bot_owner_id:
            return "admin"
    except (ValueError, TypeError):
        pass

    guild_obj = next((g for g in guilds if str(g.get("id")) == str(guild_id)), None)

    if guild_obj and guild_obj.get("owner") is True:
        return "admin"

    if db is not None and guild_id:
        config = await get_server_config(db, str(guild_id))
        if config and config.dj_role_id and access_token:
            roles = await fetch_member_roles(access_token, str(guild_id))
            if config.dj_role_id in roles:
                return "moderator"

    return "user"


def set_session_cookie(response: Response, session_id: str) -> None:
    """Serialize session_id and set signed HTTP-only cookie."""
    serializer = get_serializer()
    token = serializer.dumps(session_id)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=MAX_AGE,
        httponly=True,
        samesite="lax",
    )


def get_session_id_from_cookie(request: Request) -> str | None:
    """Extract and verify signed session_id cookie."""
    cookie = request.cookies.get(COOKIE_NAME)
    if not cookie:
        return None
    serializer = get_serializer()
    try:
        session_id = serializer.loads(cookie, max_age=MAX_AGE)
        return session_id
    except (BadSignature, SignatureExpired):
        return None


def clear_session_cookie(response: Response) -> None:
    """Delete session cookie."""
    response.delete_cookie(key=COOKIE_NAME, httponly=True, samesite="lax")
