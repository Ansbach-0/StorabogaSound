"""Full FastAPI web server application for Storaboga Sound."""

from __future__ import annotations

import logging
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from web import auth
from web.routes.api import router as api_router
from web.routes.sse import router as sse_router
from web.shared_state import SharedState

logger = logging.getLogger(__name__)


def create_app(state: SharedState) -> FastAPI:
    """Create FastAPI app with all routes."""
    app = FastAPI(title="Storaboga Sound")
    app.state.state = state

    # OAuth routes (not in /api prefix)
    @app.get("/auth/login")
    async def auth_login() -> RedirectResponse:
        """Redirect to Discord OAuth2 authorization URL."""
        client_id = os.getenv("DISCORD_CLIENT_ID", "")
        redirect_uri = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:2497/auth/callback")
        url = await auth.get_oauth_url(client_id, redirect_uri)
        return RedirectResponse(url)

    @app.get("/auth/callback")
    async def auth_callback(code: str, request: Request) -> RedirectResponse:
        """Exchange code for token, fetch user profile + guilds, set session cookie."""
        client_id = os.getenv("DISCORD_CLIENT_ID", "")
        client_secret = os.getenv("DISCORD_CLIENT_SECRET", "")
        redirect_uri = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:2497/auth/callback")

        try:
            tokens = await auth.exchange_code(code, client_id, client_secret, redirect_uri)
            access_token = tokens["access_token"]
            profile = await auth.fetch_user_profile(access_token)
            guilds = await auth.fetch_user_guilds(access_token)

            user_id = str(profile["id"])
            username = profile.get("global_name") or profile.get("username") or "User"
            avatar_hash = profile.get("avatar")
            avatar_url = auth.get_avatar_url(user_id, avatar_hash)

            guild_id = ""
            if guilds:
                bot_guild_ids = {str(g.id) for g in state.bot.guilds}
                matching = next((str(g["id"]) for g in guilds if str(g["id"]) in bot_guild_ids), None)
                guild_id = matching or str(guilds[0]["id"])

            bot_owner_id = state.bot.owner_id or 0
            tier = await auth.determine_tier(
                user_id=user_id,
                guilds=guilds,
                guild_id=guild_id,
                db=state.db,
                bot_owner_id=bot_owner_id,
                access_token=access_token,
            )

            user_data = {
                "user_id": user_id,
                "username": username,
                "avatar_url": avatar_url,
                "guild_id": guild_id,
                "tier": tier,
            }
            session_id = auth.create_session(user_data, access_token)

            response = RedirectResponse(url="/")
            auth.set_session_cookie(response, session_id)
            return response
        except Exception as e:
            logger.error(f"OAuth2 callback error: {e}")
            return RedirectResponse(url="/?auth_error=1")

    @app.post("/auth/logout")
    async def auth_logout(request: Request) -> JSONResponse:
        """Clear session cookie."""
        session_id = auth.get_session_id_from_cookie(request)
        if session_id:
            auth.clear_session(session_id)
        response = JSONResponse(content={"ok": True})
        auth.clear_session_cookie(response)
        return response

    # Mount API router
    app.include_router(api_router, prefix="/api")

    # Mount SSE router
    app.include_router(sse_router, prefix="/api")

    # Serve static frontend — mount assets at /assets to avoid shadowing /auth routes
    dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
    if os.path.isdir(dist_path):
        app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="static-assets")

        # Serve index.html at root, and for any non-API/non-auth path (SPA fallback)
        @app.get("/")
        async def serve_index():
            index_path = os.path.join(dist_path, "index.html")
            if os.path.isfile(index_path):
                from starlette.responses import FileResponse
                return FileResponse(index_path)
            return JSONResponse(content={"error": "frontend not built"}, status_code=404)

        # Serve other static files (favicon, vite.svg, etc.) from dist root
        @app.get("/{filename:path}")
        async def serve_static_fallback(filename: str):
            # Don't intercept API or auth routes
            if filename.startswith(("api/", "auth/")):
                return JSONResponse(content={"detail": "Not Found"}, status_code=404)
            file_path = os.path.join(dist_path, filename)
            if os.path.isfile(file_path):
                from starlette.responses import FileResponse
                return FileResponse(file_path)
            # SPA fallback: serve index.html for client-side routing
            index_path = os.path.join(dist_path, "index.html")
            if os.path.isfile(index_path):
                from starlette.responses import FileResponse
                return FileResponse(index_path)
            return JSONResponse(content={"detail": "Not Found"}, status_code=404)

    return app
