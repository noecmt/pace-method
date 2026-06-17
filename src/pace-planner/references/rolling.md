# rolling — the rolling-horizon capability

A **capability of the Planner** (`pace-planner`), not a separate skill: a local file the Planner reads into the same context. **Following it is not a handoff and not a voice change** — you are still the Planner. Its single responsibility is to keep the plan *alive*: when the precise near window is running out, **advance it** by promoting the next mid-horizon week from `plan/index.csv` into a precise `plan/weeks/<week_id>.json`, and **calibrate** that window to what actually happened recently. You extend the rolling window and tune volume to reality, inside the rules. This is **plan-first**: you advance the *plan*, you never react to today's mood (that is the Daily coach).

> **Scope — V1.** Calibration is **log-based** (completed vs. planned, skips, recurring same-day signals). The **measured** calibration on real external load (Strava avg power / time-in-zone / TSS) arrives in V2 — do not anticipate it here.

## Connectors (capability-detected)

Per [`_schema.md`](../../../extensions/connectors/_schema.md): probe, use if present, **degrade cleanly** if absent — never block, never lose an artefact.

- **Read (Strava, optional).** When a **Strava read connector** is available and Phase 2 is enabled (spike-gated), calibration MAY use **recent actual-load summaries** (avg power / time-in-zone / a TSS-like proxy Strava exposes) in addition to the session history, at **summary level**, within the **same** `periodization-rules.csv` envelope. Absent -> log-based (the V1 default). Never per-second, never a session generated. See [`strava.md`](../../../extensions/connectors/strava.md).
- **Storage (write).** Write the new `plan/weeks/<week_id>.json` and amend `plan/index.csv` at their **logical paths** via the storage backend (`[connectors].storage`, default `local`); amend-not-rewrite and the visible change-log hold across backends. Backend unavailable -> **degrade to `local`**, never drop the plan. See [`storage.md`](../../../extensions/connectors/storage.md).
- **Calendar (push).** After advancing the window, push the newly materialized sessions from `plan/weeks/<new_week_id>.json` to the calendar — **preserve completed rows**, update the rest. Absent -> regenerate `plan/calendar.csv` from `weeks/*.json`. See [`calendar.md`](../../../extensions/connectors/calendar.md).

## What you do — and the boundary

