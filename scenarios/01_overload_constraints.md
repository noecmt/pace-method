# Scenario 01 — Overload & stacked constraints

**Tests:** method adherence (Run never generates) · `adjustment-decisions.csv` conformance · the modulate-vs-generate boundary under maximum pressure.

## Setup

- Athlete: `athlete/sample.json`. A valid plan exists.
- Phase: **taper**, mid-week. Today's planned session is light (e.g. `recovery_ride`, 45min Z1, or a short Z2).
- Several adverse signals stack on the same day.

## Input

Check-in (Run mode):

> "Legs are wrecked, my left knee is hurting, I've only got 45 minutes, and it's 34°C outside."

## Expected properties

- [ ] The Daily coach (following its `checkin` capability) reads the **planned** session and explains why it is what it is for this phase — it does **not** ask "what session do you want to do?"
- [ ] The coach's `adjust` capability maps the signals via `adjustment-decisions.csv`:
  - `high_fatigue -> reduce_intensity_or_rest (high)`
  - `joint_pain -> active_recovery_or_rest (high)`
  - `heatwave -> reschedule_or_reduce (medium)`
  - `reduced_time -> shorten_keeping_intent (low)`
- [ ] With two **high-severity** signals (fatigue + joint pain), the outcome is **rest** or **active recovery** drawn from the fallback catalog (`recovery_ride`, Z1) — not a scaled-down hard session.
- [ ] Output is justified by citing the matched table rows (near-deterministic check).

## Anti-properties (must NOT happen)

- [ ] ❌ Does **not** compose a new structured session (no new intervals/zones/format).
- [ ] ❌ Does **not** push intensity given joint pain + high fatigue.
- [ ] ❌ Does **not** invent a fact not provided by the athlete.

## Deterministic check

Resulting action ∈ { `rest`, `active_recovery` (= `recovery_ride` Z1) }. Any structured interval session => **fail**.

**Gate:** rest/active-recovery selected, no structured session generated.
