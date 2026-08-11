# PRODUCT.md — Storaboga Sound

## Product

A Discord music bot with a real-time web dashboard. The bot plays audio from any source via yt-dlp through FFmpeg into Discord voice channels. The web dashboard mirrors and controls playback live — now-playing, queue, skip, pause, volume — updating via SSE without polling.

## Unique mechanism

A single Python process runs both the Discord bot and the FastAPI web server. The bot's in-memory playback state is the web dashboard's source of truth — no message queue, no Redis, no separate API. SSE pushes position ticks, queue changes, and track transitions to the browser in real-time. Album art colors are extracted via colorthief and injected as both Discord embed borders and CSS `--accent-dynamic`, so the UI palette shifts with whatever is playing.

## Audience

Server owners and members of small private Discord servers (5–50 people). The dashboard is opened on a phone or laptop, glanced at, and used to control what's playing without switching to Discord. Most interactions are quick: skip, check what's next, adjust volume. Nobody lives in this dashboard — they visit it, act, and leave.

## Surface mode

**Operate.** The visitor completes a task: check what's playing, skip a track, adjust volume, look at the queue. Scanability, consistency, and familiar affordances outrank expression. Brand lives in precise details, not sweeping visuals.

## Constraints

- 1GB RAM VPS — no Lavalink, no Node runtime in production, no background workers
- React pre-compiled to static files, served by FastAPI's StaticFiles mount
- Tailwind v4 utility classes only — no external CSS except `index.css` for CSS custom properties
- No React Router — single-page, state-driven view switching
- No state management library — React Context + useState
- SSE only — no WebSocket, no Socket.io
- 7 slash commands, embeds only — zero raw text bot responses
- Discord OAuth2 for dashboard auth, session cookies, permissions mirror server roles
- Dark theme only — no light mode, no theme toggle

## What success looks like

- `/play <query>` posts a rich embed with album art and color-matched border in < 5s
- Dashboard loads at `http://<server-ip>:2497/`, shows now-playing with album art, queue, controls
- SSE updates arrive < 1s after track change in Discord
- Bot + uvicorn stay under 800MB RSS at idle
- A first-time visitor knows what's playing, what's next, and how to skip within seconds

## Brand commitments

- **Deadlock Occult Radio** — the visual world is a 1930s occultist's listening parlor, derived from Valve's Deadlock aesthetic (1930s occult noir / urban eldritch fantasy / Art Deco)
- Obsidian (`#10130D`) background — warm green-brown undertone, not cold blue-gray, not warm charcoal
- Atmospheric charcoal panels (`#1A1614`) — warm dark charcoal with warm metallic sheen, replacing the cold booth
- Primary accent: incandescent amber (`#E2A032`) — candlelight / Edison bulb warmth
- Active/playing state: occult mint green (`#70F8C1`) — supernatural glow (summoning circle, candle fire, ethereal light)
- Patinated brass (`#92703C` base, `#C6A269` light) borders — Art Deco framing, metallic dividers, stamped plate textures
- Parchment white (`#FFEFD7`) text — warm cream, aged ivory. High-contrast headings, primary text
- Dynamic accent: extracted from album art per track via colorthief, applied to summoning circle + now-playing region only (`--accent-dynamic`)
- Typography: Cinzel (display/ceremonial headers) + IM Fell English SC (occult script — ritual buttons, séance taglines, navigation tabs) + Oswald (industrial data readouts — durations, queue numbers, volume) + Inter (body text)
- Chamfered corners (45° Art Deco cuts), halftone screentone backgrounds, celestial compass overlays, triple-line brass dividers
- Film noir vignette, volumetric glow, soul-particle drift on active states
- Discord OAuth styled as a physical brass switch with ember-glow hover, but labeled "Login with Discord" — normal terminology, atmospheric treatment
