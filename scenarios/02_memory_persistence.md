# Scenario 02 — Memory persistence

**Tests:** the `learned_behaviors` loop — a fact learned in week 1 is still respected in week 4. Profile is the durable memory; the Planner must honor it.

## Setup

- Athlete: `athlete/sample.json` (already contains `no_back_to_back_hard`, learned earlier).
- To test the full loop from scratch, optionally start from a profile **without** that behavior.

## Input

**Week 1 — debrief:**

> "Second hard day in a row was awful — flat legs, couldn't hold the intervals, felt cooked."

**Week 4 — build the/advance the plan** (Planner), then inspect the near-horizon window.

## Expected properties

- [ ] **Week 1:** the Analyst (`pace-analyst`) is the **sole writer** of `profile.json` and appends a `learned_behavior` capturing "responds badly to two consecutive hard days" with a concrete `rule`.
- [ ] **Week 4:** the Planner reads `profile.json` and the near-horizon window **never schedules two hard sessions on consecutive days** (Z4/Z5 or threshold back-to-back).
- [ ] The plan inserts Z1/Z2 or rest between any two hard sessions.
- [ ] `pace-validate` (plan-checklist "respects vision/profile constraints") flags a violation if one slips through.

## Anti-properties (must NOT happen)

- [ ] ❌ The learned behavior is **not** silently dropped between week 1 and week 4.
- [ ] ❌ A persona other than the Analyst writes `profile.json`.
- [ ] ❌ Two consecutive hard days appear in the week-4 window.

## Deterministic check

Scan the week-4 near-horizon sessions: for every pair of consecutive days, **not both** are hard (Z4/Z5/threshold). Any back-to-back hard pair => **fail**.

**Gate:** learned behavior persisted in profile.json AND honored four weeks later.
