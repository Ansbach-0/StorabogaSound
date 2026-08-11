# Spec: Storaboga Sound — Discord Music Bot + Web Dashboard

## Objective

A Discord music bot for small private servers. Plays audio from any source via yt-dlp, sends 100% embed-based responses (no raw text), extracts album art colors for dynamic embed theming, and ships a React web dashboard that mirrors and controls playback in real-time.

**Success looks like:**
- User runs `/play <query>` in Discord → bot joins voice, plays the track, posts a rich embed with album art and color-matched borders
- Anyone opens the web dashboard → sees what's playing, the queue, and can control playback
- Bot runs on the VPS (1GB RAM) without OOMing
- Zero raw text responses — everything is an embed

## Tech Stack

| Layer | Technology | Version | Why |
|---|---|---|---|
| Discord API | discord.py | 2.4+ | Native `app_commands` for slash commands, no `!` prefix |
| Audio engine | yt-dlp | latest | Multi-source (YouTube, SoundCloud, Bandcamp, direct URLs), no external node needed |
| Audio playback | FFmpeg | 6.x | PCM piping to discord voice — no Lavalink, fits 1GB RAM |
| Color extraction | colorthief | 1.1+ | Pull dominant color from album art → dynamic embed borders + CSS accent |
| Database | aiosqlite | latest | Async SQLite for queue state, user prefs, server configs — no server process |
| Web server | FastAPI + uvicorn | 0.115+ | Serves React static build + REST API + SSE endpoint |
| Frontend | React + TypeScript | React 19, TS 5.x | Compiled to static → served by FastAPI, no SSR runtime |
| Styling | Tailwind CSS | v4 | Utility-first, purge to ~15KB, dark theme tokens |
| Realtime | SSE (sse-starlette) | latest | Server→client push for now-playing, queue, position — no WebSocket overhead |
| Auth | Discord OAuth2 | — | Web dashboard login via Discord, session cookies, same permissions as in-server roles |
| Deploy | Pterodactyl panel | — | VPS, 1GB RAM, 5GB disk, Python 3.13 Docker |

## Commands (Slash — 7 total, lean)

| Command | Permission | Description |
|---|---|---|
| `/play <query>` | User | Search and play a track. Supports YouTube search, direct URLs, SoundCloud. Bot joins voice if not connected. |
| `/skip` | User | Skip the current track and move to next in queue. |
| `/queue` | User | Display the current queue as a paginated embed (next 10 tracks). |
| `/nowplaying` | User | Show a rich embed for the current track: title, artist, album art, progress bar, who requested it, color-matched border. |
| `/pause` | Moderator | Pause/resume toggle. |
| `/volume <0-100>` | Moderator | Set playback volume. Default 50. Persists per-server. |
| `/leave` | Moderator | Disconnect bot from voice channel and clear the queue. |

**Permission tiers:**
- **User** — anyone in the server. Can play, skip, view queue, view now-playing.
- **Moderator** — designated DJ role (configurable via web dashboard). Can pause, volume, leave.
- **Admin** — server owner + bot owner. Full control including role assignment via dashboard.

## Project Structure

