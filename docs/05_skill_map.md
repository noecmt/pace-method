# 05 — Skill Map (inventory to build)

Concrete skill-by-skill inventory. For each skill: its type, what it reads / writes, its structured files, and the version where it appears. This is the reference document for implementation.

> Updated 2026-06 to the **master-concierge + menu-of-voiced-agents** model (see `06_architecture_pivot.md`). The count drops **13 -> 7**: former *workflow* skills are absorbed into their owning agent as **local capability files** (`references/*.md`), and `pace-customize` is dissolved into per-agent `customize.toml`.

**Types**: `master` (concierge) · `agent` (a who, with its voice) · `tool` (heavy shared utility, called as a tool) · `capability` (a local file the owning agent reads — *not* a skill).

**Anatomy of a skill**: `SKILL.md` (frontmatter `name` + a pushy `description`, then instructions) + as needed `references/` (capability files) · `assets/` (templates, checklists) · `customize.toml` (menu + surface) · `*.csv` (decision tables).

---

## Migration table (13 -> 7)

| New skill | Type | Absorbs (was a separate skill in V0) |
|---|---|---|
| `pace` (master) | master | `pace-master` |
| `pace-discovery` | agent | `pace-agent-discovery` + `pace-vision` (now the `vision-write` capability) |
| `pace-planner` | agent | `pace-agent-planner` + `pace-plan` + `pace-rolling` (now `plan-write` / `rolling` capabilities) |
| `pace-coach` | agent | `pace-agent-coach` + `pace-checkin` + `pace-adjust` (now `checkin` / `adjust` capabilities) |
| `pace-analyst` | agent | `pace-agent-analyst` (was the `pace-debrief` folder) |
| `pace-elicitation` | tool | unchanged (called as a tool, agent keeps its voice) |
| `pace-validate` | tool | unchanged (called as a tool, agent keeps its voice) |
| — | dissolved | `pace-customize` -> per-agent `customize.toml` + LLM merge |

**5 agents + 2 shared tools = 7 skills.** The one rule (ADR §4.2): *a skill boundary is crossed at most once per flow — master -> agent; thereafter the agent reads local files and never invokes another skill mid-flow.*

---

## Target tree

```
src/
├── pace/                              <- master concierge (entry point)
│   ├── SKILL.md
│   ├── customize.toml                 <- [[agent.menu]] intent menu + [surface]
│   ├── references/routing.md
│   └── signals.csv                    <- strong-signal -> proposal (read by the master)
├── pace-discovery/
│   ├── SKILL.md
│   ├── customize.toml
│   ├── references/vision-write.md     <- capability (was pace-vision); validates via pace-validate
│   └── assets/vision-template.md
├── pace-planner/
│   ├── SKILL.md
│   ├── customize.toml
│   ├── references/{plan-write.md, rolling.md}   <- capabilities (was pace-plan / pace-rolling)
│   └── assets/{plan-template.md, periodization-rules.csv, week-example.json, index-example.csv}
├── pace-coach/
│   ├── SKILL.md
│   ├── customize.toml
│   ├── references/{checkin.md, adjust.md}       <- capabilities (was pace-checkin / pace-adjust)
│   └── assets/adjustment-decisions.csv
├── pace-analyst/
│   ├── SKILL.md
│   └── customize.toml                 <- writes session actual+debrief to weeks/*.json,
│                                          signals to log/signals.md, learned_behaviors +
│                                          regenerated zones.json from profile.json
├── pace-elicitation/                  <- shared tool
│   ├── SKILL.md
│   └── methods.csv
└── pace-validate/                     <- shared tool, sole owner of the checklists
    ├── SKILL.md
    └── assets/{vision-checklist.md, plan-checklist.md}

knowledge_base/
├── principles/*.md
└── sports/{cycling.json, _schema.md}

extensions/
├── connectors/                        <- capability layer (read / storage / calendar); not a 4th axis
│   ├── _schema.md
│   ├── read.md, strava.md
│   ├── storage.md, storage-{github,notion,gdrive}.md
│   └── calendar.md, calendar-{local,gcal,notion}.md
├── domains/_schema.md
└── methods/_schema.md
```

The athlete-instance config (connectors + integration IDs, formerly `pace-customize/pace.config.template.toml`) lives at the plugin root as a `pace.config.template.toml` the master copies into the athlete repo on first run — it is instance config, not a skill's customization surface.

---

## Skill detail

