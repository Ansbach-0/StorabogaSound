"""In-memory per-guild audio queue state management."""

from dataclasses import dataclass


@dataclass
class Requester:
    """Represents the Discord user who requested a track."""

    id: str
    name: str
    avatar_url: str | None

    def to_dict(self) -> dict:
        """Convert Requester instance to dictionary matching SPEC interface."""
        return {
            "id": self.id,
            "name": self.name,
            "avatar_url": self.avatar_url,
        }


@dataclass
class Track:
    """Represents a track in the queue. Matches SPEC's TypeScript Track interface exactly."""

    id: str
    title: str
    artist: str | None
    album: str | None
    url: str
    duration_ms: int
    position_ms: int
    artwork_url: str | None
    accent_hex: str | None
    requester: Requester
    source: str  # 'youtube' | 'soundcloud' | 'bandcamp' | 'direct'
    is_active: bool
    added_at: int  # epoch ms

    def to_dict(self) -> dict:
        """Convert Track instance to dictionary matching SPEC interface."""
        return {
            "id": self.id,
            "title": self.title,
            "artist": self.artist,
            "album": self.album,
            "url": self.url,
            "duration_ms": self.duration_ms,
            "position_ms": self.position_ms,
            "artwork_url": self.artwork_url,
            "accent_hex": self.accent_hex,
            "requester": self.requester.to_dict() if self.requester else {"id": "", "name": "Unknown", "avatar_url": None},
            "source": self.source,
            "is_active": self.is_active,
            "added_at": self.added_at,
        }


class QueueManager:
    """Per-guild queue state management."""

    def __init__(self) -> None:
        self._guilds: dict[int, list[Track]] = {}  # guild_id → ordered queue
        self._history: dict[int, list[Track]] = {}  # guild_id → played tracks

    def get_queue(self, guild_id: int) -> list[Track]:
        """Return the current track queue for a guild."""
        return self._guilds.setdefault(guild_id, [])

    def add_track(self, guild_id: int, track: Track) -> int:
        """Add a track to the guild's queue and return the new queue length."""
        queue = self.get_queue(guild_id)
        if not queue:
            track.is_active = True
        queue.append(track)
        return len(queue)

    def pop_next(self, guild_id: int) -> Track | None:
        """Move active track to history and set next queued track as active."""
        queue = self.get_queue(guild_id)
        if not queue:
            return None

        current = queue.pop(0)
        current.is_active = False
        history = self._history.setdefault(guild_id, [])
        history.append(current)

        if queue:
            queue[0].is_active = True
            queue[0].position_ms = 0
            return queue[0]

        return None

    def remove_track(self, guild_id: int, track_id: str) -> bool:
        """Remove a track by ID from the guild's queue."""
        queue = self.get_queue(guild_id)
        for i, track in enumerate(queue):
            if track.id == track_id:
                queue.pop(i)
                if i == 0 and queue:
                    queue[0].is_active = True
                return True
        return False

    def clear(self, guild_id: int) -> int:
        """Clear all tracks from the guild's queue and return removed count."""
        queue = self.get_queue(guild_id)
        count = len(queue)
        for track in queue:
            track.is_active = False
        self._guilds[guild_id] = []
        return count

    def move_track(self, guild_id: int, track_id: str, new_pos: int) -> bool:
        """Move a track in the queue to a new index."""
        queue = self.get_queue(guild_id)
        idx = next((i for i, t in enumerate(queue) if t.id == track_id), None)
        if idx is None or new_pos < 0 or new_pos >= len(queue):
            return False
        track = queue.pop(idx)
        queue.insert(new_pos, track)
        for i, t in enumerate(queue):
            t.is_active = (i == 0)
        return True

    def get_history(self, guild_id: int, limit: int = 50) -> list[Track]:
        """Return recently played tracks for a guild up to the limit."""
        history = self._history.get(guild_id, [])
        return history[-limit:]

    def get_active(self, guild_id: int) -> Track | None:
        """Return the currently active track for a guild if any."""
        queue = self.get_queue(guild_id)
        if queue and queue[0].is_active:
            return queue[0]
        return None

    def to_queue_state(self, guild_id: int) -> dict:
        """Return the queue state JSON shape matching the SPEC."""
        queue = self.get_queue(guild_id)
        return {
            "tracks": [track.to_dict() for track in queue],
            "total": len(queue),
        }