- **Advance** the window: promote the next `horizon:mid` row in `index.csv` to `horizon:near` (give it a `file` and `status:planned`), then materialize a precise `plan/weeks/<week_id>.json` from the mid-week's intent (load type + `volume_modifier`). Window discipline is preserved: precise sessions live **only** in `weeks/*.json`.
- **Calibrate** to reality: read the recent `plan/weeks/*.json` sessions (each one's `status` / `actual` / `debrief` / `adjustment`) and nudge the upcoming volume **within** the phase `volume_modifier` — ease the ramp after skips or a fatigue trend, proceed normally on good adherence. Never above the phase envelope, never beyond progressive-overload bounds (~10 %/week).
- Anything else — a season rewrite, a new session structure, a volume/intensity outside the phase rules — is **forbidden**.

## Inputs

- `plan/index.csv` — the full-season router; read it to find the `active` near row and the next `mid` row to promote.
- `plan/weeks/<active_week_id>.json` — the current precise window; check how many sessions remain.
- recent `plan/weeks/*.json` sessions — each session's `status`, `actual`, `debrief`, and `adjustment` carry the **actual recent load and adherence** (they live on the session object now, not in `log/`), plus `log/signals.md` for any strong signal already emitted.
- `athlete/profile.json` (forwarded; test fixture `athlete/sample.json`) — `current_phase`, hard constraints, `learned_behaviors`, fitness marker. Authoritative for plannable facts.
- `athlete/zones.json` (fixture: `athlete/sample-zones.json`) — the concrete bounds for the sessions you materialize.
- the sport pack `knowledge_base/sports/cycling.json` — `key_sessions` (the only session structures you may schedule).
- the phase rules [`../assets/periodization-rules.csv`](../assets/periodization-rules.csv) and the template [`../assets/plan-template.md`](../assets/plan-template.md).
- The **training principles** (load on demand): `knowledge_base/principles/progressive_overload.md` (load/recovery alternation, ~10 %/week cap), `knowledge_base/principles/periodization.md` (what the current phase is for).
- the validator tool [`pace-validate`](../../pace-validate/) + its plan-checklist.

> If the master forwarded `{config, profile, zones, active_week}` as context, use those objects — do **not** re-read the files from disk.

## Procedure

1. **Confirm a roll is warranted.** Read `plan/index.csv` -> find the `status:active` near row -> load `plan/weeks/<active_week_id>.json` -> count remaining `status:planned` sessions. Proceed only if ≤ ~1 week of precise sessions remains, or if the master handed you a rolling proposal on a signal. If the window is still full, **do nothing** and report — don't churn the plan.

2. **Read the next mid-horizon intent.** Find the next `horizon:mid` row in `index.csv` after the current active near row: read its `block`, `phase`, `load_type`, and `volume_modifier`. This is the source of truth for the new window's intent.

3. **Read recent reality.** From the recent `plan/weeks/*.json` sessions: completed vs. planned volume (`status` / `actual`), skipped sessions, recurring `adjustment` signals; and `log/signals.md` for any emitted strong signal. Form a neutral read of adherence and load trend.

4. **Materialize the new near-window (deterministic envelope).** Draw sessions from `key_sessions`; each must be phase-legal (only `allowed_intensity`, none `forbidden`). Set volume to the phase `volume_modifier`, **adjusted within bounds** for recent reality. The new week file carries `schema_version:"1.0"`; each session carries `id` (`<date>-<slot>`), `date`, `slot`, `sport` (discipline), `type`, `planned` (with `target` = the concrete bounds read from `zones.json` `by_discipline.<sport>`, metric-tagged) + `status:"planned"` + `actual:null`. A day may hold several sessions (two-a-day / brick): one object per session, same `date`, distinct `slot`. Never exceed the envelope. Run-mode fields (`rationale` / `adjustment` / `actual` / `debrief`) fill **in-place** later (schema + example: [`../assets/week-example.json`](../assets/week-example.json)).

5. **Honor the profile's memory — hard.** Apply every constraint and `learned_behavior` (`no_back_to_back_hard` ⇒ no two hard days in a row; `left_knee` ⇒ no low-cadence/high-torque; `long_ride_day`, `weekly_hours`).

6. **Advance the artefacts — accumulate, never overwrite.**
   - **Add** `plan/weeks/<new_week_id>.json` (the new precise window). **Never overwrite a past week's file** — week files accumulate and form the session history.
   - **Update `plan/index.csv`**: set the previous `active` near row to `status:done`; promote the next `mid` row: change `horizon` to `near`, add `file: weeks/<new_week_id>.json`, set `status:active`.
   - **Append a change-log row** to `plan/plan.md` (date · change · reason · diff-visible). Leave the far/mid narrative in `plan.md` untouched unless the strategy itself changed — and if so, log that too.

7. **Validate before accepting.** Call the `pace-validate` tool with the plan-checklist (intensity-legality, volume-coherence, index.csv coherence, window discipline, constraints — deterministic against the CSV/profile). **INVALID** -> fix within the envelope or surface the failing checks. **Do not** auto-fix a forbidden session.

## Prohibitions (do not cross)

- ❌ **Never overwrite a past week's JSON file** — add a new file; the old ones are history.
- ❌ **Never rewrite the season** or silently edit the far/mid narrative in `plan.md` — advance the near window, log every change.
- ❌ **Never leave the `periodization-rules.csv` envelope**, and never raise volume/intensity beyond progressive-overload bounds.
- ❌ **Never compose a session type absent from the sport pack's `key_sessions`.**
- ❌ **Never react to a single day's state** — that is Run (`pace-coach`). You work on the plan window and the recent *trend*.
- ❌ **Never write `athlete/profile.json`.** You amend and gate the plan artefacts only.
- ❌ **Never write a past week's `summary` block.** The week-level `summary` is the Analyst's derived artefact; rolling reads a week's `status`/`actual` to calibrate, but never authors or edits its `summary`.

## Output discipline

This capability emits **no user-facing text of its own**. The advanced window, the index/week changes, and the change-log row are **internal results**; *you*, the Planner, voice any wrap-up in `[surface].language`. Never print the JSON, the diff, or the validator report to the athlete (`docs/02_method.md`, "Single voice").