| Skill | Type | Reads | Writes | Structured / local files | Version |
|---|---|---|---|---|---|
| `pace` | master | state (vision/plan), message, signals, `index.csv` horizon | (recites session/week `summary` in concierge lane; routes in route lane; proposes rolling on horizon depletion) | `references/routing.md`, `signals.csv`, `customize.toml` | V0 (horizon nudge: V1) |
| `pace-discovery` | agent | profile, answers | `vision/vision.md` (via `vision-write`) | `references/vision-write.md`, `assets/vision-template.md`, `customize.toml` | V0 |
| `pace-planner` | agent | vision, profile, KB, recent `weeks/*.json` | `plan/plan.md`, `weeks/*.json`, `zones.json` (first creation) | `references/{plan-write.md, rolling.md}`, `assets/{plan-template.md, periodization-rules.csv, week-example.json, index-example.csv}`, `customize.toml` | V0 (rolling: V1) |
| `pace-coach` | agent | plan, session, day state, `adjustment-decisions.csv` | session `rationale` + `adjustment` (`weeks/*.json`) | `references/{checkin.md, adjust.md}`, `assets/adjustment-decisions.csv`, `customize.toml` | V0 |
| `pace-analyst` | agent | `weeks/*.json`, `log/signals.md`, plan | session `actual`+`debrief` **+ week-level `summary`** (`weeks/*.json`), `log/signals.md`, `profile.json` (learned_behaviors), `zones.json` (regenerated) | `customize.toml` | V0 (minimal; `summary`: V1) |
| `pace-elicitation` | tool | — | — | `methods.csv` | V0 |
| `pace-validate` | tool | target artefact | validation report (internal) | `vision-checklist.md`, `plan-checklist.md` (shape-checks against `extensions/{week,index}.schema.json`) | V0 |

> **Minimal V0 scope** (plan-first validation): `pace`, `pace-elicitation`, `pace-validate`, `pace-discovery` (+ `vision-write`), `pace-planner` (+ `plan-write`), `pace-coach` (+ `checkin` + `adjust`), and `pace-analyst` **in a minimal declarative version** (just appending a `learned_behavior` to `profile.json` — needed for scenario 02). The rest (the `rolling` capability and the measured/Strava debrief) comes later.

> **Customization without a runtime.** Each agent ships a `customize.toml` carrying its `[[agent.menu]]` (the menu items, each dispatching to a capability via `prompt = "Read and follow {skill-root}/references/x.md"`, or to a shared tool via `skill = "pace-validate"`) and its `[surface]` (output language, verbosity, tonal nuance, elicitation depth, default preferred method). The override stack (skill default -> athlete override) is **resolved once, by the LLM, at the agent's activation** — read the files, merge per the structural rules, bind to the agent for the whole flow. **No Python, no runtime.** The merge spec the agents follow is the body of the former `pace-customize` skill (kept as documentation, not as a skill). `[surface]` may only touch surface traits — never a role, a prohibition, the periodization guardrails, the artefact contracts, plan-first, or the modulate-vs-generate boundary.

> **Capability vs shared tool.** A *capability* (vision-write, plan-write, rolling, checkin, adjust) is a local `references/*.md` the owning agent **reads into the same context** — no skill boundary, no voice change. A *shared tool* (`pace-elicitation`, `pace-validate`) is a separate skill **called as a tool** because it is heavy and reused across agents; the calling agent keeps its voice (the legitimate BMAD `skill =` case). Never re-introduce a former workflow as a skill.

> **Command surface & the name overlap (resolved).** The curated `/` surface is the **five commands** in `commands/` (`/pace`, `/pace-discovery`, `/pace-plan`, `/pace-today`, `/pace-debrief`); each delegates to the `pace` master with a forced route. **All seven skills carry `user-invocable: false`**, so they are **model-invocable but hidden from the `/` menu**. Two agent names overlap with command names (`pace`↔`/pace`, `pace-discovery`↔`/pace-discovery`), but this is **harmless** here: because the skills never appear at `/`, those tokens resolve to the commands, and the master-concierge model has **no mid-flow skill re-invocation** to loop on (the V0 loop came from the old "load the target skill and let it take over" protocol, now gone). So no name offset is needed — the inventory uses the ADR agent names as-is. Each agent's `customize.toml` carries its `[[agent.menu]]` (capabilities via `prompt = "Read and follow {skill-root}/references/<x>.md"`, shared tools via `skill = "pace-validate"`) + an overridable `[surface]`.

