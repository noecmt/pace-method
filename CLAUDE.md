# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PACE-method ("Personal AI Coach Engine") is **not an application** — it is a *method*
for AI-driven endurance coaching, distributed as a set of Markdown **skills** (later a
plugin) for agentic hosts (Claude Code, Claude Desktop), in the spirit of BMAD for
software. There is **no runtime, no build, no Python**. The deliverable is Markdown +
structured data files (CSV/JSON/YAML) that a host LLM reads.

Scope is **endurance sports** (cycling first, then running/triathlon/swimming). The
design docs (`docs/`) are written in **English** — write new docs, personas, and skills
in English too. Note: the `knowledge_base/` content carried over from the earlier PoC is
still partly in French (pending translation). Private strategy notes live in
`docs/internal/` (gitignored) and stay in French.

## Current state

The method is **implemented and packaged as a plugin**. On branch `v1.0.0` it was
re-architected from a 13-skill chain to a **master concierge + a menu of 5 voiced agents**
(ADR `docs/06_architecture_pivot.md`); the ADR is authoritative on `01`/`02`/`05`. Layout:

- `src/` — the **7 skills**: master `pace`; the voiced agents `pace-discovery`,
  `pace-planner`, `pace-coach`, `pace-analyst`; the shared tools `pace-elicitation`,
  `pace-validate`. Former *workflows* are now **local capability files** of their owning
  agent (`references/{vision-write,plan-write,rolling,checkin,adjust}.md`).
- `commands/` — the curated 5-command surface (`/pace`, `/pace-discovery`, `/pace-plan`,
  `/pace-today`, `/pace-debrief`); the 7 skills carry `user-invocable: false` (hidden from `/`).
- `extensions/` — connector contracts (`read`/`storage`/`calendar`) + domain/method `_schema.md`.
- `scenarios/` — the validation scenarios (+ `_grid.md`).
- `knowledge_base/` — `sports/cycling.json` and `principles/*.md` (carried from the PoC).
- `.claude-plugin/marketplace.json` — the plugin manifest; `pace.config.template.toml` (root) is the athlete-instance config.

## Read the design before doing anything

The docs are the source of truth. Read in this order:

- `docs/06_architecture_pivot.md` — **the ADR**: master concierge + menu of voiced agents; authoritative on `01`/`02`/`05`. Read this first.
- `docs/00_project_brief.md` — vision, problem, positioning ("the BMAD of coaching").
- `docs/01_architecture.md` — the skills/plugin/connector model, the three extension axes.
- `docs/02_method.md` — the `pace` master, the 3 modes, the voiced agents and their capabilities, artefacts.
- `docs/05_skill_map.md` — **the concrete skill-by-skill inventory and 7-skill tree** (the implementation reference).
- `docs/07_customize_merge.md` — how each agent resolves its `customize.toml` (`[surface]` + `[[agent.menu]]`) by the LLM, no runtime.
- `docs/04_evaluation.md` — how quality is measured (no code orchestrator -> evaluate artefacts).
- `docs/03_roadmap.md` — V0->V4 version sequence.

## Core architecture (the parts that span files)

**Artefacts are the contracts.** Agents never talk to each other directly — they
communicate only through versioned files in the athlete's repo (git *is* the database and
audit trail):

