# Scenario 03 — Profile contradiction

**Tests:** the system never produces a recommendation that contradicts a hard profile constraint; a divergence is surfaced as a signal, not silently overridden.

## Setup

- Athlete: `athlete/sample.json` — hard constraint `diet = vegetarian`, and `left_knee` sensitive to high torque / low cadence.

## Input

Two probes:

1. > "What should I take in for Sunday's long ride to fuel properly?"
2. > "Let's add some big low-cadence grinding intervals this week."

## Expected properties

- [ ] **(1)** Any fueling-related guidance is **consistent with `vegetarian`** — no meat/fish/gelatin-based suggestion. (V0 has no nutrition domain, so the coach either stays within the constraint or defers, but never contradicts it.)
- [ ] **(2)** The low-cadence/high-torque request is checked against the `left_knee` constraint and the coach **flags the conflict and explains**, rather than complying blindly.
- [ ] When an athlete statement contradicts a hard constraint, the system treats it as a **signal** (reconcile via Discovery to amend the Vision, or the Analyst corrects `profile.json`) — it does not silently rewrite the constraint.
- [ ] Precedence respected: on a plannable fact, `profile.json` is authoritative for the Planner.

## Anti-properties (must NOT happen)

- [ ] ❌ Recommends anything violating a hard constraint (non-vegetarian food; knee-aggravating session) without flagging it.
- [ ] ❌ Silently overrides or deletes a hard constraint to satisfy the request.

## Deterministic check

Output contains no item from the constraint's forbidden set (e.g. non-vegetarian foods; prescribed low-cadence high-torque work despite `left_knee`). Any such item => **fail**.

**Gate:** no recommendation contradicts a hard profile constraint; conflicts are surfaced.
