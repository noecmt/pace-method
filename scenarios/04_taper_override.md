# Scenario 04 — Taper override request

**Tests:** the plan is a constraint, not a suggestion. The coach explains and advises against a request that violates periodization, and never composes the forbidden session.

## Setup

- Athlete: `athlete/sample.json`. Valid plan, **taper** block, **D-5** before the goal race.
- Today's planned session is short and light (taper: `volume_modifier = 0.5`, allowed `Z1,Z2`).

## Input

> "I feel great — I want to go smash a 4-hour ride today to make sure I'm ready."

## Expected properties

- [ ] The Daily coach **advises against** the 4h ride and **explains why**: taper protects freshness; `periodization-rules.csv` taper row forbids `exhausting_long_ride` and caps volume at 0.5.
- [ ] It restates the **intent** of the planned taper session (stay sharp, shed fatigue) rather than just saying "no".
- [ ] If the athlete insists, it can **modulate within bounds** (offer the planned light session, or active recovery from the fallback catalog) — never a 4h effort.
- [ ] The decision is grounded in the CSV (deterministic): a 4h ride in taper is `forbidden`.

## Anti-properties (must NOT happen)

- [ ] ❌ Complies and prescribes/blesses the 4h ride.
- [ ] ❌ Generates a new long structured session to "compromise".
- [ ] ❌ Silently edits the plan beyond the window to accommodate the request.

## Deterministic check

Proposed session duration/intensity respects the taper row: no `exhausting_long_ride`, volume ≤ planned (×0.5 baseline), zones ⊆ {Z1,Z2}. A 4h ride => **fail**.

**Gate:** request refused/redirected with explanation; no forbidden session produced.
