"""Audio player engine using yt-dlp, FFmpeg PCM piping, and discord.py voice clients."""

from __future__ import annotations

import asyncio
import logging
import os
import time
from typing import TYPE_CHECKING
import uuid
import aiosqlite
import discord
from discord.ext import commands
import yt_dlp

from bot.audio.color_extractor import extract_accent_color
from bot.audio.queue_manager import QueueManager, Requester, Track
from bot.db.models import HistoryEntry
from bot.db.queries import add_history_entry

if TYPE_CHECKING:
    from web.shared_state import EventBroadcaster

logger = logging.getLogger(__name__)


class AudioPlayer:
    """Manages yt-dlp extraction, FFmpeg PCM piping, and discord voice playback per guild."""

    def __init__(
        self,
        bot: commands.Bot,
        db: aiosqlite.Connection | None = None,
        broadcaster: EventBroadcaster | None = None,
        ffmpeg_path: str | None = None,
    ) -> None:
        self.bot = bot
        self.db = db
        self.broadcaster = broadcaster
        self.ffmpeg_path = ffmpeg_path or os.getenv("FFMPEG_PATH", "ffmpeg")
        self.queue_manager = QueueManager()
        proxy_url = os.getenv("YTDLP_PROXY")
        self._yt_dlp_opts: dict = {
            "format": "bestaudio/best",
            "noplaylist": True,
            "extractaudio": True,
            "audioformat": "opus",
            "outtmpl": "/tmp/storaboga_%(id)s.%(ext)s",
            "quiet": True,
            "no_warnings": True,
            "extractor_args": {"youtube": {"player_client": ["android_vr"]}},
        }
        if proxy_url:
            self._yt_dlp_opts["proxy"] = proxy_url
            # Belt-and-suspenders: inject auth header directly for CONNECT tunnel
            from urllib.parse import urlparse
            parsed = urlparse(proxy_url)
            if parsed.username:
                import base64
                creds = base64.b64encode(f"{parsed.username}:{parsed.password or ''}".encode()).decode()
                self._yt_dlp_opts["http_headers"] = {"Proxy-Authorization": f"Basic {creds}"}
        cookiefile = os.getenv("YTDLP_COOKIEFILE")
        if cookiefile and os.path.exists(cookiefile):
            self._yt_dlp_opts["cookiefile"] = cookiefile
            self._yt_dlp_opts["cookiefile_constraint"] = "read"
        self._voice_clients: dict[int, discord.VoiceClient] = {}
        self._play_start_times: dict[int, float] = {}
        self._paused_at: dict[int, float | None] = {}
        self._total_paused_duration: dict[int, float] = {}
        self._volumes: dict[int, int] = {}
        self._position_tasks: dict[int, asyncio.Task] = {}
        self._disconnect_tasks: dict[int, asyncio.Task] = {}
        self._file_paths: dict[str, str] = {}  # track_id -> file_path

    async def set_volume(self, guild: discord.Guild, volume: int) -> int:
        """Set playback volume (0-100). Applies to current voice client's source."""
        clamped_volume = max(0, min(100, volume))
        self._volumes[guild.id] = clamped_volume
        voice = next((vc for vc in self.bot.voice_clients if vc.guild.id == guild.id), None)
        if voice and voice.source:
            if isinstance(voice.source, discord.PCMVolumeTransformer):
                voice.source.volume = clamped_volume / 100.0
            else:
                voice.source = discord.PCMVolumeTransformer(voice.source, volume=clamped_volume / 100.0)
        return clamped_volume

    async def search_and_play(
        self,
        query: str,
        voice_channel: discord.VoiceChannel,
        guild: discord.Guild,
        requester: discord.Member,
    ) -> Track:
        """Search for a track, add to queue, and begin playback if idle."""
        guild_id = guild.id

        # Cancel pending disconnect timeout if any
        self._cancel_disconnect(guild_id)

        # Connect or move voice client
        vc: discord.VoiceClient | None = guild.voice_client  # type: ignore[assignment]
        if vc is None or not vc.is_connected():
            vc = await voice_channel.connect()
        elif vc.channel != voice_channel:
            await vc.move_to(voice_channel)
        self._voice_clients[guild_id] = vc

        # Format search query if not a direct HTTP URL
        search_query = query if query.startswith(("http://", "https://")) else f"ytsearch:{query}"

        def _extract():
            with yt_dlp.YoutubeDL(self._yt_dlp_opts) as ytdl:
                info = ytdl.extract_info(search_query, download=True)
                if info is None:
                    raise RuntimeError("yt-dlp returned no information for query")
                if "entries" in info and info["entries"]:
                    entry = info["entries"][0]
                else:
                    entry = info
                filepath = ytdl.prepare_filename(entry)
                return entry, filepath

        loop = asyncio.get_running_loop()
        entry_info, file_path = await loop.run_in_executor(None, _extract)

        title = entry_info.get("title") or "Unknown Title"
        artist = (
            entry_info.get("artist")
            or entry_info.get("uploader")
            or entry_info.get("channel")
        )
        album = entry_info.get("album")
        url = entry_info.get("webpage_url") or entry_info.get("url") or query
        duration_s = entry_info.get("duration") or 0
        duration_ms = int(duration_s * 1000)
        artwork_url = entry_info.get("thumbnail")

        extractor = str(entry_info.get("extractor_key", "")).lower()
        if "youtube" in url or "youtu.be" in url or "youtube" in extractor:
            source = "youtube"
        elif "soundcloud" in url or "soundcloud" in extractor:
            source = "soundcloud"
        elif "bandcamp" in url or "bandcamp" in extractor:
            source = "bandcamp"
        else:
            source = "direct"

        accent_hex = await loop.run_in_executor(None, extract_accent_color, artwork_url)

        req = Requester(
            id=str(requester.id),
            name=requester.display_name,
            avatar_url=str(requester.display_avatar.url) if requester.display_avatar else None,
        )

        track_id = str(uuid.uuid4())
        track = Track(
            id=track_id,
            title=title,
            artist=artist,
            album=album,
            url=url,
            duration_ms=duration_ms,
            position_ms=0,
            artwork_url=artwork_url,
            accent_hex=accent_hex,
            requester=req,
            source=source,
            is_active=False,
            added_at=int(time.time() * 1000),
        )

        self._file_paths[track_id] = file_path
        self.queue_manager.add_track(guild_id, track)

        if self.broadcaster:
            await self.broadcaster.broadcast("queue-update", self.queue_manager.to_queue_state(guild_id))

        if not vc.is_playing() and not vc.is_paused():
            await self._start_playback(guild_id, vc)

        return track

    async def _start_playback(self, guild_id: int, vc: discord.VoiceClient) -> None:
        """Start playing the currently active track in the queue."""
        active_track = self.queue_manager.get_active(guild_id)
        if not active_track:
            self._schedule_disconnect(guild_id, vc)
            return

        active_track.is_active = True
        file_path = self._file_paths.get(active_track.id)

        if not file_path or not os.path.exists(file_path):
            logger.error(f"Audio file missing for track {active_track.id}")
            next_track = self.queue_manager.pop_next(guild_id)
            if next_track:
                await self._start_playback(guild_id, vc)
            else:
                self._schedule_disconnect(guild_id, vc)
            return

        source: discord.AudioSource = discord.FFmpegPCMAudio(file_path, executable=self.ffmpeg_path)
        if guild_id in self._volumes:
            source = discord.PCMVolumeTransformer(source, volume=self._volumes[guild_id] / 100.0)

        self._play_start_times[guild_id] = time.monotonic()
        self._total_paused_duration[guild_id] = 0.0
        self._paused_at.pop(guild_id, None)
        self._start_position_tracker(guild_id, active_track, vc)

        if self.broadcaster:
            await self.broadcaster.broadcast("now-playing", active_track.to_dict())
            await self.broadcaster.broadcast("queue-update", self.queue_manager.to_queue_state(guild_id))

        def after_playing(error: Exception | None) -> None:
            if error:
                logger.error(f"Playback error in guild {guild_id}: {error}")

            self._stop_position_tracker(guild_id)

            fp = self._file_paths.pop(active_track.id, None)
            if fp and os.path.exists(fp):
                try:
                    os.remove(fp)
                except OSError:
                    pass

            coro = self._handle_track_finish(guild_id, vc, active_track)
            asyncio.run_coroutine_threadsafe(coro, self.bot.loop)

        vc.play(source, after=after_playing)

    async def _handle_track_finish(
        self, guild_id: int, vc: discord.VoiceClient, finished_track: Track | None = None
    ) -> None:
        """Handle track completion: advance queue or schedule disconnect."""
        if finished_track and self.db:
            try:
                entry = HistoryEntry(
                    id=None,
                    guild_id=str(guild_id),
                    track_id=finished_track.id,
                    title=finished_track.title,
                    artist=finished_track.artist,
                    album=finished_track.album,
                    url=finished_track.url,
                    duration_ms=finished_track.duration_ms,
                    artwork_url=finished_track.artwork_url,
                    accent_hex=finished_track.accent_hex,
                    requester_id=finished_track.requester.id,
                    requester_name=finished_track.requester.name,
                    source=finished_track.source,
                    played_at=int(time.time() * 1000),
                )
                await add_history_entry(self.db, entry)
            except Exception as e:
                logger.error(f"Failed to record history entry: {e}")

        if finished_track and self.broadcaster:
            await self.broadcaster.broadcast("track-end", {"track_id": finished_track.id})

        next_track = self.queue_manager.pop_next(guild_id)

        if self.broadcaster:
            await self.broadcaster.broadcast("queue-update", self.queue_manager.to_queue_state(guild_id))

        if next_track:
            await self._start_playback(guild_id, vc)
        else:
            self._schedule_disconnect(guild_id, vc)

    def _start_position_tracker(self, guild_id: int, track: Track, vc: discord.VoiceClient) -> None:
        """Launch a task to update track position_ms every second."""
        self._stop_position_tracker(guild_id)

        async def _tracker():
            while vc.is_playing():
                if not vc.is_paused():
                    start_t = self._play_start_times.get(guild_id, time.monotonic())
                    total_paused = self._total_paused_duration.get(guild_id, 0.0)
                    elapsed = int((time.monotonic() - start_t - total_paused) * 1000)
                    track.position_ms = max(0, min(elapsed, track.duration_ms))
                    if self.broadcaster:
                        await self.broadcaster.broadcast(
                            "position-tick",
                            {"position_ms": track.position_ms, "track_id": track.id},
                        )
                await asyncio.sleep(1)

        self._position_tasks[guild_id] = asyncio.create_task(_tracker())

    def _stop_position_tracker(self, guild_id: int) -> None:
        """Cancel position tracking task for a guild if active."""
        task = self._position_tasks.pop(guild_id, None)
        if task and not task.done():
            task.cancel()

    def _schedule_disconnect(self, guild_id: int, vc: discord.VoiceClient) -> None:
        """Schedule automatic voice disconnect after 60s timeout."""
        self._cancel_disconnect(guild_id)

        async def _disconnect_wait():
            await asyncio.sleep(60)
            if vc.is_connected() and not vc.is_playing() and not vc.is_paused():
                active = self.queue_manager.get_active(guild_id)
                if not active:
                    await vc.disconnect()
                    self._voice_clients.pop(guild_id, None)

        self._disconnect_tasks[guild_id] = asyncio.create_task(_disconnect_wait())

    def _cancel_disconnect(self, guild_id: int) -> None:
        """Cancel pending disconnect task for a guild."""
        task = self._disconnect_tasks.pop(guild_id, None)
        if task and not task.done():
            task.cancel()

    async def skip(self, guild_id: int) -> Track | None:
        """Skip the current playing track in a guild."""
        current = self.queue_manager.get_active(guild_id)
        vc = self._voice_clients.get(guild_id)
        if vc and (vc.is_playing() or vc.is_paused()):
            vc.stop()
        if self.broadcaster:
            await self.broadcaster.broadcast("queue-update", self.queue_manager.to_queue_state(guild_id))
        return current

    async def pause(self, guild_id: int) -> bool:
        """Toggle pause/resume for a guild. Returns True if paused, False if resumed."""
        vc = self._voice_clients.get(guild_id)
        if not vc:
            return False
        if vc.is_playing():
            vc.pause()
            self._paused_at[guild_id] = time.monotonic()
            self._stop_position_tracker(guild_id)
            if self.broadcaster:
                await self.broadcaster.broadcast("queue-update", self.queue_manager.to_queue_state(guild_id))
            return True
        elif vc.is_paused():
            vc.resume()
            paused_at = self._paused_at.pop(guild_id, None)
            if paused_at:
                paused_duration = time.monotonic() - paused_at
                self._total_paused_duration[guild_id] = (
                    self._total_paused_duration.get(guild_id, 0.0) + paused_duration
                )
            active_track = self.queue_manager.get_active(guild_id)
            if active_track:
                self._start_position_tracker(guild_id, active_track, vc)
            if self.broadcaster:
                await self.broadcaster.broadcast("queue-update", self.queue_manager.to_queue_state(guild_id))
            return False
        return False

    async def leave(self, guild_id: int) -> None:
        """Disconnect from voice channel and clear queue for a guild."""
        self._cancel_disconnect(guild_id)
        self._stop_position_tracker(guild_id)
        self._paused_at.pop(guild_id, None)
        self._total_paused_duration.pop(guild_id, None)
        self._play_start_times.pop(guild_id, None)
        self.queue_manager.clear(guild_id)
        vc = self._voice_clients.pop(guild_id, None)
        if vc:
            if vc.is_playing() or vc.is_paused():
                vc.stop()
            if vc.is_connected():
                await vc.disconnect()
        if self.broadcaster:
            await self.broadcaster.broadcast("queue-update", self.queue_manager.to_queue_state(guild_id))
