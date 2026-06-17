# Vision checklist (rubric)

Used by `pace-validate` to check `vision/vision.md`. A vision is **valid** only if every hard check passes. Soft checks are quality signals, not blockers.

## Hard checks (must pass — else not valid)

- [ ] **All 7 sections present**: athletic self · main goal · real constraints · what works · what doesn't work · relationship to effort · revision history.
- [ ] **Main goal is concrete**: a what + a by-when (a date or horizon). Not "get fitter".
- [ ] **At least one real constraint** is stated (time / health / equipment / life).
- [ ] **No invented facts**: nothing asserted that the athlete did not provide (anti-hallucination — see scenario 05).
- [ ] **Revision history exists** and has at least the creation row. Vision is amended, never rewritten.
- [ ] **No internal contradiction** with stated constraints (e.g. a goal that violates a declared non-negotiable — see scenario 03).

## Soft checks (quality)

- [ ] Multiple competing goals have an explicit priority / trade-off.
- [ ] "What works" / "what doesn't work" are specific enough to inform planning.
- [ ] Relationship to effort gives a usable RPE/attitude calibration.
- [ ] Plannable quantitative facts are consistent with `athlete/profile.json` (vision = why, profile = data).

## On failure

List each failed hard check and the missing/contradictory element. Do **not** auto-fill gaps — return to the Discovery coach to elicit the missing information.
