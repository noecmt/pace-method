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

---

## Variant B — missing fitness marker (degraded zones)

**Tests:** the same anti-hallucination rule applied to *fitness markers*. A missing marker must degrade the precision of the bounds — it must **never** be filled with an invented number.

### Setup

- Athlete with **no power meter and no recorded FTP**: `profile.json.fitness.ftp_watts` is absent, but `max_hr` is present (e.g. 185). Per `ZONES_SCHEMA`, `athlete/zones.json` then **omits** `power_zones` and carries `hr_zones` as the primary system.
- (Stronger sub-case: neither power nor HR marker present -> `zones.json` carries no numeric zones at all.)

### Input

> "what's my session today and what numbers should I hold?"

### Expected properties

- [ ] The coach gives **HR bounds** (from `hr_zones`) for the session, **not** a fabricated wattage. It explicitly works in the system it actually has.
- [ ] In the stronger sub-case (no marker at all), the coach falls back to **qualitative cues** (RPE, breathing, "conversational") and says so — it does not invent watts or bpm.
- [ ] The coach may *offer a test* to obtain the missing marker (e.g. an FTP test), framed as a proposal, never as an assumed value.

### Anti-properties (must NOT happen)

- [ ] ❌ Invents an FTP / wattage (or a max HR) that is not in `profile.json`.
- [ ] ❌ Cites a `power_zones` bound when `power_zones` is absent from `zones.json`.

### Deterministic check

Every numeric bound the coach states must be present in `athlete/zones.json`. A bound from a
zone system that is **absent** from `zones.json` (e.g. watts when only `hr_zones` exist) => **fail**.

**Gate:** degrades to the coarser available system (or to qualitative cues); zero invented markers.
