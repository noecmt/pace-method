# Plan checklist (rubric)

Used by `pace-validate` to check the plan artefacts. Several checks are **deterministic**: compare against `periodization-rules.csv`, `plan/index.csv`, and `plan/weeks/*.json`. A plan is **valid** only if every hard check passes.

**Shape is contract-checked.** Every `plan/weeks/*.json` must conform to [`extensions/week.schema.json`](../../../extensions/week.schema.json) and `plan/index.csv` to [`extensions/index.schema.json`](../../../extensions/index.schema.json) (column names, order, and enums). Validate the shape against those schemas **first** — a file that fails its schema is **not valid**, before any semantic check below runs.

## Hard checks (must pass — else not valid)

- [ ] **Three horizons in `plan/index.csv`**: at least one `horizon:far` row, at least one `horizon:mid` row, and at least one `horizon:near` row covering the current season.
- [ ] **Exactly one active near week**: exactly one `near` row in `plan/index.csv` has `status = active`.
- [ ] **Active week file exists**: `plan/weeks/<active_week_id>.json` exists and is valid JSON.
- [ ] **Near rows have files**: every `near` row in `index.csv` with a non-null `file` has a matching file in `plan/weeks/` (no broken references).
- [ ] **Every block's phase exists** as a row in `periodization-rules.csv` (base / build / taper / race / recovery).
- [ ] **Intensity legality**: every session in `weeks/*.json` uses only `allowed_intensity` for its phase and contains none of the `forbidden` items (deterministic vs CSV). E.g. no Z4/Z5 in base; no exhausting long ride in taper/race (scenarios 01, 04).
- [ ] **Volume coherence**: session volume in `weeks/*.json` reflects the week's `volume_modifier` (e.g. taper ≈ 0.5, race ≈ 0.4).
- [ ] **Mid horizon has no precise sessions** — `mid` rows in `index.csv` carry no `file`; only `near` rows have a `weeks/` file.
- [ ] **Respects vision constraints**: no session conflicts with a "what doesn't work" / hard constraint from the vision or a `learned_behavior` in the profile (scenario 02).
- [ ] **Derived from a validated vision** (a vision reference / commit is recorded in `plan/plan.md`).
- [ ] **Zones coherence (deterministic, per discipline)**: `athlete/zones.json` **exists** and is **not stale** — for **every declared discipline** in `profile.sports`, `zones.by_discipline.<d>.fitness_markers` equals the current `profile.json.fitness.<d>` markers. A missing `zones.json`, a missing `by_discipline` entry for a declared discipline that has markers, or any divergence (a marker changed in the profile but not regenerated in the zones), => **not valid**. (A marker absent from a discipline's profile block must be absent from that discipline's zones too — omitted, not invented.)
- [ ] **Session discipline resolves (deterministic)**: every session's `sport` in `weeks/*.json` is a discipline declared in `profile.sports`, and its `planned.target.range` is drawn from that discipline's zones block (`zones.by_discipline.<sport>`), with `target.metric` matching the sport pack's `primary_metric` family (`power`/`hr`/`pace`).
- [ ] **Schema version present**: each `weeks/*.json`, `profile.json`, and `zones.json` carries `schema_version` (frozen contract: `extensions/_artefact_schema.md`).
- [ ] **Shape conforms (deterministic)**: every `weeks/*.json` validates against `extensions/week.schema.json` and `index.csv` against `extensions/index.schema.json` — required fields present, no unknown fields, enums (`phase`/`load_type`/`status`/`metric`/`horizon`) and id/date patterns respected. A schema-invalid file => **not valid**.

## Soft checks (quality)

- [ ] Load and recovery weeks alternate within build (check `load_type` column in `index.csv`).
- [ ] Session types in `weeks/*.json` map to the sport pack's `key_sessions`.
- [ ] Change log present in `plan/plan.md` for any amendment beyond the window.

## On failure

List each failed hard check, citing the offending session/week and the violated CSV row or file.

A plan with any failed hard check does not merge (gate: scenario must pass).
