---
name: pace-validate
user-invocable: false
description: >-
  Validation gate for PACE narrative artefacts. Called AS A TOOL by another PACE skill (the
  Discovery coach's vision-write, the Planner's plan-write/rolling) — not a user-facing entry
  point — to check a `vision/vision.md` or `plan/plan.md` against its checklist before the
  artefact is accepted. Runs the hard checks (some deterministic against
  `periodization-rules.csv` for plans), reports each pass/fail with the offending element, and
  on failure returns control to the calling agent WITHOUT auto-filling the gaps. It has no
  voice and writes no artefact.
---

# pace-validate — the artefact gate

A **shared tool**, not an agent: **no voice, no user-facing output, writes nothing.** It is the **sole owner of the checklists** and the place where "is this artefact valid?" is answered the same way every time — one of the two legitimately separate skills in PACE (heavy + reused). An agent **calls it as a tool** while staying active; it returns a report; the calling agent acts on it.

## Inputs

- The **target artefact**: `vision/vision.md` **or** `plan/plan.md`.
- The matching **checklist** from `assets/`:
  - vision -> [`assets/vision-checklist.md`](assets/vision-checklist.md)
  - plan -> [`assets/plan-checklist.md`](assets/plan-checklist.md)
- For a **plan**, also the periodization table (deterministic checks):
  `../pace-planner/assets/periodization-rules.csv`.
- For cross-checks: `athlete/profile.json` (a plannable fact / `learned_behavior` may make an artefact invalid — e.g. scenario 02) and `athlete/zones.json` (the derived zones must exist and stay coherent with the profile's markers).
- `pace.config.toml` `[custom_metrics]` — the **declaration** that gates the optional `custom` field: which keys may appear on a session's `planned`/`actual`/`debrief`, on which positions, and their scalar type.
- Any **sport / method pack** a plan consumes — resolved via the **override stack** (`<athlete-repo>/knowledge_base/{sports,methods}/<id>` **first**, then the plugin install; same relative path, local wins). A **local** pack is validated against **the same** `_schema.md` as a base pack (`knowledge_base/sports/_schema.md`, `extensions/methods/_schema.md`).

## Procedure

1. Load the checklist for the artefact type.
2. Run every **hard check** in order. For a plan, the intensity-legality and volume-coherence checks are **deterministic**: compare each near-horizon session's zones against the `allowed_intensity` / `forbidden` of its phase row in  `periodization-rules.csv`, and its volume against `volume_modifier`. The **zones-coherence** check is also deterministic and **per discipline**: `athlete/zones.json` must exist and, for every declared discipline in `profile.sports`, its `by_discipline.<d>.fitness_markers` must equal the current `athlete/profile.json.fitness.<d>` markers (stale or missing zones => INVALID).
3. Run the **soft checks** as quality signals (not blockers). Among them, the **conditional `custom` check**: for any `custom` key found on a session's `planned`/`actual`/`debrief`, verify it is **declared** in `pace.config.toml [custom_metrics]` (declared position, scalar type, `snake_case`). An undeclared, mistyped, or non-scalar `custom` key is a **⚠ soft** finding (the field is purely additive and optional — downstream readers ignore an undeclared key — so it never gates a VALID plan); no `[custom_metrics]` declaration ⇒ any `custom` key is flagged. Nutrition/recovery keys on `custom` are themselves a finding (a domain owns its own artefact, never rides on `custom`).
4. Emit a **validation report** (below).

## Validation report

```
ARTEFACT: <path>   TYPE: vision|plan   RESULT: VALID | INVALID
Hard checks:
  ✓/✗ <check name> — <offending element + violated CSV row, if ✗>
Soft checks (quality):
  ⚠ <note>
```

- **VALID** only if **every hard check passes**. Any failed hard check => **INVALID**.
- Each failure must **cite the offending element** (the section, the session/block) and, for deterministic plan checks, the **violated CSV row** (e.g. "Z4 interval in a `base` block — `base` forbids `Z4,Z5`").

## Rules

- **On failure, do NOT auto-fill.** Never invent the missing section, never silently fix a forbidden session. Return the report to the owning persona (Discovery coach for a vision, Planner for a plan) to elicit/correct the gap.
- **Deterministic where possible.** Anything checkable against a CSV is checked against the CSV, not by feel — these are the anti-drift guardrails.
- **Gate semantics.** A hard-check failure means the artefact does not pass; downstream, a scenario that depends on it cannot pass either (no passing scenario = no merge).
- **No voice, no artefact.** You report; you never rewrite the vision or the plan yourself.
- **Override stack.** A pack resolves local-first (athlete repo) then base (plugin install); on an `id` collision the **local pack wins**. Both sides are held to the **same contract** — validate a local pack exactly as a base pack against its `_schema.md`.

## Output discipline

The **validation report is internal** — returned to the calling agent (the Discovery coach's vision-write, the Planner's plan-write/rolling), **never** rendered to the athlete. Never emit the `ARTEFACT / RESULT / Hard checks` block as the turn's user-facing output; the calling agent translates a pass/fail into its own words (`docs/02_method.md`, "Single voice").
