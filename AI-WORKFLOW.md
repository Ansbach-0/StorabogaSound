# AI Agent Pipeline — How This Project Was Actually Built

> **tl;dr:** This project was built by a **multi-agent AI pipeline** — the ideas came from a human, the execution was delegated through a custom orchestration layer that acts as a second brain: it writes goal-first briefs, dispatches to specialized agents, verifies their work, iterates on failures, and ships. The architecture, the failures, and the fixes are documented below.

---

## 🧠 The Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      HUMAN (IDEAS & TASTE)                       │
│        "make it look like the game" · "this is slop"            │
│             "this is perfect" · "warmer colors"                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                  ORCHESTRATION LAYER (the "second brain")        │
│   writes briefs · dispatches · monitors · verifies · commits    │
│   runs the custom skill/delegation pipeline · learns over time  │
└───────────────┬──────────────────────────────┬──────────────────┘
                │                              │
                ▼                              ▼
      ┌──────────────────┐          ┌──────────────────────┐
      │   BUILD AGENT    │          │    RESEARCH AGENT    │
      │  Antigravity CLI │          │  multiplexed profile │
      │   (worker)       │          │  (custom delegation  │
      │  design + code   │          │   pipeline — sub-    │
      │  visual self-gate│          │   agents learn and   │
      │  account rotation│          │   improve over time) │
      └──────────────────┘          └──────────────────────┘
```

| Role | Platform | Job |
|---|---|---|
| **The Human** | — | Ideas, direction, taste. Every "this is slop" / "this is perfect" verdict in this project's history came from here |
| **Orchestration Layer** | [Hermes Agent](https://github.com/NousResearch/hermes-agent) (Nous Research) | Acts as a **second brain**: turns ideas into goal-first briefs, dispatches work, monitors agents in real-time (live file-write monitoring), runs verification loops, handles version control, and ships. The human never touches the delegation mechanics |
| **Build Agent** | [Google Antigravity CLI](https://antigravity.google) | Design + code: studies references, builds components, screenshots its own work and reviews it before declaring done. Backed by a pool of accounts with quota rotation |
| **Research Agent** | Multiplexed profile in the custom delegation pipeline | Independent research and verification. Runs as its own persistent profile — **unlike stock subagents, it keeps its own skills and memory and gets measurably better over time**: it learned the video→frame→reference-pack workflow as a skill, updated its memory with new principles after every task, and applied them on the next one |

**Model-agnostic by design:** the pipeline describes *roles and platforms*, not models. The orchestration layer, the build agent, and the research agent can each run on whatever model fits the job — the architecture doesn't care. Models are a swappable detail, the delegation system is the point.

---

## 🏗️ How a Feature Actually Gets Built

1. **Human gives an idea** — "let's make a Deadlock-themed dashboard", "the queue is too small", "make the backgrounds warmer"
2. **Brief, not spec** — the orchestration layer writes a *goal-first, freedom-preserving* brief: what the screen must be, which references to study, what to keep functional. Not a 5,000-word rule wall
3. **Reference = authority** — the build agent is pointed at real source material (game frames, the live component playground, the actual npm packages) and required to study it directly before touching code
4. **Agent builds** — the build agent explores, plans, writes code, and iterates
5. **Visual gate** — the build agent screenshots its own work with headless Chrome and reviews it itself before declaring done. No more "I wrote it so it must look good."
6. **Human review** — screenshots go back to the human; the verdict drives the next pass
7. **Ship** — version control, commit hygiene, push

The loop is: **idea → brief → build → look → fix → ship**. It runs on every feature, every screen, every iteration.

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
The build agent hand-built the game's shop panel from screenshots — a "1:1 copy" that looked right but wasn't the real thing.
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

- **Delegation is a skill.** The human's job is ideas and taste; the orchestration layer's job is turning them into briefs the agents can actually execute. Directing agents with the right brief structure produces fundamentally better output than prompting harder.
- **Verification loops are everything.** Visual self-gates, date-verified sources, contract tests against the real backend — the loop exists so nothing ships unseen.
- **Agents fail like juniors** (over-constraint paralysis, dated sources, no self-review) **and respond to the same fixes** — clear direction, good references, review checkpoints.
- **A pipeline that learns compounds.** The research agent's skills and memory grew across this project — every hard-won lesson became a reusable skill for the next task.
- **The human sets taste.** Every "this is perfect" / "this is slop" call was a human verdict that steered the next iteration. The pipeline amplifies taste; it doesn't replace it.

---

*Built with: Hermes Agent (Nous Research) as the orchestration layer · Google Antigravity CLI as the build platform · a custom multiplexed delegation pipeline with self-learning agent profiles · a lot of headless Chrome screenshots · and the loop: idea → brief → build → look → fix → ship.*