```
storaboga-sound/
├── bot/                          # Discord bot (Python)
│   ├── __init__.py
│   ├── main.py                   # Bot startup, intents, cog loading
│   ├── cogs/
│   │   ├── __init__.py
│   │   ├── playback.py           # /play, /skip, /pause command handlers
│   │   ├── queue_cmds.py         # /queue command handler
│   │   ├── nowplaying.py         # /nowplaying command handler
│   │   └── controls.py           # /volume, /leave command handlers
│   ├── audio/
│   │   ├── __init__.py
│   │   ├── player.py             # yt-dlp → FFmpeg → PCM pipeline
│   │   ├── queue_manager.py      # Queue state, track objects, history
│   │   └── color_extractor.py    # colorthief → HSL clamp → hex color
│   ├── db/
│   │   ├── __init__.py
│   │   ├── models.py             # aiosqlite schema + models
│   │   └── queries.py            # DB operations (server configs, user prefs)
│   ├── embeds/
│   │   ├── __init__.py
│   │   └── builder.py            # Embed construction, color matching, progress bar
│   └── permissions.py            # User → Mod → Admin permission checks
├── web/                          # FastAPI web server
│   ├── __init__.py
│   ├── app.py                    # FastAPI app, routes, static file serving
│   ├── auth.py                   # Discord OAuth2 flow, session management
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── api.py                # REST API (queue, volume, settings, now-playing)
│   │   └── sse.py                # SSE endpoint for live updates
│   └── shared_state.py           # Memory bridge between bot and web (shared process)
├── frontend/                     # React + Tailwind + TS (compiled to static)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── vite.config.ts            # Vite build → output to ../web/static/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── NowPlaying.tsx
│   │   │   ├── Queue.tsx
│   │   │   ├── PlayerControls.tsx
│   │   │   ├── VolumeSlider.tsx
│   │   │   └── TrackItem.tsx
│   │   ├── hooks/
│   │   │   └── useSSE.ts         # SSE hook for real-time state
│   │   ├── lib/
│   │   │   └── api.ts            # REST API client
│   │   └── pages/
│   │       ├── Dashboard.tsx     # Main now-playing + queue view ("The Listening Parlor")
│   │       ├── Login.tsx         # OAuth2 redirect ("The Séance Threshold")
│   │       ├── Settings.tsx      # Server settings — mod+ ("Parlor Configuration")
│   │       ├── History.tsx      # Recently-played ledger ("The Séance Log")
│   │       ├── Status.tsx       # Bot diagnostics ("Apparatus Diagnostics")
│   │       └── Admin.tsx        # Member role management — admin ("Keeper Management")
│   └── index.html
├── bootstrap.py                  # Pterodactyl deploy: clone → .env copy → pip install → launch
├── DESIGN.md                     # Token spec (dark base, green accent, dynamic-accent strategy)
├── AGENTS.md                     # Instructions for the CLI/coding agents
├── SPEC.md                       # This file
├── requirements.txt
├── .gitignore
├── .env.example
└── README.md
```

## Code Style

```python
# bot/cogs/playback.py — example style
import discord
from discord import app_commands
from discord.ext import commands

from bot.audio.player import AudioPlayer
from bot.embeds.builder import build_now_playing_embed
from bot.permissions import is_moderator


class Playback(commands.Cog):
    """Playback slash commands: /play, /skip, /pause."""

    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot
        self.player = AudioPlayer(bot)

    @app_commands.command(name="play", description="Search and play a track")
    @app_commands.describe(query="Song name, artist, or direct URL")
    async def play(self, interaction: discord.Interaction, query: str) -> None:
        if not interaction.user.voice:
            await interaction.response.send_message(
                embed=discord.Embed(
                    description="You need to be in a voice channel first.",
                    color=discord.Color.red(),
                ),
                ephemeral=True,
            )
            return

        await interaction.response.defer()
        track = await self.player.search_and_play(
            query=query,
            voice_channel=interaction.user.voice.channel,
            guild=interaction.guild,
            requester=interaction.user,
        )
        embed = build_now_playing_embed(track)
        await interaction.followup.send(embed=embed)


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Playback(bot))
```

**Conventions:**
- Type hints everywhere (Python 3.13, `from __future__ import annotations` not needed)
- Docstrings on classes and public methods — one line describing purpose
- `async def` for all Discord I/O and database operations
- Embeds only — `interaction.response.send_message(embed=...)`, never `content=...`
- Cog structure per discord.py convention: one class per concern, `async def setup(bot)`
- React components are functional, typed with `interface Props`, no class components
- Tailwind utility classes inline — no CSS files except `index.css` for base tokens

## Testing Strategy

| Level | Framework | What | Where |
|---|---|---|---|
| Unit | pytest + pytest-asyncio | Queue logic, color extraction, permission checks, embed builder | `tests/unit/` |
| Integration | pytest | Bot cog command handlers with mocked discord.py objects | `tests/integration/` |
| API | pytest + httpx | FastAPI endpoint tests for REST + SSE | `tests/api/` |
| Frontend | vitest | Component rendering, SSE hook, API client | `frontend/src/__tests__/` |

