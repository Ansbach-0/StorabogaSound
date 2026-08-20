# Storaboga Sound

A Discord music bot with a web dashboard built in the visual language of Valve's *Deadlock*.

It streams audio from YouTube, SoundCloud, and Bandcamp into voice channels, and has a control dashboard styled after the game's hero-select screen, with warm parchment, soul-mint glow, and art-deco noir. No Lavalink, no heavy containers; the whole thing runs inside 1 GB of RAM.

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org)
[![Discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white)](https://discordpy.readthedocs.io)
[![Last commit](https://img.shields.io/github/last-commit/Ansbach-0/StorabogaSound)](https://github.com/Ansbach-0/StorabogaSound/commits)

---

## Features

- Audio pipeline using `yt-dlp → FFmpeg → Discord` PCM. No external voice node, so it runs inside 1 GB of RAM.
- Web dashboard that maps the game's screens onto player controls: queue becomes a hero-portrait roster, now-playing a hero showcase, history a transmission archive, settings a calibration console, status a telemetry view.
- Real-time updates over SSE (server-push, no WebSockets) for now-playing, queue position, and playback state.
- Dynamic theming: the dominant color is extracted from album art (`colorthief`) and applied as the track accent across Discord embeds and the dashboard.
- Role-based permissions (User → Mod/DJ → Admin), enforced server-side.
- Discord responses are fully embed-based, no raw text.
- Responsive from 360 px (mobile) to 1440 px+, fully keyboard-navigable (SPACE pause, S skip, 1–4 view switch).

## Screenshots

| Now Playing: hero showcase | History: Transmission Archive |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.jpg) | ![History](docs/screenshots/history.jpg) |

| Status: Node Telemetry | Settings: Calibration Console |
|---|---|
| ![Status](docs/screenshots/status.jpg) | ![Settings](docs/screenshots/settings.jpg) |

## Design

The dashboard is an homage to the *Deadlock* hero-select screen, built from the same construction rules:

- Warm palette taken from Valve's decompiled CSS: cream `#FFEFD7` on warm charcoal `#10130D`, soul-mint `#70F8C1` active states, gold `#FFED79` identity.
- The game's real fonts: Reaver (serif display), Retail Demo (sans body), Retail Text Demo (mono data).
- Physical materiality: paper grain, halftone dot patterns, mask-chamfered corners, radial "soul shine" glows.
- Original game icons (100+ SVGs) and the `dl-*` web components from `@deadlock-api/ui-react`, which render game surfaces with their genuine behavior.

UI copy stays normal music-player terminology ("Now Playing", "Queue", "Skip"). The occult atmosphere is visual only: fonts, textures, glows, the summoning-circle graphic. It never reaches the button labels.

See [`DESIGN.md`](DESIGN.md) for the full token reference and [`SPEC.md`](SPEC.md) for the locked architecture decisions.

## Architecture

```
Discord (voice + slash commands)
        │
        ▼
discord.py bot (Python 3.13)  ── yt-dlp → FFmpeg → PCM audio
        │
        ▼
FastAPI web server (same process)
        ├── React static frontend (served by FastAPI)
        ├── REST API
        └── SSE for realtime updates
        │
        ▼
aiosqlite (state)
```

The bot and web server run as a single Python process. The React frontend compiles to static files and is served by FastAPI's `StaticFiles` mount, so there is no separate Node runtime in production.

## Tech Stack

### Backend (Python 3.13, single process)

| Component | Tech | Why |
|---|---|---|
| Discord API | `discord.py` | Native slash commands, embeds |
| Audio engine | `yt-dlp` | YouTube / SoundCloud / Bandcamp / direct URLs |
| Audio playback | `FFmpeg` | PCM piping, no Lavalink, fits 1 GB RAM |
| Web server | `FastAPI` + `uvicorn` | Serves static build + REST + SSE in-process |
| Realtime | `sse-starlette` | Server-push events, zero WebSocket overhead |
| Database | `aiosqlite` | Async SQLite, no server process |
| Color extraction | `colorthief` | Album-art → dynamic accent for embeds + UI |

### Frontend (React 19 + TypeScript + Vite 6)

| Component | Tech |
|---|---|
| UI framework | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Build | Vite 6 |
| Game components | `@deadlock-api/ui-core` + `@deadlock-api/ui-react` |
| Realtime | `EventSource` (SSE) |

## Getting Started

You need a Discord application + bot token, and `ffmpeg` on PATH. No external database or voice server required.

```bash
# 1. Clone
git clone https://github.com/Ansbach-0/StorabogaSound.git
cd StorabogaSound

# 2. Backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env        # fill DISCORD_TOKEN, DISCORD_CLIENT_ID/SECRET

# 3. Frontend
cd frontend
npm install
npm run build               # outputs to frontend/dist (served by FastAPI)

# 4. Run
cd ..
.venv/bin/python -m bot      # starts Discord bot + web server on :2497
```

Open `http://localhost:2497`, click **Login with Discord**, and the dashboard appears.

## Project Layout

```
storaboga-sound/
├── bot/                  # Discord bot: commands, audio player, permissions, DB
│   ├── audio/            # yt-dlp → FFmpeg pipeline, color extraction
│   └── db/               # aiosqlite queries
├── web/                  # FastAPI: auth, REST API, SSE, static serving
│   └── routes/           # api.py (REST), sse.py (events)
├── frontend/             # React 19 + Tailwind v4 + deadlock-ui components
│   ├── src/components/   # dashboard, archive, telemetry, calibration views
│   └── public/assets/    # game fonts, textures, masks, 100+ game icons
└── SPEC.md               # full specification & API contract
```

## How it was built

This project came out of a multi-agent pipeline: [Hermes Agent](https://github.com/NousResearch/hermes-agent) for orchestration, Google Antigravity CLI for the build, and a research profile for verification. The human sets the direction and taste; the pipeline moves through brief, build, visual self-review, then a human verdict, and each lesson turns into a reusable skill. The misses, the fixes, and the full architecture are written up in [`AI-WORKFLOW.md`](AI-WORKFLOW.md), including the time over-constrained prompts nearly flattened the design.

## Credits & Compliance

This is a fan project. It is not affiliated with, endorsed by, or sponsored by Valve Corporation. *Deadlock* and all related characters, logos, and visual assets are trademarks and/or copyrighted materials of Valve Corporation.

### Third-party services & data sources

| Resource | What we use | License / Terms |
|---|---|---|
| [deadlock-api](https://deadlock-api.com) & [deadlock-ui](https://github.com/deadlock-api/deadlock-ui) | Game icons (100+ SVGs), fonts, textures, and the `dl-*` web components | Open-source; see [deadlock-api/deadlock-ui](https://github.com/deadlock-api/deadlock-ui), an independent community API not affiliated with Valve |
| [Deadlock](https://deadlock.com) (Valve) | Visual language inspiration: palette, materials, typography | Fan use; all rights to Valve |
| UI reference frames | Screenshots from 2026 community videos (post-*Old Gods*) used only as design references during development | Content belongs to the respective creators; not distributed in the repo |

### Open-source libraries

The project builds on free software: **discord.py** (MIT), **FastAPI** (MIT), **yt-dlp** (Unlicense/Public domain), **FFmpeg** (LGPL/GPL), **React** (MIT), **Tailwind CSS** (MIT), **Vite** (MIT), **sse-starlette** (BSD), **colorthief** (MIT), **aiosqlite** (MIT), **Pillow** (MIT-CMU). Full license texts ship inside each package.

### A note on game assets

The game fonts, textures, and icons are Valve's property, used here under fan-project conventions. If you fork this project, keep the attribution above and do not redistribute the game assets for commercial purposes.

## License

Project code (backend, dashboard logic, custom UI) is provided under the [MIT License](LICENSE) unless otherwise noted. Game-derived assets remain the property of their respective owners and are not covered by the MIT grant.
