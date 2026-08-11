# Agent Guidelines — Storaboga Sound

## Project Context

Storaboga Sound is a Discord music bot with a web dashboard. See `SPEC.md` for the full specification — read it before writing any code.

## Architecture

```
Discord (voice + slash commands) → discord.py bot (Python 3.13)
                                → yt-dlp → FFmpeg → PCM audio
                                → FastAPI web server (same process)
                                → React static frontend (served by FastAPI)
                                → SSE for realtime updates
                                → aiosqlite for state
```

The bot and web server run as a single Python process. The React frontend is compiled to static files and served by FastAPI's `StaticFiles` mount. No separate Node runtime in production.

## Rules for Coding Agents

1. **Read SPEC.md first.** It contains the locked decisions. Don't re-derive them.
2. **Embeds only.** Every Discord response is a `discord.Embed`. Never use `content=` for user-facing messages. Ephemeral messages can use `content` for internal errors only.
3. **No Lavalink.** Audio goes through yt-dlp → FFmpeg → `discord.FFmpegPCMAudio`. This is a hard constraint (1GB RAM VPS).
4. **Type hints required.** Python 3.13. All functions, methods, and class attributes typed.
5. **Async everywhere.** All Discord I/O and database operations are `async def`. Use `aiosqlite`, not `sqlite3`.
6. **7 commands only.** Don't add commands beyond what's in the SPEC. If you think one is missing, add it to SPEC's Open Questions section, don't implement it.
7. **Tailwind v4.** Frontend uses Tailwind utility classes. No external CSS files except `index.css` for base custom properties (dynamic accent color, dark token vars).
8. **No React Router.** Single-page. Tab/section switching via state, not URL routing.
9. **No state management library.** React Context + `useState` is enough. This is a small dashboard, not an enterprise app.
10. **SSE for realtime.** `EventSource` on the frontend, `sse-starlette` on the backend. No Socket.io, no WebSocket.
11. **colorthief for accent colors.** Extract dominant color from album art → HSL clamp (saturation 40-70%, lightness 55-75%) → apply as Discord embed color AND CSS `--accent-dynamic` custom property.
12. **Permissions: User → Mod → Admin.** Check in `bot/permissions.py`. Mod = designated DJ role. Admin = guild owner or bot owner. Don't hardcode role IDs — look up from DB.

## Design System — Deadlock Occult Radio

**Visual direction:** Deadlock Occult Radio — a 1930s occultist's listening parlor. Derived from Valve's Deadlock aesthetic (1930s occult noir / urban eldritch fantasy / Art Deco / dieselpunk). The product is a music bot, but it *feels* like a séance: tracks are summoned, the queue is a dossier of entities, volume is ritual intensity. The dashboard is the parlor where the ritual is conducted.

**UI copy is normal music-player terminology.** The occult aesthetic is purely visual — fonts, textures, glows, animations, the summoning-circle graphic. The words on screen use standard language: "Now Playing", "Queue", "Skip", "Pause", "Volume", "Settings", "Login with Discord". Do not write thematic copy (no "conduct the séance", no "banish", no "KEEPER", no "SEALING PARAMETERS"). The atmosphere comes from the design system, not the button labels.

**Source of truth for all color values:** `DESIGN.md` — the color tokens below are calibrated directly from Valve's decompiled Deadlock game CSS (`citadel_base_styles.css`, 194 `@define` rules). If any other doc conflicts with DESIGN.md on color values, DESIGN.md wins.

### Color Tokens

| Token | Hex | Deadlock Source | Usage |
|---|---|---|---|
| `offBlack` | `#10130D` | `offBlack` @define | Deepest background — warm green-tinted black |
| `offWhite` | `#FFEFD7` | `offWhite` @define | Primary text — warm cream |
| `soulColor` | `#70F8C1` | `soulColor` @define | Active/now-playing glow — ectoplasmic mint |
| `shardColor` | `#99FFD6` | `shardColor` @define | Brighter mint for selected card glow |
| `brandGreen` | `#5FE69E` | `brandGreen` @define | Active channel/health indicators |
| `goldColor` | `#FFED79` | `goldColor` @define | Bright progress thumb, gold indicators |
| `spiritColor` | `#8A55B3` | `spiritColor` @define | Occult purple — admin/arcane |
| `weaponColor` | `#E58A00` | `weaponColor` @define | Warm amber/brass — identity, lore tags |
| `enemyColor` | `#FF410D` | `colorEnemy` @define | Destructive — skip, stop, remove |
| `team1Neutral` | `#55503E` | `team1ColorNeutral` @define | Muted secondary text |
| `team2Color` | `#4D75C3` | `team2Color` @define | Selection accent blue |
| `steamBlue` | `#1A9FFF` | `steamBlue` @define | Link/info accent |
| `rank0Color` | `#333333` | `rank0Color` @define | Base neutral panel background |
| `defaultBG1` | `#333333` | `defaultBGColor1` | Panel background tier 1 |
| `defaultBG2` | `#404040` | `defaultBGColor2` | Panel background tier 2 |
| `silvered` | `#C6C6C6` | `silvered` @define | Muted grey for inactive labels |
| `flux` | `var(--accent-dynamic)` | Album-art extracted | Dynamic track accent (fallback `#70F8C1`), scoped to now-playing only |

### Typography

Four-font stack, loaded via Google Fonts in `index.css`:

| Role | Font | Weights | Usage |
|---|---|---|---|
| Display/serif (`font-serif`) | Reaver | regular/semibold/bold | Hero placards, section headers, hero/track names. Game's `@define serif: Reaver, serif`. OTF files in `assets/fonts/`. |
| Sans-serif body (`font-sans`) | Retail Demo | regular/medium/semibold/bold + italics | UI labels, body text, item names. Game's `@define sans: Retail Demo, Noto Sans, sans-serif`. |
| Monospace data (`font-mono`) | Retail Text Demo | regular/bold + italics | Numerical displays, stat numbers, queue numbers. Game's `@define sansMono: Retail Text Demo`. |
| Secondary display (`font-oracle`) | VALVEOracle → Reaver fallback | — | Hero name stamps, ceremonial headers. Game's `@define oracle: VALVEOracle, Reaver, sans-serif`. VALVEOracle not extracted yet — use Reaver as fallback. |
| Block/stencil (`font-block`) | VALVEPulp → Retail Demo fallback | — | Stenciled headers, mode titles. Game's `@define block: VALVEPulp, Noto Sans, sans-serif`. VALVEPulp not extracted — use Retail Demo bold as fallback. |
| Radiance (alt) | Radiance | regular/semibold/bold + italics | Secondary text, HUD/overlay text. Available in `assets/fonts/`. |

### Utility Classes

All defined in `src/index.css`:

- `.faceplate-brass` — Radial gradient brass surface with hairline border and inset shadow
- `.chamfer` — SVG mask-based 8px Art Deco corner bevel
- `.chamfer-sm` — Small SVG mask-based 4px corner bevel
- `.bg-halftone` — 1930s pulp halftone dot texture grid
- `.bg-compass` — Rotating celestial conic gradient overlay
- `.bg-paper` — SVG `feTurbulence` fractal noise paper texture (`opacity="0.06"`)
- `.summoning-circle` — Concentric mint-green soul rings with radial glow
- `.deco-divider` — Triple-line gradient Art Deco brass divider
- `.vignette-noir` — Radial film noir vignette over viewport
- `.glow-ember` — Mint-green volumetric soul aura (`0 0 16px rgba(112, 248, 193, 0.3)`)
- `.glow-amber` — Edison incandescent bulb glow (`0 0 12px rgba(226, 160, 50, 0.35)`)
- `.glow-parchment` — Cream text drop glow
- `.label-glyph` — Compact uppercase Oswald tracking-widest label with muted shadow color
- `.text-speckle` — Letterpress SVG filter degradation effect for vintage ink feel
- `.voice_level_mask` — 12-segment volume/intensity indicator (defined in DESIGN.md §3)
- `.summoning-circle` radial gradient stops: `radial-gradient(circle at 50% 50%, #9AFFD6 0%, #568F78 60%)` (see DESIGN.md §Gradient Definitions)
- SVG filters (`#speckle`, `#chamfer-mask`, `#chamfer-mask-sm`, `#paper-noise`) defined in DESIGN.md §SVG Filter & Mask Definitions — mount as hidden `<svg width="0" height="0">` at App root

### Motion Language

- `.animate-flicker` (`candle-flicker` 3s) — Organic candle/gaslamp intensity fluctuation for active states
- `.animate-soul-drift` (`soul-drift` 4s) — Ethereal soul particles floating upward from ritual elements
- `.animate-compass` (`compass-rotate` 60s) — Continuous celestial compass grid rotation
- `.animate-ember-pulse` (`ember-pulse` 1.8s) — Pulsing mint-green active indicator dot (SSE connection)
- `.animate-scan` (`scan-line` 1.5s) — Diagnostic scan line across apparatus readouts
- `.animate-summon` (`summon-reveal` 0.6s) — Smooth reveal for manifested entities (track transitions)

### Materialness (Critical — Read `DESIGN-DIRECTION.md`)

Flat hex colors do NOT produce the Deadlock look. The game CSS references real textures (`paper_tile_1k_01_png.vtex`). Every surface must have physical material:
- Paper grain via SVG `feTurbulence` filters (`.bg-paper`, `.text-speckle`)
- Brass patina via radial gradients (`.faceplate-brass`)
- Halftone dot patterns (`.bg-halftone`)
- Film noir vignette (`.vignette-noir`)
- Volumetric glow halos (`.glow-ember`, `.glow-amber`)

A surface without material texture looks like a website imitating a theme, not a world that exists.

### Banned Patterns

No `rounded-2xl`, no `backdrop-blur`, no `border-white/10`, no `shadow-2xl` or `shadow-lg` (use flat hard-edge regime: `0px 0px 32px 0px rgba(0,0,0,0.5)` + inset top shadow), no Spotify green (`#1DB954`), no Spotify gray (`#B3B3B3`), no IBM Plex (old Pirate Radio font), no cold blue-gray backgrounds (the old `#0A0C10` and `#12161F` are WRONG — use the warm values from the token table above), no `faceplate`/`bg-graticule`/`label-engraved`/`lamp-onair`/`lamp-signal` (old Pirate Radio classes — removed). No generic music-app card layouts.

The Impeccable design skill is installed. Follow its design principles. `DESIGN.md` is the authoritative design-system document. It owns color tokens, typography role assignments, utility class definitions, and motion language. Anywhere `DESIGN.md` and another doc (including `DESIGN-DIRECTION.md` or this file) conflict on those four concerns, `DESIGN.md` wins. `DESIGN-DIRECTION.md` owns per-page composition and atmospherics only (layout, focal hierarchy, mask idioms, page-specific motion); it can specify WHERE to apply a class but cannot redefine what a class IS or assign a typeface to a role.

## Build Commands

```bash
# Backend
pip install -r requirements.txt
python -m bot.main

# Frontend
cd frontend && npm install && npm run build  # outputs to ../web/static/

# Tests
pytest tests/ -v
cd frontend && npm test

# Deploy (see devops skill for panel deployment)
```