**Coverage target:** 80% on `bot/audio/`, `bot/permissions.py`, `bot/embeds/`, `web/routes/`. Lighter coverage on cog files (they're thin wrappers).

## Boundaries

- **Always:** Run tests before commits. Follow the embed-only rule. Validate user voice state before playback ops. Store secrets in `.env` (never committed). Use type hints. Handle missing dependencies gracefully (e.g., FFmpeg not installed → helpful embed error).
- **Ask first:** Adding new slash commands beyond the 7 specified. Adding new dependencies to `requirements.txt`. Changing the database schema. Modifying the Pterodactyl deploy flow. Changing Tailwind base tokens.
- **Never:** Commit `.env`, bot tokens, API keys, or OAuth secrets. Output raw text responses (`content=`) — always use embeds. Install Lavalink or any Java-based audio node (1GB VPS constraint). Add React Router (single-page dashboard, no routing library needed for now). Add a state management library (React context + useState is sufficient for this scale).

## Success Criteria

1. **`/play <query>`**: Bot joins voice, plays track, posts embed with album art thumbnail and color-matched border. Completes in < 5 seconds for YouTube search.
2. **`/skip`**: Skips current track, auto-plays next if queue non-empty, updates now-playing.
3. **`/queue`**: Returns embed listing next 10 tracks with position, title, duration, requester.
4. **`/nowplaying`**: Rich embed — title, artist, album, artwork (large), progress bar (text-based), requester pfp, color-matched border from album art.
5. **`/pause`**: Toggles pause/resume. Only moderators can use it. Confirms with an embed.
6. **`/volume <0-100>`**: Sets volume. Only moderators. Persists per-server in DB. Confirms with embed showing new value.
7. **`/leave`**: Disconnects, clears queue. Only moderators.
8. **Web dashboard**: Loads at `http://<server-ip>:2497/`, shows now-playing with album art, queue list, playback controls (play/pause/skip), volume slider (mod+). Updates in real-time via SSE (< 1s latency on track change).
9. **OAuth2**: User clicks "Login with Discord" → OAuth redirect → returns to dashboard with their Discord identity. Permission tier matched to their server role.
10. **Deploy**: `bootstrap.py` clones repo, installs deps, launches bot + web server. Bot connects to Discord and appears online. Server stays under 800MB RSS.
11. **Memory**: Bot + uvicorn together stay under 800MB RSS at idle. No Lavalink, no Node runtime in production (React pre-compiled to static).
12. **Zero raw text**: Every bot response is a `discord.Embed`. No `content=` strings. Zero exceptions.

## Frontend Types

The frontend consumes these TypeScript interfaces. The backend MUST produce strictly these shapes.

```typescript
interface Track {
  id: string;                  // internal queue id (uuid)
  title: string;               // yt-dlp title
  artist: string | null;       // parsed uploader or extractor metadata
  album: string | null;        // artwork-supplied album if available
  url: string;                 // source URL (yt-dlp input)
  duration_ms: number;         // total duration in milliseconds
  position_ms: number;         // current playback head (live via SSE)
  artwork_url: string | null;  // album art thumbnail URL
  accent_hex: string | null;   // colorthief output (hex), null when no art
  requester: {
    id: string;                // Discord user id
    name: string;              // display name
    avatar_url: string | null; // pfp URL
  };
  source: 'youtube' | 'soundcloud' | 'bandcamp' | 'direct';
  is_active: boolean;          // true when currently playing
  added_at: number;            // epoch ms when added to queue
}

interface QueueState {
  tracks: Track[];             // ordered queue (includes active track at index 0)
  total: number;               // total tracks including active
}

interface BotStatus {
  uptime_seconds: number;
  servers_connected: number;
  voice_connections: number;
  latency_ms: number;
  memory_mb: number;
  memory_limit_mb: number;     // 1024 MB per VPS constraint
  version: string;
}

interface ServerSettings {
  dj_role_id: string | null;   // Discord role ID for moderator tier
  default_volume: number;      // 0-100, default 50
}

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  guild_id: string;
  tier: 'user' | 'moderator' | 'admin';
}

type ViewName = 'dashboard' | 'login' | 'settings' | 'history' | 'status' | 'admin';
```

## SSE Event Contract

SSE events are emitted via `sse-starlette`. Event names are kebab-case. Each event carries a UTF-8 JSON string in `data`.

| Event Name | Cadence | Payload |
|---|---|---|
| `now-playing` | On track transition | `Track` object (the new active track) |
| `queue-update` | On queue change (add/skip/remove) | `QueueState` object |
| `position-tick` | Every 1000ms while playing | `{ position_ms: number, track_id: string }` |
| `track-end` | When active track finishes | `{ track_id: string }` |
| `connection` | On connect/disconnect | `{ status: "connected" \| "disconnected" }` |

The frontend `useSSE` hook connects to `/api/events` via `EventSource`, dispatches on event name, and retries with exponential backoff on disconnect (1s → 2s → 5s → 10s cap).

## REST API Conventions

The frontend REST client uses **relative** URLs only (e.g. `fetch('/api/queue')`). The FastAPI server (same process) serves both the static React build (via `StaticFiles` mount of `frontend/dist`) and the API at the `/api` prefix. No Vite env var is needed; the same origin serves both. The `api.ts` client may hardcode `/api/${route}` strings.

| Method | Endpoint | Permission | Returns |
|---|---|---|---|
| GET | `/api/me` | Any authenticated | `User` object |
| GET | `/api/now-playing` | Any | `Track` or `null` |
| GET | `/api/queue` | Any | `QueueState` |
| POST | `/api/skip` | User | `{ ok: boolean }` |
| POST | `/api/pause` | Moderator | `{ ok: boolean, paused: boolean }` |
| POST | `/api/leave` | Moderator | `{ ok: boolean }` |
| GET | `/api/volume` | Any | `{ volume: number }` |
| POST | `/api/volume/{value}` | Moderator | `{ ok: boolean, volume: number }` |
| GET | `/api/settings` | Any | `ServerSettings` |
| PATCH | `/api/settings` | Admin | `ServerSettings` (updated) |
| GET | `/api/status` | Any | `BotStatus` |
| GET | `/api/history` | Any | `Track[]` (last 20 played) |
| GET | `/api/events` | Any | SSE stream |

## OAuth2 Flow

Scopes requested on `https://discord.com/api/oauth2/authorize`:
- `identify` — user id, display name, avatar
- `guilds` — list of guilds the user is a member of (to pick which guild's dashboard to load when the user belongs to multiple)
- `guilds.members.read` — the user's roles in a specific guild (used to map Moderator/Admin tier via DJ role lookup)

Redirect URI (after registration in the Discord Developer Portal): `http://<server-ip>:2497/auth/callback`.

The bot must have the **Server Members Intent** enabled in the Discord Developer Portal > Bot for `guilds.members.read` on third parties to work.

Session management via signed HTTP-only cookies. Permission tier is determined once on OAuth callback, stored in the session, and returned by `GET /api/me`.

## Dynamic Accent Scoping

The `--accent-dynamic` CSS custom property MUST be set on the NowPlaying region wrapper element (e.g. `<section class="now-playing-region">`), NOT on `:root` or `<html>`. The colorthief-extracted hex (HSL-clamped per rule 11) travels as a scoped CSS variable — only the NowPlaying subtree and the active TrackItem card inherit it. All other views (Settings, Admin, History, Status, Login) inherit only the static `ember` (`#70F8C1`) token. Each TrackItem card that is currently playing receives its own inline `style={{ '--accent-dynamic': track.accent_hex || '#70F8C1' }}` scoped to that card only.

## Responsive Behavior

Breakpoint at `768px` (Tailwind `md:`).

- **< 768px (mobile)**: parlor composition collapses to a single vertical column (NowPlaying on top, then tab content area). Bottom-nav becomes icon-only — labels shrink to 12px Oswald uppercase at 0.5em opacity on inactive. The summoning-circle frame clips to a maximum diameter of 240px. Volume segments narrow to 12px width (still 12 segments).
- **≥ 768px (desktop)**: full parlor — top header with brandmark, main now-playing centered, side dossier-style queue on right.
- No tablet breakpoint — laptop flows from desktop.

## Navigation

The main in-app navigation is a fixed bottom strip of 6 tabs rendered in IM Fell English SC (`.label-glyph` tracking). Active tab carries the ember-pulse indicator (amber label, `.animate-ember-pulse`). Inactive labels use the parchment shadow tone.

**UI copy is normal music-player terminology.** Labels, buttons, status messages, and navigation use standard language (Now Playing, Queue, Skip, Pause, Volume, Settings). The occult aesthetic lives in the visual design (fonts, textures, glows, animations, the summoning-circle graphic), not in the words on screen. The thematic page concept names in `DESIGN-DIRECTION.md` ("The Listening Parlor", "The Séance Log", etc.) are internal art-direction concepts — they describe the visual treatment, not user-facing labels.

| # | Label | View | Permission |
|---|---|---|---|
| 1 | Now Playing | Dashboard | Any |
| 2 | Queue | Queue (in-dashboard tab) | Any |
| 3 | History | History | Any |
| 4 | Status | Status | Any |
| 5 | Settings | Settings | Moderator+ |
| 6 | Admin | Admin | Admin only |
| 7 | Login | Login/Logout | Any (OAuth state action) |

Tab visibility follows permission-tier UI gating: Mod-gated tabs (Settings) render but are disabled with a rust-colored `MOD ONLY` stamp for non-mods. Admin-gated tabs (Admin) are entirely hidden from non-admins.

## Dev Build Fixtures

During frontend development (before backend is wired), use these mock shapes. The real backend MUST produce strictly these shapes — these are not suggestions, they are the contract.

```json
{
  "me": {
    "id": "841234567890123456",
    "username": "example_user",
    "avatar_url": "https://cdn.discordapp.com/avatars/841234567890123456/abc123.png",
    "guild_id": "987654321098765432",
    "tier": "admin"
  },
  "nowPlaying": {
    "id": "track-001",
    "title": "Midnight City",
    "artist": "M83",
    "album": "Hurry Up, We're Dreaming",
    "url": "https://youtube.com/watch?v=dX3k_QDlzHE",
    "duration_ms": 244000,
    "position_ms": 87000,
    "artwork_url": "https://i.scdn.co/image/ab67616d0000b273bb4d5d4dceafb1ed7d8c8e",
    "accent_hex": "#1E8FCF",
    "requester": { "id": "841234567890123456", "name": "example_user", "avatar_url": "https://cdn.discordapp.com/avatars/841234567890123456/abc123.png" },
    "source": "youtube",
    "is_active": true,
    "added_at": 1786308000000
  },
  "queue": {
    "tracks": [
      { "id": "track-001", "title": "Midnight City", "artist": "M83", "album": "Hurry Up, We're Dreaming", "url": "https://youtube.com/watch?v=dX3k_QDlzHE", "duration_ms": 244000, "position_ms": 87000, "artwork_url": "https://i.scdn.co/image/ab67616d0000b273bb4d5d4dceafb1ed7d8c8e", "accent_hex": "#1E8FCF", "requester": { "id": "841234567890123456", "name": "example_user", "avatar_url": null }, "source": "youtube", "is_active": true, "added_at": 1786308000000 },
      { "id": "track-002", "title": "Nightcall", "artist": "Kavinsky", "album": null, "url": "https://youtube.com/watch?v=MV_3DpwBRY", "duration_ms": 257000, "position_ms": 0, "artwork_url": "https://i.scdn.co/image/ab67616d0000b2734c6e8e9f0d2b3a1c4d5e6f7", "accent_hex": "#A5264A", "requester": { "id": "841234567890123456", "name": "example_user", "avatar_url": null }, "source": "youtube", "is_active": false, "added_at": 1786308060000 },
      { "id": "track-003", "title": "Electric Feel", "artist": "MGMT", "album": "Oracular Spectacular", "url": "https://youtube.com/watch?v=Ut4LYqphpPk", "duration_ms": 229000, "position_ms": 0, "artwork_url": null, "accent_hex": null, "requester": { "id": "841234567890123456", "name": "example_user", "avatar_url": null }, "source": "youtube", "is_active": false, "added_at": 1786308120000 }
    ],
    "total": 3
  },
  "status": {
    "uptime_seconds": 86400,
    "servers_connected": 3,
    "voice_connections": 1,
    "latency_ms": 42,
    "memory_mb": 412,
    "memory_limit_mb": 1024,
    "version": "1.0.0"
  },
  "settings": {
    "dj_role_id": "111222333444555666",
    "default_volume": 50
  }
}
```

Note: `track-003` has `artwork_url: null` and `accent_hex: null` — this tests null handling. The mock queue includes one track with album art, one without album but with art, and one with no art at all.

## Open Questions

### Queue Management API (proposed)

The dashboard comps include queue management UX (reorder, remove, jump-to, clear) that the current SPEC does not cover. The current SPEC only defines `POST /api/skip`. Proposed additions:

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/queue/{track_id}/move` | `{ "new_position": number }` | Reorder a track to a new position in the queue |
| `DELETE` | `/api/queue/{track_id}` | — | Remove a specific track from the queue |
| `POST` | `/api/queue/{track_id}/play` | — | Jump to a specific track (skip current, play this one) |
| `DELETE` | `/api/queue` | — | Clear the entire queue |

These would require corresponding bot commands or be dashboard-only actions. Decision needed: should these be bot slash commands too (`/remove`, `/move`, `/clear`, `/jump`), or dashboard-only via the web API?

**Status:** Pending final decision before implementation.



