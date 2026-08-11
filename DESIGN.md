# Storaboga Sound: Tartarian Radio Parlor Design System

## Overview
Storaboga Sound is a 1930s Tartarian Radio Parlor frontend interface inspired by the aesthetic direction of Valve's *Deadlock*. It replaces generic flat UI and modern web media player tropes with an occult, brass-and-dark-oak physical radio apparatus aesthetic.

---

## 1. Calibrated Color Tokens & Deadlock Mapping

**CORRECTED** with LO's ground-truth visual analysis of Deadlock's hero selection interface (2026-08-09). Deadlock is NOT warm — it's COOL. Deep charcoal-teal backgrounds, desaturated slate panels, cold ectoplasmic mint/cyan for active states, warm mustard gold for identity/lore. Previous warm green-brown tokens were WRONG.

### Color Contrast Balance (from LO's analysis)
- **Cold neon cyan/mint** = strictly for ACTIVE user interactions (selected items, priority tags, now-playing glow, connection states)
- **Warm mustard gold** = strictly for IDENTITY & LORE (spotlight halos, tag badges, artwork framing, brand/character identity)

| Token Name | Hex Value | Deadlock Source Reference | Usage & UI Semantics |
| :--- | :--- | :--- | :--- |
| `offBlack` | `#10130D` | `offBlack` @define | Deepest background — warm green-tinted black (NOT cool teal) |
| `offWhite` | `#FFEFD7` | `offWhite` @define | Primary text — warm cream, NOT cool white |
| `soulColor` | `#70F8C1` | `soulColor` @define | Active/now-playing glow — ectoplasmic mint (authoritative) |
| `shardColor` | `#99FFD6` | `shardColor` @define | Brighter mint for selected card glow |
| `brandGreen` | `#5FE69E` | `brandGreen` @define | Active channel/health indicators |
| `goldColor` | `#FFED79` | `goldColor` @define | Bright progress thumb, gold currency indicators |
| `spiritColor` | `#8A55B3` | `spiritColor` @define | Occult purple — admin-level, arcane accents |
| `weaponColor` | `#E58A00` | `weaponColor` @define | Warm amber/brass — identity, lore tags, secondary gold |
| `enemyColor` | `#FF410D` | `colorEnemy` @define | Destructive — skip, stop, remove |
| `team1Neutral` | `#55503E` | `team1ColorNeutral` @define | Muted secondary text |
| `team2Color` | `#4D75C3` | `team2Color` @define | Selection accent blue |
| `steamBlue` | `#1A9FFF` | `steamBlue` @define | Link/info accent |
| `rank0Color` | `#333333` | `rank0Color` @define | Base neutral panel background |
| `defaultBG1` | `#333333` | `defaultBGColor1` | Panel background tier 1 |
| `defaultBG2` | `#404040` | `defaultBGColor2` | Panel background tier 2 |
| `silvered` | `#C6C6C6` | `silvered` @define | Muted grey for inactive labels |
| `flux` | `var(--accent-dynamic)` | Album-art extracted | Dynamic track accent (fallback `#70F8C1`), scoped to now-playing only |

---

## 2. Typography Hierarchy

- **Display Header (`font-display`)**: `Cinzel` (Google Fonts, 400/600/700/900). Used for major headings, title placards, ceremonial section headers, and parlor empty states. NOT used for track titles.
- **Occult Script (`font-occult`)**: `IM Fell English SC` (Google Fonts). Used for ritual buttons, channel toggles, séance taglines, navigation tabs, **track titles (now-playing + queue entries)**, and the logo.
- **Data & Numeric Labels (`font-data`)**: `Oswald` (Google Fonts, 300/400/500/600/700). Compact uppercase labels, timestamps, durations, step values, and diagnostic metrics.
- **Body Text (`font-body`)**: `Inter` (Google Fonts, 300/400/500/600/700). Clean legible body text with OpenType features (`cv11`, `ss01`).

---

## 3. Atmosphere & Mechanical Utility Classes

