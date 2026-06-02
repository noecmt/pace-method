# Plan checklist (rubric)

Used by `pace-validate` to check `plan/plan.md`. Several checks are **deterministic**: compare the plan against `periodization-rules.csv`. A plan is **valid** only if every hard check passes.

## Hard checks (must pass — else not valid)

- [ ] **Three horizons present**: far (season blocks) · mid (approximate weeks, intents only) · near (~2 weeks of precise sessions).
- [ ] **Every block's phase exists** as a row in `periodization-rules.csv` (base / build / taper / race / recovery).
- [ ] **Intensity legality**: every near-horizon session uses only `allowed_intensity` for its phase and contains none of the `forbidden` items (deterministic vs CSV). E.g. no Z4/Z5 in base; no exhausting long ride in taper/race (scenarios 01, 04).
- [ ] **Volume coherence**: near-horizon volume reflects the phase `volume_modifier` (e.g. taper ≈ 0.5, race ≈ 0.4).
- [ ] **Mid horizon has no precise sessions** — intents only (no zones/intervals leaking up).
- [ ] **Window discipline**: only the ~2-week near horizon contains precise sessions; beyond it stays at the intent level.
- [ ] **Respects vision constraints**: no session conflicts with a "what doesn't work" / hard constraint from the vision or a `learned_behavior` in the profile (scenario 02).
- [ ] **Derived from a validated vision** (a vision reference / commit is recorded).

## Soft checks (quality)

- [ ] Load and recovery weeks alternate within build.
- [ ] Session types map to the sport pack's `key_sessions`.
- [ ] Change log present for any amendment beyond the window.

## On failure

List each failed hard check, citing the offending session/block and the violated CSV row.

A plan with any failed hard check does not merge (gate: scenario must pass).