> **Connector layer** (`extensions/connectors/`, V1): a capability attached to the artefacts — `read` (Strava), `storage` (local / GitHub / Notion / Drive), `calendar` (`plan/calendar.csv` / Google / Notion). Consumed **inside an agent's capability files** (read: `checkin` / analyst / `rolling`; storage: every persisting capability + the master's session setup; calendar: `plan-write` / `rolling` / `adjust`), configured via `pace.config.toml`, and **degrading gracefully to local** so no data is ever lost. Never a 4th extension axis, never a persona, never called from the master to decide.

---

## Contracts of the structured files

The CSV contracts are **unchanged by the pivot** (they live with their new owner per the tree above).

### `periodization-rules.csv` (under `pace-planner/assets/`)

Must cover **all** the phases the plan uses (blocks `Base, Build, Taper, Race` + recovery/transition weeks). Values below = reasonable defaults, **to be validated in the expert sprint**.

```
phase,allowed_intensity,forbidden,volume_modifier
base,"Z1,Z2,Z3,sweet_spot","Z4,Z5",1.0
build,"Z1,Z2,Z3,Z4,Z5",none,1.0
taper,"Z1,Z2","exhausting_long_ride",0.5
race,"Z1,Z2","structured_intervals,exhausting_long_ride",0.4
recovery,"Z1,Z2","Z4,Z5,exhausting_long_ride",0.6
```

### `adjustment-decisions.csv` (under `pace-coach/assets/`)

