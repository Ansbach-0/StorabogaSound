"""Storaboga Sound — Discord music bot + web dashboard entry point."""

import asyncio
import logging
import os
import sys
import time
import discord
from discord.ext import commands
from dotenv import load_dotenv
import uvicorn

from bot.audio.player import AudioPlayer
from bot.db.queries import init_db
from web.app import create_app
from web.shared_state import EventBroadcaster, SharedState

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("storaboga")


async def main() -> None:
    load_dotenv()

    token = os.getenv("DISCORD_TOKEN")
    client_id = os.getenv("DISCORD_CLIENT_ID")
    client_secret = os.getenv("DISCORD_CLIENT_SECRET")
    redirect_uri = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:2497/auth/callback")
    web_host = os.getenv("WEB_HOST", "0.0.0.0")
    web_port_str = os.getenv("WEB_PORT", "2497")
    secret_key = os.getenv("SECRET_KEY", "generate_a_random_secret_key_here")
    db_path = os.getenv("DB_PATH", "storaboga.db")
    ffmpeg_path = os.getenv("FFMPEG_PATH", "ffmpeg")
    bot_owner_id_str = os.getenv("BOT_OWNER_ID")

    missing_env = []
    if not token or token == "your_bot_token_here":
        missing_env.append("DISCORD_TOKEN")
    if not client_id or client_id == "your_oauth2_client_id_here":
        missing_env.append("DISCORD_CLIENT_ID")
    if not client_secret or client_secret == "your_oauth2_client_secret_here":
        missing_env.append("DISCORD_CLIENT_SECRET")

    if missing_env:
        logger.error(
            f"Missing or unconfigured required environment variable(s) in .env: {', '.join(missing_env)}. "
            f"Please edit .env and set valid credentials."
        )
        sys.exit(1)

    try:
        web_port = int(web_port_str)
    except ValueError:
        logger.error(f"Invalid WEB_PORT environment variable: {web_port_str}")
        sys.exit(1)

    intents = discord.Intents.default()
    intents.message_content = False
    intents.voice_states = True
    intents.guilds = True
    intents.members = True

    bot = commands.Bot(command_prefix="!", intents=intents)

    if bot_owner_id_str:
        try:
            bot.owner_id = int(bot_owner_id_str)
        except ValueError:
            logger.warning(f"Invalid BOT_OWNER_ID environment variable: {bot_owner_id_str}")

    broadcaster = EventBroadcaster()
    db = await init_db(db_path)
    player = AudioPlayer(bot, db=db, broadcaster=broadcaster, ffmpeg_path=ffmpeg_path)

    # Attach db and player references to bot instance for cogs/helpers
    bot.db = db  # type: ignore[attr-defined]
    bot.player = player  # type: ignore[attr-defined]

    state = SharedState(
        bot=bot,
        player=player,
        queue_manager=player.queue_manager,
        db=db,
        started_at=time.time(),
        broadcaster=broadcaster,
    )
    bot.shared_state = state  # type: ignore[attr-defined]


    # Load cogs
    cogs = [
        "bot.cogs.playback",
        "bot.cogs.queue_cmds",
        "bot.cogs.nowplaying",
        "bot.cogs.controls",
    ]
    for cog in cogs:
        await bot.load_extension(cog)
        logger.info(f"Loaded cog: {cog}")

    @bot.event
    async def on_ready() -> None:
        if bot.owner_id is None:
            app_info = await bot.application_info()
            bot.owner_id = app_info.owner.id
        if bot.user:
            logger.info(f"Logged in as {bot.user} (ID: {bot.user.id})")
        try:
            synced = await bot.tree.sync()
            logger.info(f"Synced {len(synced)} app command(s)")
        except Exception as e:
            logger.error(f"Failed to sync app commands: {e}")
        print(f"Storaboga Sound online — logged in as {bot.user}")

    app = create_app(state)
    config = uvicorn.Config(app=app, host=web_host, port=web_port, log_level="warning")
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(server.serve())

    try:
        await bot.start(token)
    except (KeyboardInterrupt, asyncio.CancelledError):
        logger.info("Shutdown signal received")
    finally:
        logger.info("Initiating graceful shutdown...")
        server.should_exit = True
        if not server_task.done():
            server_task.cancel()
        for vc in list(bot.voice_clients):
            await vc.disconnect(force=True)
        await db.close()
        await bot.close()
        logger.info("Storaboga Sound shutdown complete.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
