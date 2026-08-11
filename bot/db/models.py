"""Database schema definition and dataclass models."""

from dataclasses import dataclass

SCHEMA = """
CREATE TABLE IF NOT EXISTS server_configs (
    guild_id TEXT PRIMARY KEY,
    dj_role_id TEXT,
    default_volume INTEGER DEFAULT 50
);

CREATE TABLE IF NOT EXISTS play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    url TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    artwork_url TEXT,
    accent_hex TEXT,
    requester_id TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    source TEXT DEFAULT 'youtube',
    played_at INTEGER NOT NULL  -- epoch ms
);

CREATE INDEX IF NOT EXISTS idx_history_guild ON play_history(guild_id, played_at DESC);
"""


@dataclass
class ServerConfig:
    """Represents per-guild configuration settings stored in DB."""

    guild_id: str
    dj_role_id: str | None = None
    default_volume: int = 50


@dataclass
class HistoryEntry:
    """Represents a historical playback entry stored in DB."""

    id: int | None
    guild_id: str
    track_id: str
    title: str
    artist: str | None
    album: str | None
    url: str
    duration_ms: int
    artwork_url: str | None
    accent_hex: str | None
    requester_id: str
    requester_name: str
    source: str
    played_at: int
