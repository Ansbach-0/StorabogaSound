# AI Agent Pipeline — How This Project Was Actually Built

> **tl;dr:** This project was built by a **multi-agent AI pipeline** — a human orchestrator directing specialized agents (design, research, build) through goal-first briefs, visual verification gates, and review loops. The architecture, the failures, and the fixes are documented below.

---

## 🧠 The Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HUMAN ORCHESTRATOR                        │
│              (direction, taste, verification, version control)   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ briefs + review loops
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   HERMES      │    │  DESIGN AGENT   │    │  RESEARCH AGENT  │
│  (orchestrator)│    │ (builder)        │    │ (researcher)      │
│ Orchestrates  │───▶│ Antigravity CLI  │    │ deepseek-v4-flash│
│ agents,       │    │ gemini-3.7-flash │    │ via opencode-go  │
│ writes briefs,│    │ -high, account   │    │ researches docs, │
│ monitors,     │    │ pool rotation    │    │ verifies facts   │
│ verifies      │    │ (design+build)   │    │                  │
└───────────────┘    └──────────────────┘    └──────────────────┘
```

| Role | Tool | Job |
|---|---|---|
| **The Orchestrator** | [Hermes Agent](https://github.com/NousResearch/hermes-agent) (Nous Research) | Orchestration: writes goal-first briefs, dispatches work, watches agents in real-time (live file-write monitoring), runs verification loops, handles git/version control, and makes the calls the agents can't |
| **The Worker** | [Google Antigravity CLI](https://antigravity.google) (the CLI) — **design agent**, `gemini-3.7-flash-high` | The actual design + code: studied references, built components, ran its own visual QA. Backed by a pool of Google AI Pro accounts with quota rotation |
| **The Researcher** | **Research agent** — `deepseek-v4-flash` | Independent research: pulled Google's own prompting docs, sourced and **date-verified** 2026 game footage, wrote manifests — an independent second opinion |

---

## 🏗️ How a Feature Actually Gets Built

1. **Brief, not spec** — the orchestrator writes a *goal-first, freedom-preserving* brief: what the screen must be, which references to study, what to keep functional. Not a 5,000-word rule wall.
2. **Reference = authority** — the design agent is pointed at real source material (game frames, the live component playground, the actual npm packages) and required to study it directly before touching code.
3. **Agent builds** — the design agent explores, plans, writes code, and iterates.
4. **Visual gate** — the design agent screenshots its own work with headless Chrome and reviews it itself before declaring done. No more "I wrote it so it must look good."
5. **Human review** — the orchestrator screenshots again, sends pixels to the human, and the human's verdict drives the next pass.
6. **Ship** — version control, commit hygiene, push.

---

## 💥 The Struggles (and How We Overcame Them)

This is the part that matters — every one of these was a real failure we diagnosed and fixed:

### 1. "Biggest AI slop I've seen in years" — the over-constraining trap
The first UI attempt was **over-constrained**: a massive brief with endless do-nots. The agent burned its intelligence on rule-compliance and produced a generic dashboard with game-colored paint.
**Fix:** the research agent pulled Google's official Gemini/Antigravity prompting docs and found the documented failure mode: *"verbose or complex prompt engineering techniques designed for older models may cause the model to over-analyze."* We rewrote the brief system to be **goal-first, constraint-light, persona-with-voice** — and the agent's design quality jumped immediately.

### 2. Dated reference material
The first screenshots were pre-*Old Gods* Deadlock — the game's UI had changed, and the agent faithfully replicated an outdated look.
**Fix:** the research agent sourced **2026 community video tours** and — critically — **date-verified every video** (`yt-dlp --print upload_date`) and *rejected pre-2026 footage*. It extracted 42 curated frames across 7 screen types. The agent now studied the actual current game.

### 3. The agent couldn't see its own work
Screens shipped with detached buttons and clipped text because the agent never actually *looked* at its output.
**Fix:** a hard **visual self-gate**: the agent screenshots every view with headless Chrome, opens the screenshots, reviews them against a checklist, fixes, re-screenshots, and may not report DONE until its own eyes pass.

### 4. Reimplementing what already existed
The design agent hand-built the game.s shop panel from screenshots — a "1:1 copy" that looked right but wasn't the real thing.
**Fix:** we discovered the actual deadlock-ui ships as **published npm packages** (`@deadlock-api/ui-react` / `ui-core`). The hand-built imitation was deleted and replaced with the real web components — real JS behavior, real tooltips, real hover-scale.

### 5. "Too futuristic, colors don't match the game"
The agent drifted into neon-teal cyberpunk. Deadlock is *warm*.
**Fix:** Valve's decompiled CSS palette became **the law** — cream `#FFEFD7`, mint `#70F8C1`, gold `#FFED79` — with the instruction *"if a color isn't in the list, don't use it."*

### 6. The whole thing had to fit in 1GB of RAM
The bot's home is a 1GB VPS — and that constraint killed every easy answer before we started. No Lavalink (a Java server we can't afford), no separate Node runtime, no WebSocket services with memory overhead. The architecture was forced into its final shape by the budget:
- **One Python process** — discord.py + FastAPI + SSE + SQLite in a single process, no orphans
- **React compiled to static files**, served in-process by FastAPI — no Node in production
- **SSE instead of WebSockets** — server-push with a fraction of the overhead
- **No external database** — aiosqlite, zero server processes
The 1GB budget became a design tool: every layer of the stack is there because it *earned* its bytes. The dashboard's visual richness (real game components, 100+ icons, layered textures) costs nothing at runtime — it's all static assets.
---

## 📌 Lessons

- **Orchestration is a skill.** Directing agents with the right brief structure produces fundamentally better output than prompting harder.
- **Verification loops are everything.** Visual self-gates, date-verified sources, contract tests against the real backend — the human's job is to build the loops, not write every line.
- **Agents fail like juniors** (over-constraint paralysis, dated sources, no self-review) **and respond to the same fixes** — clear direction, good references, review checkpoints.
- **The human sets taste.** Every "this is perfect" / "this is slop" call in this project's history was a human verdict that steered the next iteration.

---

*Built with: Hermes Agent (Nous Research) · Google Antigravity CLI (gemini-3.7-flash-high) · opencode-go (deepseek-v4-flash) · a lot of headless Chrome screenshots · and one orchestrator who learned that the best AI workflow is a loop of brief → build → look → fix.*
