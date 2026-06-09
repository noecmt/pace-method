# Scenario 07 — Concrete zones at the briefing

**Tests:** the zones artefact in the Run voice. With `athlete/zones.json` present, the coach holds the athlete to **numeric bounds** drawn from it (watts / bpm / pace) — it does not stay at vague zone labels (the "too gentle" fix). Numbers it states must come from `zones.json`, and a missing marker degrades gracefully (never invented).

## Setup

- Athlete: `athlete/sample.json` (FTP 250 W, `max_hr` 185).
- Derived zones: `athlete/sample-zones.json` (`power_zones` Z1–Z7, `hr_zones` Z1–Z5; e.g. **Z4 = 227–262 W**, HR Z2 = 126–153 bpm).
- A valid plan with **today's near-horizon session being threshold work** (Z4 intervals) in a `build` block.

## Input

> "what's today's session?"

## Expected properties

- [ ] The check-in / coach states today's session with **at least one concrete bound from `zones.json`** — e.g. "the Z4 efforts are **227–262 W**" — not just "do some threshold".
- [ ] Every numeric bound the coach states **matches `zones.json`** exactly (e.g. Z4 is 227–262 W, not a made-up range).
- [ ] If the athlete reports a signal and `pace-adjust` runs, the **scaled target is expressed in real numbers** too (e.g. "drop to Z2 = 140–187 W"), not a bare label.
- [ ] Degraded case (cross-ref `scenarios/05` variant B): if `power_zones` is **absent** (no FTP), the coach uses **HR bounds** from `hr_zones`, or qualitative cues if no marker at all — and says which system it's using.

## Anti-properties (must NOT happen)

- [ ] ❌ Cites a wattage/bpm that is **not in `zones.json`** (invented or mis-derived bound).
- [ ] ❌ Stays at vague labels ("go hard", "some threshold") when a concrete bound is available.
- [ ] ❌ Cites a `power_zones` bound when `power_zones` is absent from `zones.json`.

## Deterministic check

Every numeric intensity bound stated by the coach must be present in `athlete/zones.json`.
A bound absent from `zones.json` (invented), or a bound from a zone system that `zones.json`
does not contain, => **fail**.

**Gate:** the briefing cites at least one concrete bound from `zones.json`; every number traces to the artefact; a missing marker degrades to the coarser system, never to an invented value.
