# extend-sport — author a sport pack in the athlete repo

A **capability of pace-extend**, not a separate skill: a local file you read into the same context. **Following it is not a handoff and not a voice change** — you are still pace-extend. Its single responsibility is to author a **new sport pack** as `<athlete-repo>/knowledge_base/sports/<sport_id>.json`, conforming to the frozen sport-pack schema, and gate it through `pace-validate`. This file production has no voice.

## A sport pack is knowledge only

A sport is **axis 1** of extension: *knowledge*, never a new agent. The agents and capabilities are **identical across sports** — a pack only supplies the discipline's zone systems, key sessions, and periodization options so the existing Planner/Coach/Analyst can work in it. You are adding data, not behaviour.

## Inputs

- The template [`knowledge_base/sports/_template.json`](../../../knowledge_base/sports/_template.json) — copy it; it is strictly schema-conformant.
- The contract `knowledge_base/sports/_schema.md` — the frozen field list you must satisfy.
- The canonical worked example `knowledge_base/sports/cycling.json` — diff against it; do **not** reintroduce divergent names (`metrics.primary`, `zones.model`…).
- `pace-elicitation` (as a tool) and the athlete's own knowledge of their discipline.
- The `pace-validate` tool — to check the result against `_schema.md`.

## Procedure

1. **Fix the `sport_id`** — a lowercase identifier matching the target filename (`trail_running`, `nordic_skiing`). It becomes `<athlete-repo>/knowledge_base/sports/<sport_id>.json`. If it collides with a base pack id (`cycling`, `running`, …), say so: the **local pack will override** the base one (same relative path, local wins) — confirm that is the intent.
2. **Copy `_template.json`** to that local path as the starting point.
3. **Elicit and fill every required field** (via `pace-elicitation`, one or two questions per turn) per `_schema.md`:
   - `primary_metric`, `fitness_marker` (the marker the zones are a % of);
   - `intensity_zones`: `system`, the `zones[]` array (key = `<fitness_marker>_pct`, **ordered by id 1..n and contiguous** over the marker range), plus the transversal `hr_zones` (the 5-zone HR system — **declare it even if the athlete lacks max_hr / lthr_bpm**);
   - `key_sessions` — **at least one active-recovery session** (the modulate fallback catalog draws from here);
   - `periodization` — the periodization options the discipline supports;
   - `references` — the source backing these zones/sessions.
4. **Never invent a number.** If the athlete doesn't know a zone boundary, propose a sourced default or leave the discipline to a coarser system — do not fabricate contiguous percentages to look complete.
5. **Validate.** Call `pace-validate` on the authored pack against `knowledge_base/sports/_schema.md` (a local pack obeys the same contract as a base pack). On INVALID, return the offending field and re-elicit — **never auto-fill**.

   > Linter note: `tools/lint-contracts.mjs` validates **only** `cycling.json` (hardcoded path). It does **not** inspect a new sport pack — so conformance here is the `pace-validate` check against `_schema.md`, by hand, not the linter.
6. **Tell them how to activate it.** A sport pack is activated by **declaring the discipline on the profile**, which is **Discovery's** job, not yours: you do **not** write `athlete/profile.json`. Tell the athlete to add the sport via `/pace-discovery` (so it lands in `profile.sports[]` with its markers); the Planner then resolves the pack via the override stack at plan time.

## Output discipline

Emit **no user-facing text of its own**. The JSON written, the VALID/INVALID outcome, and the activation note are **internal results**; *you*, pace-extend, voice the single result message in `[surface].language`. Never print the JSON or the validator report to the athlete.

## Prohibitions (do not cross)

- ❌ **Never write `athlete/profile.json`** (or any other training artefact). You author the pack only; Discovery declares the sport on the profile.
- ❌ **Never invent zone bounds, markers, or sessions** to fill the pack — elicit or omit.
- ❌ **Never ship a pack without an active-recovery `key_session`** (the modulate fallback needs it).
- ❌ **Never write into the plugin install** — the pack lands in `<athlete-repo>/knowledge_base/sports/`.
- ❌ **Never skip validation or auto-fill** to pass it.