**Action semantics** ("modulate vs generate" boundary, see `02_method.md`): each `recommended_action` is either a **bounded scaling** of the planned session (reduce duration/intensity, extend duration at constant intent), or a **substitution with a fallback-catalog id** (`active_recovery`, `rest` — drawn from the sport pack's `key_sessions`). Never an invented structure.

```
signal,recommended_action,severity
high_fatigue,reduce_intensity_or_rest,high
poor_sleep,reduce_intensity,medium
joint_pain,active_recovery_or_rest,high
reduced_time,shorten_keeping_intent,low
more_time,extend_existing_z2_block,low
heatwave,reschedule_or_reduce,medium
```

### `signals.csv` (under `pace/`)

Lives with the master (not the Analyst): it's the routing that proposes a re-Discovery/rolling on a strong signal, from V0 (scenario 06). The Analyst *emits* signals into `log/signals.md`; the master *maps* them to a proposal via this table.

```
signal,threshold,proposal
goal_reached_or_cancelled,immediate,partial_discovery
sessions_skipped,3_weeks,partial_discovery_or_rolling
metric_stagnation,4_weeks,rolling_or_discovery
life_change,declared,discovery
```

> **A second proposal source — plan-horizon depletion.** Beyond the signals table, the master also proposes **rolling** when it reads `plan/index.csv` and finds **no `horizon:near` row `status:planned` after the active one** (the precise window is depleted). This is a **plan-state read** the master does itself — *not* a signal, never via the Analyst or `log/signals.md` — surfaced in the concierge lane as a one-line `/pace-plan` proposal (propose, never impose; never stapled onto an auto-route). The roll is the Planner's `rolling` capability. Scenario 14.

### week-level `summary` (on `plan/weeks/<week>.json`, written by `pace-analyst`)

The session object is the home of a *session's* lifecycle; the **week** is the home of the *week* aggregate. The Analyst maintains a derived `summary` block (sibling of `sessions`), refreshed idempotently on each debrief — **derived data only, never fabricated**, and recited verbatim by the master in the concierge lane ("summarize my week"). Full frozen schema: `extensions/_artefact_schema.md`; worked example: `src/pace-planner/assets/week-example.json`. Fields:

```
summary: {
  status: in_progress | complete,                         # complete once no session is pending/planned
  sessions: { total, done, adjusted, skipped, pending },  # counts by status
  adherence,                                              # (done+adjusted)/(done+adjusted+skipped); pending excluded
  duration_min: { planned, actual },                      # actual sums done|adjusted
  distance_km: { <sport>: actual },                       # keyed by sport, actual only (cross-sport sum is meaningless); mono-sport = one key
  intensity_split_min: { "Z1-Z2", "Z3", "Z4-Z5" },        # actual minutes by dominant planned zone (session-level); zone numbers exist in every pack
  by_sport: { <sport>: { sessions, duration_min, distance_km } },  # ONLY when the week has >1 sport; per-sport split (sessions=count, duration/distance=actual)
  read,                                                   # neutral synthesis, <=2 sentences, [surface].language
  generated_by: "pace-analyst", generated_at
}
```

The other `summary` fields are **sport-agnostic totals** (they sum cleanly across disciplines). Scenario 13. The Planner (`plan-write`/`rolling`) never writes `summary`; the master never recomputes it.

### `methods.csv` (elicitation, under `pace-elicitation/`)

```
num,category,name,description,when_to_use
1,opening,open_question,let the athlete talk freely,start of discovery
2,clarification,probe_on_ambiguity,dig into a vague or contradictory answer,vague answer
3,prioritization,trade_off,force a choice between two goals,multiple goals
...
```

### `knowledge_base/sports/_schema.md`

Contract of a sport pack (to add running, tri, swimming without touching the trunk): `sport_id, primary_metric, fitness_marker, intensity_zones, key_sessions, periodization`. The PoC's `cycling.json` is the reference instance.

### `extensions/domains/_schema.md` and `extensions/methods/_schema.md`

Contracts of axes 2 and 3. Present from now on (even if not implemented) to freeze the extension interface: a domain pack declares what it reads (plan/session) and its output artefact; a method pack declares its planning strategy + its session structures.

### `extensions/_artefact_schema.md` (+ the executable schemas)

The **frozen contract of the core artefacts** (`weeks/*.json`, `profile.json`, `zones.json`): their `schema_version`, the session object (`id`/`slot`/`sport` + the metric-agnostic `target`), the week `summary` (incl. per-sport `distance_km`/`by_sport`), and the **discipline (session) vs programme (athlete)** split — `profile.sports[]` + `fitness`/`zones` keyed by discipline. This is the data point-fixed at `v1.0.0`.

`_artefact_schema.md` is the **human-readable** contract; the **machine-checkable** ones ship beside it and are authoritative on shape:

- `extensions/week.schema.json` — **JSON Schema** (draft 2020-12) for `plan/weeks/<week_id>.json`. `additionalProperties:false` throughout (the stable shape a visual or validator can rely on), enums for `phase`/`load_type`/`status`/`metric`, `id`/`date` patterns, the full lifecycle (plan → `rationale`/`adjustment` → `actual`/`debrief` → `summary`), and the gated additive `custom` map.
- `extensions/index.schema.json` — **Table Schema** (Frictionless) for `plan/index.csv`. A CSV has no schema language of its own, so its column contract (names, normative order, enums, `BREAK`, near-only `file`) is expressed in JSON.
- `extensions/profile.schema.json` — **JSON Schema** (draft 2020-12) for `athlete/profile.json`. `additionalProperties:false`, `fitness` **keyed by discipline**, `current_phase` enum (the periodization phases), and `learned_behaviors[]` each keyed by `id`.
- `extensions/zones.schema.json` — **JSON Schema** (draft 2020-12) for `athlete/zones.json`. The `by_discipline` map with optional `power_zones`/`hr_zones`/`pace_zones`. The **relational** invariants (zone `id` order & contiguity, `by_discipline.<d>.fitness_markers == profile.fitness.<d>`) are single-document-impossible in JSON Schema, so they stay in `tools/lint-contracts.mjs` / `pace-validate`, not the schema.

The prose and the `*.schema.json` must move **in lockstep** (one diff). `pace-validate`'s `plan-checklist.md` runs a deterministic **shape-check** against the plan schemas (`week`/`index`) before any semantic check, and `pace-planner` carries a hard **Definition of Done** (no Build turn ends until `index.csv` + every near `weeks/*.json` exist and validate, with `pace-validate` actually VALID). Beyond the gate, **every write-point cites its schema and follows the canonical [write checklist](../extensions/_artefact_schema.md#emitting-a-core-artefact--the-write-checklist)** (`_artefact_schema.md`) — the single anti-malformed-file guard each creating/modifying agent runs before emitting (required keys, `schema_version`, enums, absent-not-null, self-validate). This makes the schemas part of the **write path**, not just documentation.

---

## Contribution rule (from V1)

- Contributing a **sport** = adding a JSON conforming to `sports/_schema.md`.
- Contributing a **domain** = adding a pack conforming to `domains/_schema.md`.
- Contributing a **method** = adding a pack conforming to `methods/_schema.md`.
- Contributing an **agent/capability** = implementing the skill format + at least one passing scenario (see `04_evaluation.md`).

Gate: no passing scenario = no merge.

*Last updated: June 2026 (master-concierge + menu model, per ADR `06_architecture_pivot.md`)*
