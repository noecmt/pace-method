---
name: pace-rolling
user-invocable: false
description: >-
  The Rolling workflow — advances the plan's ~2-week near horizon before it runs dry, calibrating the upcoming window to recent actual load. Invoked BY pace-master or the Planner. Promotes the next mid-horizon row in plan/index.csv to a precise near week, adds plan/weeks/<week>.json, and NEVER overwrites past week files — weeks accumulate as session history. Never rewrites the season, never generates session types absent from the sport pack, never leaves the periodization envelope, and has no voice.
---

# pace-rolling — the rolling-horizon workflow

A **workflow**, not a persona: **no voice, no user-facing output.** Your single responsibility is to keep the plan *alive*: when the precise near window is running out, **advance it** by promoting the next mid-horizon week from `plan/index.csv` into a precise `plan/weeks/<week_id>.json`, and **calibrate** that window to what actually happened recently. The Planner owns the strategy; you extend the rolling window and tune volume to reality, inside the rules. This is **plan-first**: you advance the *plan*, you never react to today's mood (that is the Daily coach / `pace-adjust`).

> **Scope — V1.** Calibration is **log-based** (completed vs. planned, skips, recurring same-day signals). The **measured** calibration on real external load (Strava avg power / time-in-zone / TSS) arrives in V2 — do not anticipate it here.

## Connectors (capability-detected)

Per [`_schema.md`](../../../../extensions/connectors/_schema.md): probe, use if present, **degrade cleanly** if absent — never block, never lose an artefact.

- **Read (Strava, optional).** When a **Strava read connector** is available and Phase 2 is enabled (spike-gated), calibration MAY use **recent actual-load summaries** (avg power / time-in-zone / a TSS-like proxy Strava exposes) in addition to the `log/`, at **summary level**, within the **same** `periodization-rules.csv` envelope. Absent -> log-based (the V1 default). Never per-second, never a session generated. See [`strava.md`](../../../../extensions/connectors/strava.md).
- **Storage (write).** Write the new `plan/weeks/<week_id>.json` and amend `plan/index.csv` at their **logical paths** via the storage backend (`[connectors].storage`, default `local`); amend-not-rewrite and the visible change-log hold across backends. Backend unavailable -> **degrade to `local`**, never drop the plan. See [`storage.md`](../../../../extensions/connectors/storage.md).
- **Calendar (push).** After advancing the window, push the newly materialized sessions from `plan/weeks/<new_week_id>.json` to the calendar — **preserve completed rows**, update the rest. Absent -> regenerate `plan/calendar.csv` from `weeks/*.json`. See [`calendar.md`](../../../../extensions/connectors/calendar.md).

## What you do — and the boundary

- **Advance** the window: promote the next `horizon:mid` row in `index.csv` to `horizon:near` (give it a `file` and `status:planned`), then materialize a precise `plan/weeks/<week_id>.json` from the mid-week's intent (load type + `volume_modifier`). Window discipline is preserved: precise sessions live **only** in `weeks/*.json`.
- **Calibrate** to reality: read the recent `log/` and nudge the upcoming volume **within** the phase `volume_modifier` — ease the ramp after skips or a fatigue trend, proceed normally on good adherence. Never above the phase envelope, never beyond progressive-overload bounds (~10 %/week).
- Anything else — a season rewrite, a new session structure, a volume/intensity outside the phase rules — is **forbidden**.

## Inputs

- `plan/index.csv` — the full-season router; read it to find the `active` near row and the next `mid` row to promote.
- `plan/weeks/<active_week_id>.json` — the current precise window; check how many sessions remain.
- recent `log/` — completed sessions vs. planned, skipped sessions, `pace-adjust`/`pace-agent-analyst` entries: the **actual recent load and adherence**.
- `athlete/profile.json` (test fixture: `athlete/sample.json`) — `current_phase`, hard constraints, `learned_behaviors`, fitness marker. Authoritative for plannable facts.
- `athlete/zones.json` (fixture: `athlete/sample-zones.json`) — the concrete bounds for the sessions you materialize.
- the sport pack `knowledge_base/sports/cycling.json` — `key_sessions` (the only session structures you may schedule).
- the phase rules [`../pace-plan/assets/periodization-rules.csv`](../pace-plan/assets/periodization-rules.csv) and the template [`../pace-plan/assets/plan-template.md`](../pace-plan/assets/plan-template.md).
- The **training principles** (load on demand): `knowledge_base/principles/progressive_overload.md` (load/recovery alternation, ~10 %/week cap), `knowledge_base/principles/periodization.md` (what the current phase is for).
- the validator [`pace-validate`](../../../core-skills/pace-validate/) + its plan-checklist.

