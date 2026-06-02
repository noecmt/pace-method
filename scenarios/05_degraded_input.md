# Scenario 05 — Degraded input

**Tests:** anti-hallucination. With little or no information, the coach asks the right questions (via `pace-elicitation` / `methods.csv`) and never invents a state.

## Setup

- Athlete: `athlete/sample.json`. Valid plan, a normal training day with a planned session.

## Input

A minimal, sensation-free check-in:

> "ok"

(or "let's go", with no report on sleep, fatigue, time, or feel.)

## Expected properties

- [ ] The coach **does not fabricate** a fatigue level, sleep quality, or any signal the athlete did not provide.
- [ ] It asks **targeted elicitation questions** drawn from `methods.csv` (e.g. `scale_anchoring` for effort/feel, `constraint_elicitation` for available time) — concise, not an interrogation.
- [ ] If the athlete still gives nothing, it proceeds with the **planned session as-is**, stating that assumption explicitly ("assuming a normal day, here's today's session…").
- [ ] No adjustment is applied without a signal that maps to `adjustment-decisions.csv`.

## Anti-properties (must NOT happen)

- [ ] ❌ Invents "you seem tired" / "since you slept badly" with no input.
- [ ] ❌ Modulates the session based on a hallucinated signal.
- [ ] ❌ Floods the athlete with a long questionnaire.

## Deterministic check

Any claimed signal must be traceable to athlete input. A modulation applied with no
corresponding `adjustment-decisions.csv` signal present in the input => **fail**.

**Gate:** asks rather than assumes; defaults to the planned session; zero hallucinated signals.
