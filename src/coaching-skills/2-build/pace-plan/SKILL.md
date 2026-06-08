---
name: pace-plan
description: >-
  The Plan workflow — writes and amends plan/plan.md, the hierarchical rolling-horizon training
  plan of the PACE method. Invoked BY the Planner (pace-agent-planner), not a user-facing entry
  point. It fills the 3-horizon plan template from the Planner's strategy, makes every
  near-horizon session conform to periodization-rules.csv (allowed/forbidden intensity, volume),
  enforces window discipline (precise sessions only in the ~2-week near horizon), and validates
  against the plan-checklist via pace-validate before the plan is accepted. It has no voice.
---

# pace-plan — the Plan workflow

A **workflow**, not a persona: **no voice.** Your single responsibility is the artefact `plan/plan.md`. The Planner decides the strategy; you render it into the template, enforce thedeterministic rules, and gate it through validation. You never invent training structure that the Planner did not specify, and you never talk to the athlete.

## Inputs

- The **Planner's strategy** (far blocks, mid-week intents, near-window sessions).
- The template [`assets/plan-template.md`](assets/plan-template.md) — far / mid / near horizons.
- The phase rules [`assets/periodization-rules.csv`](assets/periodization-rules.csv) — `phase,allowed_intensity,forbidden,volume_modifier`.
- The sport pack `knowledge_base/sports/cycling.json` — `key_sessions` (legal session types).
- The validator [`pace-validate`](../../../core-skills/pace-validate/) + its plan-checklist.
- `athlete/profile.json` (test fixture: `athlete/sample.json`) — for the constraint cross-check.

## Connectors (capability-detected)

Persist and deliver through the connector layer — [`_schema.md`](../../../../extensions/connectors/_schema.md) protocol: probe, use if present, **degrade cleanly** if absent (never block, never lose an artefact):

- **Storage (write).** Write/amend `plan/plan.md` at its **logical path**; the backend (`pace-customize` `[connectors].storage`, default `local`) maps it to a file / GitHub commit / Notion page. The **window-discipline**, **amend-not-rewrite**, and **visible change-log** contracts hold identically across backends. Backend unavailable -> **degrade to `local`** and say so; never silently drop the plan. See [`storage.md`](../../../../extensions/connectors/storage.md).
- **Calendar (push).** On accept (and on each amend), mirror the **near-window** sessions to the calendar connector — `pace-plan` is the **initial push**. The calendar is a one-way **view** of the plan (it reflects the plan, never shapes it). Connector absent -> write `plan/calendar.csv`. See [`calendar.md`](../../../../extensions/connectors/calendar.md).

## Procedure

1. **Fill the 3-horizon template.** Far = season blocks (phase + approx dates + intent, no sessions). Mid = approximate weeks (intent + load type + `volume_modifier`, **no precise sessions**). Near = the ~2-week window of precise sessions (date, type, duration, zones, structure). Record `Sport`, `fitness marker`, and the **source vision reference/commit**.
2. **Make every near-horizon session phase-legal (deterministic).** For each session, check its zones against its block's row in `periodization-rules.csv`: only `allowed_intensity`, none of `forbidden`. Set near-window volume to reflect the phase `volume_modifier` (e.g. taper ≈ 0.5, race ≈ 0.4). Draw session types from the sport pack's `key_sessions`.
3. **Enforce window discipline.** Precise sessions exist **only** in the near horizon. Nothing beyond the ~2-week window may carry zones/intervals. Any change beyond the window must be an explicit, logged entry in the plan's change log (a visible git diff) — never a silent edit.
4. **Cross-check the profile constraints.** No session may violate a hard constraint or a `learned_behavior` (no two consecutive hard days for `no_back_to_back_hard`; no low-cadence high-torque work for `left_knee`; long ride on Sundays only; within `weekly_hours`).
5. **Validate before accepting.** Call `pace-validate` with the plan-checklist (the intensity, volume, window, and constraint checks are run deterministically against the CSV/profile).
6. **Act on the report.** **VALID** -> the plan is accepted and ready for Run. **INVALID** -> return the failing hard checks (citing the offending session/block and the violated CSV row) to the Planner. **Do not auto-fix** a forbidden session.

## Amending an existing plan

If `plan/plan.md` exists, **advance the window**, don't regenerate the season: edit the near horizon, append a change-log row (date · change · diff-visible · reason), and leave the stable far/mid horizons untouched unless the strategy explicitly changed them (then log that too). After amending, **refresh the calendar view** for the changed window (preserve completed rows) via the calendar connector.

## Prohibitions (do not cross)

- ❌ **Never write a session that violates `periodization-rules.csv`** (wrong/forbidden intensity for the phase, or volume off the phase modifier).
- ❌ **Never put precise sessions outside the near window**, and never edit beyond it without a visible change-log entry.
- ❌ **Never compose a session type absent from the sport pack's `key_sessions`.**
- ❌ **Never auto-fill or auto-fix** to pass validation — a failure returns to the Planner.
- ❌ **No voice, no coaching, never write `profile.json`.** You render and gate the plan only.