- `.faceplate-brass`: Radial gradient surface (`radial-gradient(circle at 50% 50%, #2c2a28 0%, #181716 100%)`) with hairline border and inset brass drop shadow.
- `.chamfer`: SVG mask-based Art Deco 8px corner bevel (using `#chamfer-mask`).
- `.chamfer-sm`: Small SVG mask-based Art Deco 4px corner bevel (using `#chamfer-mask-sm`).
- `.bg-halftone`: 1930s pulp halftone dot texture grid (`radial-gradient(circle at center, rgba(146, 112, 60, 0.06) 1px, transparent 1.5px)`).
- `.bg-compass`: Rotating celestial conic gradient grid overlay.
- `.bg-paper`: SVG `feTurbulence` fractal noise paper texture (`opacity="0.06"`).
- `.summoning-circle`: Concentric mint-green soul rings with radial gradient glow.
- `.deco-divider`: Triple-line gradient Art Deco brass divider.
- `.vignette-noir`: Radial film noir vignette over entire viewport.
- `.glow-ember`: Mint-green volumetric soul aura (`0 0 16px rgba(112, 248, 193, 0.3)`).
- `.glow-amber`: Edison incandescent bulb glow (`0 0 12px rgba(226, 160, 50, 0.35)`).
- `.glow-parchment`: Cream text drop glow.
- `.label-glyph`: Compact uppercase Oswald tracking-widest label with muted shadow color.
- `.text-speckle` — Letterpress SVG filter degradation effect for vintage ink feel

### Additional Utility Classes

- `.voice_level_mask` — 12-segment volume/intensity indicator. A grid of 12 div elements, each individually lit. Active segments use `ember` (`#70F8C1`) with `.glow-ember`; inactive segments use `brass-dark` (`#5C4A2A`). Each segment is a chamfered rectangle. The Deadlock volume bar uses exactly this pattern.

### SVG Filter & Mask Definitions

These SVG defs live in a hidden `<svg width="0" height="0">` block at the root of `App.tsx`:

- `#speckle` — Letterpress degradation filter: `feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise"` → `feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"`. The `scale` of 3 produces the worn-letterpress look without destroying legibility.
- `#chamfer-mask` — SVG mask for 8px Art Deco corner bevel. A white rectangle with the four corners cut as black triangles (8px × 8px).
- `#chamfer-mask-sm` — Same as `#chamfer-mask` but 4px × 4px corner cuts.
- `#paper-noise` — `feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"` at `opacity="0.06"` for the `.bg-paper` paper grain texture.

### Gradient Definitions

- `.summoning-circle` uses the canonical soulShine radial gradient: `radial-gradient(circle at 50% 50%, #9AFFD6 0%, #568F78 60%)` for the center glow, with three stacked layers (tight core, mid halo, outer aura). Active state overlays `box-shadow: inset rgba(112, 248, 193, 0.15) 0 0 16px 1px`.
- `.faceplate-brass` uses: `radial-gradient(circle at 50% 50%, #2C2A28 0%, #181716 100%)` — warm center, darker edges, lit like aged brass near a candle.

---

## 4. Motion Language & Animations

- `animate-flicker` (`candle-flicker` 3s ease-in-out infinite): Organic candle/gaslamp intensity fluctuation.
- `animate-soul-drift` (`soul-drift` 4s ease-out infinite): Ethereal soul particles floating upward from ritual elements.
- `animate-compass` (`compass-rotate` 60s linear infinite): Continuous rotation of the celestial compass grid.
- `animate-ember-pulse` (`ember-pulse` 1.8s ease-in-out infinite): Pulsing mint-green active indicator dot.
- `animate-scan` (`scan-line` 1.5s ease-in-out infinite): Diagnostic scan line motion across apparatus readouts.
- `animate-summon` (`summon-reveal` 0.6s cubic-bezier(0.16, 1, 0.3, 1)): Smooth reveal animation for manifested entities.

---

## 5. Architectural & Design References

- **Deadlock Open Assets Repository**: `github.com/0xThiagoAmaral/deadlock-open-assets`
- **Citadel Base Stylesheet**: `citadel_base_styles.css` (194 `@define` color and layout rules)
- **Epoch & World Building**: 1930s Tartarian Radio Parlor, occult apparatus aesthetics, brass hardware, and séance rituals.
