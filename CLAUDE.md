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

## Current state vs. target

The repo is at the **design-frozen, pre-implementation V0** stage. Only two directories
exist today:

- `docs/` — the full design (read these first; see below).
- `knowledge_base/` — sport profiles (`sports/cycling.json`) and training
  `principles/*.md` (carried over from an earlier POC).

The target source tree (`src/`, `extensions/`, `scenarios/`) does **not exist yet** — it
is specified in `docs/05_skill_map.md` and built in the order of `docs/SPRINT_PLAN.md`.
Do not assume those paths are present; create them per the skill map when implementing.

## Read the design before doing anything

The docs are the source of truth. Read in this order:

- `docs/00_project_brief.md` — vision, problem, positioning ("the BMAD of coaching").
- `docs/01_architecture.md` — the skills/plugin/connector model, the three extension axes.
- `docs/02_method.md` — `pace-master`, the 3 modes, personas, workflows, artefacts.
- `docs/05_skill_map.md` — **the concrete skill-by-skill inventory and target tree** (the implementation reference).
- `docs/SPRINT_PLAN.md` — strict build order; a sprint starts only when the prior Definition of Done is green.
- `docs/04_evaluation.md` — how quality is measured (no code orchestrator -> evaluate artefacts).
- `docs/03_roadmap.md` — V0->V4 version sequence.

## Core architecture (the parts that span files)

**Artefacts are the contracts.** Personas never talk to each other directly — they
communicate only through four artefacts, written as versioned files in the athlete's repo
(git *is* the database and audit trail):

- `vision/vision.md` — narrative source of truth. **Amended, never rewritten.**
- `plan/plan.md` — hierarchical plan (season blocks -> approximate weeks -> precise sessions in the ~2-week window). Hard constraint: not modifiable beyond the immediate window without an explicit, visible git diff.
- `athlete/profile.json` — structured long-term state, including `learned_behaviors`. Sole writer: the Analyst (`pace-debrief`). On a plannable fact, `profile.json` is authoritative for the Planner; the Vision carries the *why*.
- `log/` — completed sessions, check-ins, debriefs, signals.

Anything pluggable (a sport, a domain, a method) attaches to an *artefact*, never to a
persona's internals.

**One conversation owner at a time.** Exactly one persona speaks to the athlete at any
moment; workflows and other personas run "behind" by reading/writing artefacts.

**`pace-master` is the orchestrator/entry point.** It does not coach. It reads state
(does a Vision/Plan exist?), detects the mode (Discovery / Build / Run), and either auto-
routes (when obvious) or **proposes** 1–3 personas/workflows and lets the athlete choose,
then passes context and loads the target skill. Slash commands (`/pace-discovery`,
`/pace-plan`, `/pace-today`, `/pace-debrief`) force a route.

**The three modes:** Discovery (understand -> `vision.md`) -> Build (plan -> `plan.md`) ->
Run (execute/explain/adjust the already-planned session).

## Rules you must not break

- **Plan-first.** The plan precedes the session. The day's state *modulates* how a session is executed; it never dictates what the session is.
- **The Run coach NEVER generates a session.** The session already exists in the plan. This is the single most important prohibition in the method. The Run mode reads, explains why *this* session today, and modulates it — it never invents one. *Modulate* is exactly two operations: scale the planned session down within bounds (keeping its intent), or substitute a session from the fixed fallback catalog (active recovery/rest); never compose a new structured session.
- **Strict persona separation.** Each persona has one role and one voice; none produces what another owns.
- **The three extension axes are distinct — never conflate them:**
  - **Sport** = *knowledge* only -> a pack under `knowledge_base/sports/`. **Never a new agent.** Personas/workflows are identical across sports.
  - **Domain** (nutrition, recovery…) = a *parallel advisor* persona/workflow that reads Plan/Session and writes **its own** artefact. **Never touches the training Plan.**
  - **Method** (polarized, double-threshold…) = a *pack* (Markdown + CSV of session structures) the Planner consumes.

## Markdown vs. structured data

The split is deliberate and load-bearing:

- **Markdown** — reasoning, personas, narrative artefacts, training principles.
- **CSV/JSON/YAML** — anything enumerable, rule-based, or validatable. These are the
  anti-drift guardrails and make evaluation near-deterministic.

Key decision tables (specified in `docs/05_skill_map.md`):

- `periodization-rules.csv` — `phase,allowed_intensity,forbidden,volume_modifier` (the Planner must conform to this; covers all plan phases: base, build, taper, race, recovery).
- `adjustment-decisions.csv` — `signal,recommended_action,severity` (the Adjust workflow reads this, does not improvise).
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

When implementing, follow the sprint order: scenarios + CSV tables + templates first, then
`pace-master` + core skills, then Discovery->Vision->Plan, then Run, then validate against
all six scenarios.
