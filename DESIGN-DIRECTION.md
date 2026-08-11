# DESIGN DIRECTION — Storaboga Sound: Tartarian Radio Parlor
# ===========================================================================
# This document is the art direction for every page of the dashboard.
# It supersedes the previous template-driven approach.
# Written by ENI, grounded in:
#   - 194 decompiled Deadlock game CSS tokens (deadlock-visual-groundtruth.md)
#   - 5 Steam store screenshots analyzed via vision model
#   - Impeccable craft-floor.md quality requirements
#   - LO's directive: "make it look like part of the actual game"
# ===========================================================================

## THE THESIS

Storaboga Sound is not a dashboard. It is a 1930s occult radio parlor that
happens to play music. Every pixel should feel like it exists in a room —
a dim, brass-trimmed room with paper-yellowed walls and a tuner that glows
mint-green when the frequency locks. The visitor is not "using an app" —
they are conducting a séance.

A flat, vector-perfect dark dashboard with `faceplate-brass chamfer` panels repeated on every page is what this design language must NOT become. There must be material, depth, grit, atmosphere. It should look like a world that exists, not a website imitating a theme.

## WHAT MAKES DEADLOCK FEEL REAL (from ground truth research)

1. **MATERIALNESS**: Every surface has a physical material — aged paper,
   stamped brass, oxidized metal, warm wood. Flat hex colors don't exist.
   The base stylesheet literally references `paper_tile_1k_01_png.vtex` —
   a tiled paper texture under ALL panels. `.bg-paper` must ship at opacity
   ~0.06 (feTurbulence noise) over parchment on EVERY surface.

2. **THE SPECKLE MASK**: Deadlock's display text uses a `text_speckle_mask`
   that creates worn-letterpress degradation — every title pixel has
   isolated missing speckles. The `.text-speckle` SVG filter must be the
   DEFAULT treatment for ALL display text (Cinzel headers, IM Fell track
   titles) — the letterpress look IS the Deadlock text aesthetic.

3. **RADIAL GRADIENTS, NOT FLAT COLORS**: Deadlock's panel backgrounds are
   `gradient(radial, 50% 50%, -5% -5%, 60% 60%, from(#2c2a28), to(#181716))`
   — lit from center outward like an Edison bulb is glowing behind the
   panel. `.faceplate-brass` must use this radial gradient with visible
   warm center and darker edges — aged brass held near a candle.

4. **THE CHAMFER IS A MASK, NOT A CLIP-PATH**: Deadlock uses opacity-mask
   PSDs with soft edges and baked noise. Chamfers must use SVG masks (not
   clip-path), with a subtle inner shadow at the chamfer edges AND faint
   noise texture at the cut line — stamped metal edge, not CSS polygon.

5. **BOX-SHADOW REGIME**: Deadlock uses three types: (a) flat hard shadow
   for silhouette, (b) inset shadow for sculpted/embossed feel, (c) colored
   aura for active glow. Use: `0px 0px 32px 0px rgba(0,0,0,0.5)` (flat,
   hard, strong silhouette) + `inset 0 2px 6px rgba(0,0,0,0.5)` (top-edge
   sculpting). No `shadow-2xl`, `shadow-lg`, or soft-blur Tailwind shadows.

6. **VIGNETTE IS ATMOSPHERIC, NOT DECORATIVE**: The vignette uses
   radial gradients with actual color transitions (black → mint-green →
   brand-green). It should feel like the parlor is lit by a single overhead
   bulb — warm at center, falling into darkness at the periphery.

7. **HALFTONE EVERYWHERE**: `.bg-halftone` (1930s pulp dot texture)
   should appear under card backgrounds, under button surfaces, and as
   a subtle overlay across the entire page. It's the period-signature
   texture — make it pervasive.

## THE LOGO PROBLEM

LO said: "hand-crafted SVGs are AI slop." He's right. A logo that is just Cinzel text in a circle is generic and forgettable.

**The approach**: Typography-driven, material-enhanced logo. NOT a custom
drawn SVG. Instead:

1. Use the IM Fell English SC typeface (already in our font stack — it's
   the closest free analog to Deadlock's proprietary VALVEOracle face).
   Its worn, 16th-century manuscript edges ARE the occult display look.

2. "STORABOGA SOUND" set in IM Fell English SC, with extreme letter-
   spacing (0.3-0.5em), large weight contrast. The kerning itself is the
   logo — the negative space between letterforms IS the design.

3. Apply the text-speckle mask (feTurbulence displacement) to the
   letterforms so each character has subtle letterpress degradation.
   The imperfection IS the craft.

4. No icon. No emblem. No SVG illustration. Just typography so good it
   IS the brand. Think: how a 1930s radio station branded its
   letterhead — just the call letters, set perfectly, on cream paper.

5. The "summoning circle" framing around the logo should use the
   canonical soulShine radial gradient
   (`radial-gradient(circle at 50% 50%, #9AFFD6 0%, #568F78 60%)`)
   and the mint-green ring should have ACTUAL glow (box-shadow aura),
   not just a border color.

## THE DISCORD LOGO PROBLEM

The Discord icon must NOT be filled with `text-brass-light` (`#C6A269`) — too gold,
clashes with the brass everywhere. Instead:

Fix: The Discord mark should be desaturated to near-parchment tone
(#C8B898 — a muted bone-white), OR colored with the ember/mint (#70F8C1)
to tie it to the "séance" concept. The Discord logo reads as "the
conduit" — the crystal through which the séance is conducted. Making it
mint-green ties it to the ritual theme without looking like an afterthought.

## PER-PAGE ART DIRECTION

### LOGIN — The Séance Threshold

**Art-direction concept:** a threshold into the listening parlor. Visually: dark, atmospheric, a single call to action. The page itself should feel like crossing a threshold.

**UI copy:** Standard OAuth login flow. Button says "Login with Discord". No "conduct the séance" or similar. The atmosphere does the work, not the words.

**Concept**: Not a login page. A darkened parlor. A single brass apparatus
glows in the darkness — the radio tuner. The visitor approaches it.

- Background: Obsidian #10130D with a DIAGONAL gradient
  (linear-gradient(135deg, #121513 0%, #131615 100%)) — Deadlock's actual
  dashboard background technique. Very subtle.
- The summoning circle should have a visible soulShine glow —
  radial-gradient mint-green emanating outward, not just a border ring.
  The glow should be 3 layers: tight core (#70F8C1 at 30%), mid halo
  (#568F78 at 15%), outer aura (transparent). Like a CRT phosphor glow.
- Paper texture at 8% opacity across the whole page. Not subtle —
  visible. You should SEE the grain.
- The "Login with Discord" button should feel like a physical brass
  switch — inset shadow on top (stamped metal), raised bottom edge,
  and when hovered, the ember pulse activates (the "filament heats up").
- Soul particles (3-5) drifting upward across the ENTIRE page, not
  just near the button. Slow, organic, not uniform.
- The footer "Storaboga Sound" wordmark should use
  the text-speckle mask — it should look letterpress-printed, slightly
  degraded, like it was stamped on old paper 90 years ago.
- The welcome paragraph should be in IM Fell English SC, not Inter —
  it's the font job to sell the atmosphere, not the copy.

### DASHBOARD — The Listening Parlor

**Concept**: You are IN the parlor. The now-playing is the central
apparatus — a brass radio with a glowing dial. The queue is a dossier
file on a side table.

**NowPlaying (centerpiece)**:
- The summoning circle should PULSE with the soulShine gradient when
  playing. The mint-green glow should be visible and breathing —
  not a faint border. It's an Edison bulb. It glows.
- Album art sits inside the circle like a glowing crystal ball.
- Track title uses IM Fell English SC (not Cinzel) with text-speckle
  mask treatment — it should feel like it was printed, not rendered.
- The progress bar should use the voice_level_mask pattern — 12
  segmented segments with stepped edges, not a smooth gradient fill.
  Each segment lights up individually. Deadlock's actual volume bar is
  exactly this. The "now playing" progress should feel mechanical —
  a brass counter clicking forward.
- Transport buttons (Skip / Pause / Leave) should feel like physical
  hardware switches — stamped brass plates with chamfered edges,
  inset top shadow, raised bottom. When active, the brass glows
  amber (filament heat). When idle, it's cold patinated brass.

**Queue (dossier)**:
- NOT a generic list. A stack of card-file index cards — each track
  is a dossier entry. The card should have a subtle paper texture,
  a chamfered top-right corner (like an index tab), and the track
  number in Oswald stamped at the top-left like a file number.
- Selected/playing track in the queue should have a S) green
  mint glow border — the "frequency is locked" state. Non-playing
  tracks are cold brass.
- Each track card should have uneven/organically varied positions —
  not a uniform grid. Slight rotation (-0.5° to +0.5°) to feel
  like physical cards, not digital divs.

### HISTORY — The Séance Log

**Concept**: A leather-bound ledger. Past manifestations recorded in
ink. Each entry is a line item in a spiritual accounting book.

- Header should feel like a ledger title page — heavy IM Fell English SC,
  text-speckle mask, watermark-style behind the list.
- Each history entry should be a horizontal stroke — like a line
  in a ledger. Not a card. A row with a thin brass underline, the
  track title in serif, artist in Inter, time-ago in Oswald small
  caps. Like reading an old logbook.
- The entire list sits on a paper-textured background. Visible grain.
- No cards. No boxes. Lines on paper.

### STATUS — Apparatus Diagnostics

**Concept**: A 1930s gauge panel — analog meters, brass dials, vacuum
tube indicators. NOT a grid of stat cards.

- Each stat should be a gauge or a meter, not a number in a box.
  - Uptime: A brass clock face with rotating hands (pure CSS rotation
    based on value).
  - Voice connections: A row of vacuum tube indicators — lit (ember
    green glow) vs unlit (cold brass).
  - Latency: A speedometer-style arc gauge, brass semicircle with a
    needle, ember green when good, rust when high.
  - Memory: A tube-amp level meter — segmented vertical bars like
    Deadlock's voice_level_mask, filling up.
  - Channels: Simple counter in Oswald, but framed in a stamped brass
    plate like a note from a radio station reading "ON AIR: 14 STATIONS"
  - Version: Stamped at the bottom like a serial number on a brass plate
    — "MODEL No. v1.0.0 · PATENT APPLIED"

- No identical-size cards in a grid. Each gauge has its own shape and
  size. The layout should feel like a physical instrument panel, not
  Bootstrap columns.

### SETTINGS — Parlor Configuration

**Art-direction concept**: The settings panel inside the radio apparatus — brass
control plates with labelled faders and selector switches. Internal concept name only — UI labels say "Settings".

- Settings panels should feel like opened compartments on the radio.
  Each section is a brass plate with labels engraved (text-speckle
  degradation), physical-looking inputs. Section labels use normal
  terms: "Volume", "DJ Role", "Default Settings".
- The volume slider should be the 12-segment Deadlock voice_level_mask
  pattern. NOT an HTML range input. A row of 12 segments that fill up
  as volume increases.
- The save button should feel like a physical press — a brass
  stamp being pressed. Label says "Save". Active state: "Saving..." with a
  subtle scale animation.

### ADMIN — Keeper Management

**Art-direction concept**: The roster book. A heavy ledger of personnel, with brass
name plates. Internal concept name only — UI labels say "Admin".

- Member entries should look like brass name plates — each with
  a stamped name, role designation (Admin / Moderator / Member), and
  role-change buttons that feel like physical switches.
- Role badges should use the Deadlock rank-badge style — small
  stamped metal tags with chamfered corners, not pill-shaped badges.
- The "Promote" / "Demote" buttons should use a mechanical switch
  metaphor — brass toggle, not a generic button.

## GLOBAL MATERIAL RULES (apply to all pages)

1. **Paper texture (6-8% opacity)** on every surface — not just the
   background. Panels, buttons, headers. The grain IS the material.
2. **text-speckle mask** on ALL display text (h1, h2, label-glyph,
   font-display, font-occult). Letterpress degradation is not optional.
3. **Radial gradient backgrounds** on panels — not flat colors. The
   center should be warmer/lighter than the edges. Edison-bulb lit.
4. **Hard flat shadows** not soft blur shadows.
   `box-shadow: 0px 0px 32px 0px rgba(0,0,0,0.5)` not shadow-2xl.
   Plus inset top shadow for sculpted feel.
5. **Halftone dots** under cards and list backgrounds — the 1930s pulp
   magazine signature.
6. **No identical panels on the same page** — vary sizes, edge
   treatments, and depths. The instrument panel metaphor demands it.
7. **Mint-green/ember glow** should be visible and breathing on active
   states, not invisible at 0.04 alpha. `rgba(112, 248, 193, 0.15)` minimum.
8. **Custom scrollbar** — already implemented, keep it.
9. **Canvas-tinted selection color** — already amber, keep it.
10. **The vignette** should be warm-toned (amber undertone), not
    just darkness. `radial-gradient(ellipse at center, transparent 40%,
    rgba(16, 19, 13, 0.5) 90%, rgba(30, 20, 10, 0.3) 100%)` — the edges
    should feel like candlelight falling off, not just "dark vignette."

## ANTI-PATTERNS TO DESTROY

- Every page using the same `faceplate-brass chamfer px-6 py-4`
  header strip → kill it. Every page gets a UNIQUE header treatment
  matching its concept.
- Generic `<svg>` icons from heroicons/lucide paths → replace with
  Deadlock-style geometric clock-face glyphs or text-based sigils.
- `rounded-full` on every status dot → mix it up. Some dots, some
  diamond shapes, some crescents. The occult vocabulary has variety.
- `tracking-widest` on every label → vary it. Some labels tight,
  some wide, some vertical. Typography variety breaks the AI slop feel.
- Every button looking identical → buttons should have WEIGHT and
  MATERIAL differences. A "SUMMON" button should feel heavier than
  a "RETURN" button. Primary actions = thick brass + chamfer + glow.
  Secondary actions = thin brass-dark border + no chamfer.

## THE DISCORD EMBED CONNECTION

The dashboard should feel like it INSPIRED the Discord embeds, not the
other way around. The embeds use the same color tokens, the same
typographic hierarchy, the same "manifested entity" language. The
dashboard is the SOURCE — the embeds are the telegram.

## Typography Role Assignments

Typography roles are codified in `DESIGN.md` §2 (authoritative). Summary:

- Cinzel (display): hero placards, ceremonial section headers, parlor empty states. NOT track titles.
- IM Fell English SC (occult): ritual headings, summoning circle text, logo, **track titles**, navigation tabs, séance taglines
- Oswald (data): section labels, numbers, durations, stats, timestamps (tabular-nums)
- Inter (body): artist names, descriptions, body text

## SUMMARY — THE BAR

If a person who has never seen Storaboga Sound opens this dashboard,
they should feel like they've walked into a 1930s occultist's listening
parlor that happens to control a Discord bot. They should smell the
old paper and the brass and the candle wax. They should NOT feel like
they're looking at "a dark-themed web dashboard with some fancy CSS."
