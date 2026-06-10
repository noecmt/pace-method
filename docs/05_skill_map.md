# 05 — Skill Map (inventory to build)

Concrete skill-by-skill inventory. For each skill: its type, what it reads / writes, its structured files, and the version where it appears. This is the reference document for implementation.

**Types**: `master` (orchestrator) · `persona` (a who, with its voice) · `workflow` (a what on an artefact) · `core` (reusable).

**Anatomy of a skill**: `SKILL.md` (frontmatter `name` + a pushy `description`, then instructions) + as needed `references/` · `assets/` · `customize.toml` · `*.csv`.

---

## Target tree

```
src/
├── pace-master/
│   ├── SKILL.md
│   ├── references/routing.md
│   └── signals.csv                 <- routing on strong signal (read from Run/master)
├── core-skills/
│   ├── pace-elicitation/
│   │   ├── SKILL.md
│   │   └── methods.csv
│   ├── pace-validate/              <- sole owner of the checklists
│   │   ├── SKILL.md
│   │   └── assets/{vision-checklist.md, plan-checklist.md}
│   └── pace-customize/
│       ├── SKILL.md
│       ├── customize.toml
│       └── pace.config.template.toml   <- athlete instance config (connectors + integration IDs)
└── coaching-skills/
    ├── 1-discovery/
    │   ├── pace-agent-discovery/{SKILL.md, customize.toml}
    │   └── pace-vision/{SKILL.md, assets/vision-template.md}   <- validation via pace-validate
    ├── 2-build/
    │   ├── pace-agent-planner/{SKILL.md, customize.toml}
    │   ├── pace-plan/{SKILL.md, assets/plan-template.md, assets/periodization-rules.csv}
    │   └── pace-rolling/{SKILL.md}
    └── 3-run/
        ├── pace-agent-coach/{SKILL.md, customize.toml}
        ├── pace-checkin/{SKILL.md}
        ├── pace-adjust/{SKILL.md, assets/adjustment-decisions.csv}
        └── pace-debrief/{SKILL.md}   <- writes log + learned_behaviors (profile.json)

knowledge_base/
├── principles/*.md
└── sports/{cycling.json, _schema.md}

extensions/
├── connectors/                    <- capability layer (read / storage / calendar); not a 4th axis
│   ├── _schema.md
│   ├── read.md, strava.md
│   ├── storage.md, storage-{github,notion,gdrive}.md
│   └── calendar.md, calendar-{local,gcal,notion}.md
├── domains/_schema.md
└── methods/_schema.md
```

---

## Skill detail

| Skill | Type | Reads | Writes | Structured files | Version |
|---|---|---|---|---|---|
| `pace-master` | master | state (vision/plan), message, signals | (routes) | `references/routing.md`, `signals.csv` | V0 |
| `pace-elicitation` | core | — | — | `methods.csv` | V0 |
| `pace-validate` | core | target artefact | validation report | `vision-checklist.md`, `plan-checklist.md` | V0 |
| `pace-customize` | core | — | overrides | `customize.toml` | V1 |
| `pace-agent-discovery` | persona | profile, answers | (via pace-vision) | `customize.toml` | V0 |
| `pace-vision` | workflow | profile, answers | `vision/vision.md` | `vision-template.md` | V0 |
| `pace-agent-planner` | persona | vision, profile, KB | (via pace-plan-write) | `customize.toml` | V0 |
| `pace-plan-write` | workflow | vision, profile, KB | `plan/plan.md` | `plan-template.md`, `periodization-rules.csv` | V0 |
| `pace-rolling` | workflow | plan, recent log | `plan/plan.md` (amended) | — | V1 |
| `pace-agent-coach` | persona | plan, session, state | (via checkin/adjust) | `customize.toml` | V0 |
| `pace-checkin` | workflow | plan, session, state | short-term log | — | V0 |
| `pace-adjust` | workflow | session, signals | modulated session | `adjustment-decisions.csv` | V0 |
| `pace-agent-analyst` | workflow | log, plan | log, signals, `profile.json` (learned_behaviors) | — | V0 (minimal) |

> **Minimal V0 scope** (plan-first validation): `pace-master`, `pace-elicitation`, `pace-validate`, `pace-agent-discovery` + `pace-vision`, `pace-agent-planner` + `pace-plan-write`, `pace-agent-coach` + `pace-checkin` + `pace-adjust`, and `pace-agent-analyst` **in a minimal declarative version** (just appending a `learned_behavior` to `profile.json` — needed for scenario 02). The rest (`pace-rolling`, `pace-customize`, and the measured/Strava debrief) comes later.

> **Skill `name:` vs. folder.** Two skills carry a `name:` that deliberately differs from their directory, so that no skill shares a name with a slash command (a command and a skill with the same name make `pace-master`'s routing loop): the folder `…/2-build/pace-plan/` defines the skill **`pace-plan-write`**, and `…/3-run/pace-debrief/` defines **`pace-agent-analyst`** (the Analyst). The `/pace-plan` and `/pace-debrief` commands reach them through `pace-master`. The other personas already avoid the clash by construction (`/pace-discovery` -> `pace-agent-discovery`, `/pace-today` -> `pace-agent-coach`).

> **Connector layer** (`extensions/connectors/`, V1): a capability attached to the artefacts — `read` (Strava), `storage` (local / GitHub / Notion / Drive), `calendar` (`plan/calendar.csv` / Google / Notion). Consumed *inside* the workflows (read: `pace-checkin` / `pace-agent-analyst` / `pace-rolling`; storage: every persisting workflow + `pace-master` session setup; calendar: `pace-plan-write` / `pace-rolling` / `pace-adjust`), configured in `pace-customize`, and **degrading gracefully to local** so no data is ever lost. Never a 4th extension axis, never a persona, never called from `pace-master` to decide.

---

## Contracts of the structured files

### `periodization-rules.csv`

Must cover **all** the phases the plan uses (blocks `Base, Build, Taper, Race` + recovery/transition weeks). Values below = reasonable defaults, **to be validated in Sprint 6 (expert)**.

```
phase,allowed_intensity,forbidden,volume_modifier
base,"Z1,Z2,Z3,sweet_spot","Z4,Z5",1.0
build,"Z1,Z2,Z3,Z4,Z5",none,1.0
taper,"Z1,Z2","exhausting_long_ride",0.5
race,"Z1,Z2","structured_intervals,exhausting_long_ride",0.4
recovery,"Z1,Z2","Z4,Z5,exhausting_long_ride",0.6
```

### `adjustment-decisions.csv`

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

### `signals.csv`

Lives under `pace-master/` (not `pace-agent-analyst`): it's the routing that proposes a re-Discovery/rolling on a strong signal, from V0 (scenario 06). The Analyst *emits* signals into the log; `pace-master` *maps* them to a proposal via this table.

```
signal,threshold,proposal
goal_reached_or_cancelled,immediate,partial_discovery
sessions_skipped,3_weeks,partial_discovery_or_rolling
metric_stagnation,4_weeks,rolling_or_discovery
life_change,declared,discovery
```

### `methods.csv` (elicitation)

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

---

## Contribution rule (from V1)

- Contributing a **sport** = adding a JSON conforming to `sports/_schema.md`.
- Contributing a **domain** = adding a pack conforming to `domains/_schema.md`.
- Contributing a **method** = adding a pack conforming to `methods/_schema.md`.
- Contributing a **persona/workflow** = implementing the skill format + at least one passing scenario (see `04_evaluation.md`).

Gate: no passing scenario = no merge.

*Last updated: May 2026*
