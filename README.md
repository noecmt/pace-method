# PACE-method

**An open-source, plan-first coaching method for endurance sports, distributed as AI agent skills.**

![Plugin](https://img.shields.io/badge/plugin-v0.4.0-blue)
![License](https://img.shields.io/badge/license-MIT-blue)
![Language](https://img.shields.io/badge/language-Markdown-blue)

PACE is a **method, not an app**. No runtime, no build, no code to run. It distributes endurance coaching as a set of Markdown **skills** for agentic hosts (Claude Code, Claude Desktop), in the spirit of what BMAD brought to software development.

It imposes a **plan-first** logic: understand the athlete -> build a coherent season plan -> modulate execution day by day. Personas never talk to each other directly; they communicate only through versioned artefacts (`vision`, `plan`, `profile`, `log`) — git is the database and the audit trail.

## Status

The method is **implemented as skills and packaged as a plugin** (`v0.4.0`, within the V1 roadmap milestone). Cycling first; running / triathlon / swimming next. The skills run fully on the **local filesystem** with zero external dependencies; optional **connectors** (Strava, GitHub, Notion, Google) enrich or relocate the data without ever being required.

`v0.4.0` adds **concrete intensity zones** (the coach holds you to real watts / bpm / pace, never vague labels), a Discovery **intake** that captures your fitness markers, a first-run **onboarding** wizard, a single source of output language, and a **curated 5-command surface**.

## Install

PACE ships as a Claude Code / Claude Desktop **plugin** (the `pace` plugin in this repo's marketplace):

```text
/plugin marketplace add noecmt/pace-method
/plugin install pace@pace-method
```

On a **first run**, a short **onboarding** sets your language, storage, and connectors (saved to `pace.config.toml`), then hands you to Discovery. After that, just describe your situation — a goal, today's session, how you feel, a race — or use a curated command:

```text
/pace            start here (onboards on first run, otherwise routes)
/pace-discovery  revisit your goal / profile
/pace-plan       (re)build the plan
/pace-today      today's planned session
/pace-debrief    report what you did / how you feel
```

The orchestrator **`pace-master`** reads your state, detects the mode (Discovery / Build / Run), and routes to the right coach. Artefacts are written to the current folder by default.

Prefer no install? `git clone` the repo and point your agent at `src/` — the skills are plain Markdown.

## How it works

The three modes — **Discovery -> Build -> Run** — produce a narrative vision, a periodized plan, and a daily execution loop that explains and modulates the planned session **without ever regenerating it**, holding you to the concrete zone bounds (watts / bpm / pace) derived from your fitness markers. The hard rule: the day's state modulates *how* a planned session is executed; it never dictates *what* the session is.

## Connectors (optional, capability-detected)

A connector attaches a capability to an **artefact** — it is **never** a new persona, never overrides the method, and PACE works fully without any of them. Each is detected at use time and **degrades gracefully** to a local default, so **no data is ever lost** whichever backend you choose:

| Class | What it does | Backends | Fallback |
|---|---|---|---|
| **read** | pull completed-session data / signals | Strava (official MCP) | manual entry / `log/` |
| **storage** | where the artefacts live | local · GitHub · Notion · Google Drive | local filesystem |
| **calendar** | deliver upcoming sessions | `plan/calendar.csv` · Google Calendar · Notion | `plan/calendar.csv` |

Your backend choices and private IDs live in `pace.config.toml` (template: [`src/core-skills/pace-customize/pace.config.template.toml`](src/core-skills/pace-customize/pace.config.template.toml)); the pack defaults sit in `pace-customize`. See [`extensions/connectors/`](extensions/connectors/) for the capability contract and each instance.

## Read first (design)

The design docs are the source of truth. Start here:

1. [`docs/00_project_brief.md`](docs/00_project_brief.md) — vision, problem, positioning.
2. [`docs/01_architecture.md`](docs/01_architecture.md) — the skills / plugin / connector model and the three extension axes.
3. [`docs/02_method.md`](docs/02_method.md) — the orchestrator, the three modes, personas, workflows, artefacts.
4. [`docs/03_roadmap.md`](docs/03_roadmap.md) · [`docs/04_evaluation.md`](docs/04_evaluation.md) · [`docs/05_skill_map.md`](docs/05_skill_map.md).

## License

MIT License. See [LICENSE](LICENSE).
