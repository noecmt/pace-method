---
name: pace-rolling
user-invocable: false
description: >-
  The Rolling workflow — advances the plan's ~2-week near horizon before it runs dry, and calibrates the upcoming window to the athlete's RECENT ACTUAL load and adherence from the log. Invoked BY pace-master (on a rolling proposal — near window nearly exhausted, sessions_skipped, metric_stagnation) or by the Planner, never a user-facing entry point. It materializes the next near-window sessions from the existing mid-horizon intents, stays strictly inside periodization-rules.csv, honors every hard constraint and learned_behavior, and AMENDS plan/plan.md with a visible change-log row. It NEVER rewrites the season, never composes session types absent from the sport pack, never leaves the phase envelope, never reacts to a single day, and has no voice.
---

# pace-rolling — the rolling-horizon workflow

A **workflow**, not a persona: **no voice.** Your single responsibility is to keep `plan/plan.md` *alive*: when the precise near window is running out, **advance it** by materializing the next ~2 weeks from the already-decided mid-horizon, and **calibrate** that window to what actually happened recently. The Planner owns the strategy; you extend the rolling window and tune volume to reality, inside the rules. This is **plan-first**: you advance the *plan*, you never react to today's mood (that is the Daily coach / `pace-adjust`).

> **Scope — V1.** Calibration is **log-based** (completed vs. planned, skips, recurring same-day signals). The **measured** calibration on real external load (Strava avg power / time-in-zone / TSS) arrives in V2 — do not anticipate it here.

## Connectors (capability-detected)

Per [`_schema.md`](../../../../extensions/connectors/_schema.md): probe, use if present, **degrade cleanly** if absent — never block, never lose an artefact.

- **Read (Strava, optional).** When a **Strava read connector** is available and Phase 2 is enabled (spike-gated), calibration MAY use **recent actual-load summaries** (avg power / time-in-zone / a TSS-like proxy Strava exposes) in addition to the `log/`, at **summary level**, within the **same** `periodization-rules.csv` envelope. Absent -> log-based (the V1 default). Never per-second, never a session generated. See [`strava.md`](../../../../extensions/connectors/strava.md).
- **Storage (write).** Amend `plan/plan.md` at its **logical path** via the storage backend (`[connectors].storage`, default `local`); amend-not-rewrite and the visible change-log hold across backends. Backend unavailable -> **degrade to `local`**, never drop the plan. See [`storage.md`](../../../../extensions/connectors/storage.md).
- **Calendar (push).** After advancing the window, refresh the calendar with the newly materialized near-window sessions — **preserve completed rows**, update the rest. Absent -> `plan/calendar.csv`. See [`calendar.md`](../../../../extensions/connectors/calendar.md).

## What you do — and the boundary

- **Advance** the window: turn the mid-horizon's approximate weeks (intent + load type + target `volume_modifier`) into precise near-window sessions (date, type, duration, zones, structure). Window discipline is preserved: precise sessions live **only** in the ~2-week near horizon.
- **Calibrate** to reality: read the recent `log/` and nudge the upcoming volume **within** the phase `volume_modifier` — ease the ramp after skips or a fatigue trend, proceed normally on good adherence. Never above the phase envelope, never beyond progressive-overload bounds (~10 %/week).
- Anything else — a season rewrite, a new session structure, a volume/intensity outside the phase rules — is **forbidden**.

## Inputs

- `plan/plan.md` — the **far/mid horizons are stable**; the **near horizon** is the window you advance. Read the change log to see where the window currently ends.
- recent `log/` — completed sessions vs. planned, skipped sessions, `pace-adjust`/`pace-agent-analyst` entries: the **actual recent load and adherence**.
- `athlete/profile.json` (test fixture: `athlete/sample.json`) — `current_phase`, hard constraints, `learned_behaviors`, fitness marker. Authoritative for plannable facts.
- the sport pack `knowledge_base/sports/cycling.json` — `key_sessions` (the only session structures you may schedule).
- the phase rules [`../pace-plan/assets/periodization-rules.csv`](../pace-plan/assets/periodization-rules.csv) and the template [`../pace-plan/assets/plan-template.md`](../pace-plan/assets/plan-template.md).
- The **training principles** (load on demand): `knowledge_base/principles/progressive_overload.md` (load/recovery alternation, ~10 %/week cap), `knowledge_base/principles/periodization.md` (what the current phase is for). The CSV stays the deterministic guardrail; the principle is the *why*.
- the validator [`pace-validate`](../../../core-skills/pace-validate/) + its plan-checklist.

## Procedure

1. **Confirm a roll is warranted.** Proceed only if the near window is near-empty (≈ ≤1 week of precise sessions left) or `pace-master` handed you a rolling proposal on a signal. If the window is still full, **do nothing** and report — don't churn the plan.
2. **Read the mid-horizon intent** for the week(s) to materialize: per-week intent, load vs. recovery week, target `volume_modifier`.
3. **Read recent reality.** From `log/`: completed vs. planned volume, skipped sessions, recurring same-day signals (fatigue, joint pain). Form a neutral read of adherence and load trend.
4. **Materialize the next near-window (deterministic envelope).** Draw sessions from `key_sessions`; each must be phase-legal (only `allowed_intensity`, none `forbidden`). Set volume to the phase `volume_modifier`, **adjusted within bounds** for recent reality (after skips / a fatigue trend, ease the ramp; on good adherence, progress ≤ ~10 %/week). Never exceed the envelope.
5. **Honor the profile's memory — hard.** Apply every constraint and `learned_behavior` (`no_back_to_back_hard` ⇒ no two hard days in a row; `left_knee` ⇒ no low-cadence/high-torque; `long_ride_day`, `weekly_hours`).
6. **Amend, never rewrite.** Extend the near window and **append a change-log row** (date · change · reason · diff-visible). Leave the far/mid horizons untouched unless the strategy itself changed — and if so, log that too. The git diff must be inspectable.
7. **Validate before accepting.** Call `pace-validate` with the plan-checklist (intensity-legality, volume-coherence, window discipline, constraints — deterministic against the CSV/profile). **INVALID** -> fix within the envelope or return the failing checks to the Planner. **Do not** auto-fix a forbidden session.

## Prohibitions (do not cross)

- ❌ **Never rewrite the season** or silently edit the far/mid horizons — advance the near window, log every change.
- ❌ **Never leave the `periodization-rules.csv` envelope**, and never raise volume/intensity beyond progressive-overload bounds.
- ❌ **Never compose a session type absent from the sport pack's `key_sessions`.**
- ❌ **Never react to a single day's state** — that is Run (`pace-agent-coach` / `pace-adjust`). You work on the plan window and the recent *trend*.
- ❌ **No voice, no coaching, never write `athlete/profile.json`.** You amend and gate the plan only.
