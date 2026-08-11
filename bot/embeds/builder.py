"""Discord Embed builders for Storaboga Sound bot responses."""

from datetime import datetime, timezone
import discord

from bot.audio.queue_manager import Track

SOUL_COLOR_HEX = "#70F8C1"
ENEMY_COLOR_HEX = "#FF410D"


def _parse_hex_color(hex_str: str | None) -> discord.Color:
    """Parse hex string to discord.Color, falling back to soulColor (#70F8C1)."""
    if hex_str and hex_str.startswith("#") and len(hex_str) == 7:
        try:
            return discord.Color(int(hex_str.lstrip("#"), 16))
        except ValueError:
            pass
    return discord.Color(int(SOUL_COLOR_HEX.lstrip("#"), 16))


def _format_ms(ms: int) -> str:
    """Format milliseconds into MM:SS or HH:MM:SS string."""
    seconds = max(0, ms // 1000)
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def _build_progress_bar(position_ms: int, duration_ms: int, bar_length: int = 24) -> str:
    """Format text progress bar: ▶ ━━━━━━━━━━━━━●────────── [02:18 / 04:03]"""
    pos_str = _format_ms(position_ms)
    dur_str = _format_ms(duration_ms)
    if duration_ms <= 0:
        bar = "━" * bar_length
        return f"▶ {bar} [{pos_str} / {dur_str}]"

    ratio = max(0.0, min(1.0, position_ms / duration_ms))
    thumb_idx = int(round(ratio * (bar_length - 1)))
    filled = "━" * thumb_idx
    empty = "─" * (bar_length - 1 - thumb_idx)
    return f"▶ {filled}●{empty} [{pos_str} / {dur_str}]"


def build_now_playing_embed(track: Track) -> discord.Embed:
    """Rich embed: title, artist, album, artwork (large), progress bar (text-based), requester pfp, color-matched border."""
    embed = discord.Embed(
        title=track.title,
        url=track.url,
        color=_parse_hex_color(track.accent_hex),
        timestamp=datetime.now(timezone.utc),
    )

    desc_lines = [f"by **{track.artist or 'Unknown Artist'}**"]
    if track.album:
        desc_lines.append(f"Album: *{track.album}*")

    progress_bar = _build_progress_bar(track.position_ms, track.duration_ms)
    desc_lines.append(f"\n`{progress_bar}`")

    embed.description = "\n".join(desc_lines)

    if track.artwork_url:
        embed.set_thumbnail(url=track.artwork_url)

    if track.requester:
        embed.set_footer(
            text=f"Requested by {track.requester.name}",
            icon_url=track.requester.avatar_url,
        )

    return embed


def build_queue_embed(tracks: list[Track], total: int) -> discord.Embed:
    """Paginated queue embed — next 10 tracks with position, title, duration, requester."""
    active_track = tracks[0] if tracks and tracks[0].is_active else None
    color = _parse_hex_color(active_track.accent_hex if active_track else None)

    embed = discord.Embed(
        title="🎵 Music Queue",
        color=color,
        timestamp=datetime.now(timezone.utc),
    )

    if not tracks:
        embed.description = "The queue is currently empty."
        return embed

    description_lines: list[str] = []

    if active_track:
        description_lines.append(
            f"**Now Playing:** [{active_track.title}]({active_track.url}) `[{_format_ms(active_track.duration_ms)}]` — requested by **{active_track.requester.name}**\n"
        )

    queued_tracks = [t for t in tracks if not t.is_active][:10]
    if queued_tracks:
        description_lines.append("**Up Next:**")
        for idx, t in enumerate(queued_tracks, start=1):
            description_lines.append(
                f"`{idx}.` [{t.title}]({t.url}) `[{_format_ms(t.duration_ms)}]` — requested by **{t.requester.name}**"
            )

    embed.description = "\n".join(description_lines)
    embed.set_footer(text=f"Total tracks in queue: {total}")
    return embed


def build_skip_embed(track: Track | None) -> discord.Embed:
    """Skip confirmation — shows what was skipped and what's playing next."""
    color = _parse_hex_color(track.accent_hex if track else None)
    embed = discord.Embed(
        title="⏭️ Track Skipped",
        color=color,
        timestamp=datetime.now(timezone.utc),
    )
    if track:
        embed.description = f"Skipped **[{track.title}]({track.url})**"
        if track.artwork_url:
            embed.set_thumbnail(url=track.artwork_url)
    else:
        embed.description = "Skipped current track."
    return embed


def build_pause_embed(is_paused: bool) -> discord.Embed:
    """Pause/resume toggle confirmation."""
    status = "Paused" if is_paused else "Resumed"
    icon = "⏸️" if is_paused else "▶️"
    embed = discord.Embed(
        title=f"{icon} Playback {status}",
        description=f"Playback has been **{status.lower()}**.",
        color=_parse_hex_color(None),
        timestamp=datetime.now(timezone.utc),
    )
    return embed


def build_volume_embed(volume: int) -> discord.Embed:
    """Volume change confirmation — shows new value."""
    embed = discord.Embed(
        title="🔊 Volume Changed",
        description=f"Playback volume set to **{volume}%**.",
        color=_parse_hex_color(None),
        timestamp=datetime.now(timezone.utc),
    )
    return embed


def build_leave_embed() -> discord.Embed:
    """Leave confirmation — disconnected + queue cleared."""
    embed = discord.Embed(
        title="👋 Disconnected",
        description="Disconnected from voice channel and cleared the queue.",
        color=_parse_hex_color(None),
        timestamp=datetime.now(timezone.utc),
    )
    return embed


def build_error_embed(message: str) -> discord.Embed:
    """Error embed — red border, clear error message, no scary stack traces."""
    embed = discord.Embed(
        title="⚠️ Error",
        description=message,
        color=0xFF410D,
        timestamp=datetime.now(timezone.utc),
    )
    return embed