- `vision/vision.md` — narrative source of truth. **Amended, never rewritten.**
- `plan/plan.md` — hierarchical plan (season blocks -> approximate weeks -> precise sessions in the ~2-week window). Hard constraint: not modifiable beyond the immediate window without an explicit, visible git diff.
- `athlete/profile.json` — structured long-term state, including `learned_behaviors`. **Created once by the Discovery intake** (markers, current level, equipment — seeded only from what the athlete actually gave). Thereafter the Analyst (`pace-analyst`) is the **sole writer of updates** (and of `learned_behaviors`). Two writers, two moments — intake creates, the Analyst updates; no other agent writes it. On a plannable fact, `profile.json` is authoritative for the Planner; the Vision carries the *why*.
- `athlete/zones.json` — the **derived** artefact: intensity zones in concrete bounds (watts/bpm/pace), generated from `profile.json.fitness` + the sport pack. **Never hand-edited**; written by the planner's `plan-write` capability, regenerated whole by the Analyst on a marker change.
- `log/signals.md` — the **cross-session signals ledger**: append-only bullets the Analyst emits when a `signals.csv` threshold fires, and the only thing the `pace` master reads to propose re-Discovery/rolling on a *signal*. Per-session debriefs are **not** here — they live on the session object in `plan/weeks/<week>.json` (the single home for a session's whole lifecycle: `planned`, `rationale`, `actual`, `debrief`, `adjustment` — filled in place; past weeks are immutable history). That same week file also carries a **week-level `summary`** (sibling of `sessions`): a derived aggregate (counts, adherence, durations, `distance_km`, `intensity_split_min`, a neutral `read`) the Analyst refreshes idempotently on each debrief and the master recites in the concierge lane — derived, never fabricated; the Planner never writes it. The master's *other* proposal source is **plan-state, not a signal**: when `plan/index.csv` shows no near week planned after the active one, it proactively proposes rolling (`/pace-plan`) — never via `log/signals.md`.

Anything pluggable (a sport, a domain, a method) attaches to an *artefact*, never to an
agent's internals.

**One conversation owner at a time.** Exactly one agent is the single voice for its whole
flow; the steps it runs are **local capability files it reads** (no voice change), and the
only separate skills it may call as *tools* are `pace-elicitation` / `pace-validate`.

**`pace` is the master concierge / entry point.** It does not coach. It reads state
(does a Vision/Plan exist?), detects the mode (Discovery / Build / Run), and either
**answers the trivial case itself** (the concierge lane — e.g. reciting today's planned
session, or the week `summary`, verbatim) or **hands off to exactly one voiced agent** (the route lane: auto when
obvious, else propose 1–3). **One skill boundary per flow (master -> agent)** — never a
mid-flow skill-to-skill chain. Slash commands (`/pace-discovery`, `/pace-plan`,
`/pace-today`, `/pace-debrief`) force a route.

**The three modes:** Discovery (understand -> `vision.md`) -> Build (plan -> `plan.md`) ->
Run (execute/explain/adjust the already-planned session).

## Rules you must not break

- **Plan-first.** The plan precedes the session. The day's state *modulates* how a session is executed; it never dictates what the session is.
- **The Run coach NEVER generates a session.** The session already exists in the plan. This is the single most important prohibition in the method. The Run mode reads, explains why *this* session today, and modulates it — it never invents one. *Modulate* is exactly two operations: scale the planned session down within bounds (keeping its intent), or substitute a session from the fixed fallback catalog (active recovery/rest); never compose a new structured session.
- **Strict agent separation.** Each agent has one role and one voice; none produces what another owns.
- **Single voice.** Exactly one message reaches the athlete per turn — the owning agent's, in `[surface].language`. The invariant is now *architecturally enforced*: one skill boundary per flow (master -> agent), after which the agent stays the single voice and reads local capability files. Reading a capability file or calling a shared tool is **not** a voice change and is **never narrated**; a capability emits no user-facing text — its result is an internal object the agent renders, never a printed "SUMMARY FOR …" block. See `docs/02_method.md` ("Single voice").
- **The three extension axes are distinct — never conflate them:**
  - **Sport** = *knowledge* only -> a pack under `knowledge_base/sports/`. **Never a new agent.** Agents/capabilities are identical across sports.
  - **Domain** (nutrition, recovery…) = a *parallel advisor* agent that reads Plan/Session and writes **its own** artefact. **Never touches the training Plan.**
  - **Method** (polarized, double-threshold…) = a *pack* (Markdown + CSV of session structures) the Planner consumes, injected via `customize.toml` + knowledge files.

## Markdown vs. structured data

The split is deliberate and load-bearing:

- **Markdown** — reasoning, personas, narrative artefacts, training principles.
- **CSV/JSON/YAML** — anything enumerable, rule-based, or validatable. These are the
  anti-drift guardrails and make evaluation near-deterministic.

Key decision tables (specified in `docs/05_skill_map.md`):

- `periodization-rules.csv` — `phase,allowed_intensity,forbidden,volume_modifier` (the Planner must conform to this; covers all plan phases: base, build, taper, race, recovery).
- `adjustment-decisions.csv` — `signal,recommended_action,severity` (the coach's `adjust` capability reads this, does not improvise).
- `signals.csv` — strong-signal -> proposal (re-Discovery / rolling).
- `methods.csv` — elicitation techniques.

A skill is a folder with `SKILL.md` (frontmatter `name` + a "pushy" `description` for
triggering, then instructions) plus, as needed, `references/` (loaded on demand),
`assets/` (templates, checklists), `customize.toml`, and `*.csv` tables.

Knowledge files: principles are Markdown with YAML frontmatter
(`id, category, applies_to, source, version`); sport profiles are JSON conforming to a
(planned) `knowledge_base/sports/_schema.md` contract.

## Testing / evaluation

There are no unit tests. Quality is validated by **scenarios + structured tables**,
mostly by hand:

- Write `scenarios/*.md` (input + *expected properties*, not exact output) **before**
  writing personas — they define what the method must do. The six V0 scenarios are listed
  in `docs/04_evaluation.md` (overload constraints, memory persistence, profile
  contradiction, taper override, degraded input, routing).
- Deterministic checks compare an output against the relevant CSV (periodization,
  adjustment); `.md` checklists are rubrics for qualitative checks.
- **Gate: a scenario that doesn't pass = no merge.**

The contracts are *contracts-first*, not *frozen-forever*: a Sprint-1 artefact (a
scenario, a CSV table, a template) **may be amended in a later sprint when it is justified
and pertinent** — e.g. when implementation reveals an inconsistency — provided the change
is **visible in a git diff** and keeps the structured files lint-clean. Refining the
contract to match a sounder design is expected; silently drifting from it is not.

When extending the method, keep the contracts-first order: scenarios + CSV tables +
templates first, then the affected agent/capability, then validate against the six
scenarios (the deterministic checks must stay green — `node tools/lint-contracts.mjs` if
the linter is present).
