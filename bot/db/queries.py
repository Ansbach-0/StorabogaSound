"""Database operation functions for server configs and play history."""

import aiosqlite

from bot.db.models import SCHEMA, HistoryEntry, ServerConfig


async def init_db(db_path: str = "storaboga.db") -> aiosqlite.Connection:
    """Initialize SQLite database connection and execute table schema."""
    db = await aiosqlite.connect(db_path)
    db.row_factory = aiosqlite.Row
    await db.executescript(SCHEMA)
    await db.commit()
    return db


async def get_server_config(db: aiosqlite.Connection, guild_id: str) -> ServerConfig | None:
    """Retrieve server configuration for a guild by ID."""
    async with db.execute(
        "SELECT guild_id, dj_role_id, default_volume FROM server_configs WHERE guild_id = ?",
        (guild_id,),
    ) as cursor:
        row = await cursor.fetchone()
        if row:
            return ServerConfig(
                guild_id=row["guild_id"],
                dj_role_id=row["dj_role_id"],
                default_volume=row["default_volume"],
            )
    return None


async def set_server_config(db: aiosqlite.Connection, config: ServerConfig) -> None:
    """Insert or update server configuration for a guild."""
    query = """
    INSERT INTO server_configs (guild_id, dj_role_id, default_volume)
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
        dj_role_id = excluded.dj_role_id,
        default_volume = excluded.default_volume;
    """
    await db.execute(query, (config.guild_id, config.dj_role_id, config.default_volume))
    await db.commit()


async def add_history_entry(db: aiosqlite.Connection, entry: HistoryEntry) -> None:
    """Record a track playback history entry."""
    query = """
    INSERT INTO play_history (guild_id, track_id, title, artist, album, url, duration_ms, artwork_url, accent_hex, requester_id, requester_name, source, played_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """
    await db.execute(
        query,
        (
            entry.guild_id,
            entry.track_id,
            entry.title,
            entry.artist,
            entry.album,
            entry.url,
            entry.duration_ms,
            entry.artwork_url,
            entry.accent_hex,
            entry.requester_id,
            entry.requester_name,
            entry.source,
            entry.played_at,
        ),
    )
    await db.commit()


async def get_history(db: aiosqlite.Connection, guild_id: str, limit: int = 50) -> list[HistoryEntry]:
    """Retrieve playback history entries for a guild ordered by played_at descending."""
    query = """
    SELECT id, guild_id, track_id, title, artist, album, url, duration_ms, artwork_url, accent_hex, requester_id, requester_name, source, played_at
    FROM play_history
    WHERE guild_id = ?
    ORDER BY played_at DESC
    LIMIT ?;
    """
    async with db.execute(query, (guild_id, limit)) as cursor:
        rows = await cursor.fetchall()
        return [
            HistoryEntry(
                id=row["id"],
                guild_id=row["guild_id"],
                track_id=row["track_id"],
                title=row["title"],
                artist=row["artist"],
                album=row["album"],
                url=row["url"],
                duration_ms=row["duration_ms"],
                artwork_url=row["artwork_url"],
                accent_hex=row["accent_hex"],
                requester_id=row["requester_id"],
                requester_name=row["requester_name"],
                source=row["source"] if "source" in row.keys() and row["source"] is not None else "youtube",
                played_at=row["played_at"],
            )
            for row in rows
        ]