> If `pace-master` forwarded `{config, profile, zones, active_week}` as context, use those objects — do **not** re-read the files from disk.

## Procedure

1. **Confirm a roll is warranted.** Read `plan/index.csv` -> find the `status:active` near row -> load `plan/weeks/<active_week_id>.json` -> count remaining `status:planned` sessions. Proceed only if ≤ ~1 week of precise sessions remains, or if `pace-master` handed you a rolling proposal on a signal. If the window is still full, **do nothing** and report — don't churn the plan.

2. **Read the next mid-horizon intent.** Find the next `horizon:mid` row in `index.csv` after the current active near row: read its `block`, `phase`, `load_type`, and `volume_modifier`. This is the source of truth for the new window's intent.

3. **Read recent reality.** From `log/`: completed vs. planned volume, skipped sessions, recurring same-day signals (fatigue, joint pain). Form a neutral read of adherence and load trend.

4. **Materialize the new near-window (deterministic envelope).** Draw sessions from `key_sessions`; each must be phase-legal (only `allowed_intensity`, none `forbidden`). Set volume to the phase `volume_modifier`, **adjusted within bounds** for recent reality. Include the concrete bounds from `zones.json` in each session's `planned` field. Never exceed the envelope.

5. **Honor the profile's memory — hard.** Apply every constraint and `learned_behavior` (`no_back_to_back_hard` ⇒ no two hard days in a row; `left_knee` ⇒ no low-cadence/high-torque; `long_ride_day`, `weekly_hours`).

6. **Advance the artefacts — accumulate, never overwrite.**
   - **Add** `plan/weeks/<new_week_id>.json` (the new precise window). **Never overwrite a past week's file** — week files accumulate and form the session history.
   - **Update `plan/index.csv`**: set the previous `active` near row to `status:done`; promote the next `mid` row: change `horizon` to `near`, add `file: weeks/<new_week_id>.json`, set `status:active`.
   - **Append a change-log row** to `plan/plan.md` (date · change · reason · diff-visible). Leave the far/mid narrative in `plan.md` untouched unless the strategy itself changed — and if so, log that too.

7. **Validate before accepting.** Call `pace-validate` with the plan-checklist (intensity-legality, volume-coherence, index.csv coherence, window discipline, constraints — deterministic against the CSV/profile). **INVALID** -> fix within the envelope or return the failing checks to the Planner. **Do not** auto-fix a forbidden session.

## Prohibitions (do not cross)

- ❌ **Never overwrite a past week's JSON file** — add a new file; the old ones are history.
- ❌ **Never rewrite the season** or silently edit the far/mid narrative in `plan.md` — advance the near window, log every change.
- ❌ **Never leave the `periodization-rules.csv` envelope**, and never raise volume/intensity beyond progressive-overload bounds.
- ❌ **Never compose a session type absent from the sport pack's `key_sessions`.**
- ❌ **Never react to a single day's state** — that is Run (`pace-agent-coach` / `pace-adjust`). You work on the plan window and the recent *trend*.
- ❌ **No voice, no coaching, never write `athlete/profile.json`.** You amend and gate the plan artefacts only.

## Output discipline

You emit **no user-facing text**. The advanced window, the index/week changes, and the change-log row are **internal objects**; the calling persona (the Planner, or `pace-master`) voices any wrap-up in `[surface].language`. Never print the JSON, the diff, or the validator report to the athlete (`docs/02_method.md`, "Single voice, silent pipeline").
