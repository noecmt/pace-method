---
name: pace-plan-write
user-invocable: false
description: >-
  The Plan workflow — writes and amends plan/plan.md, plan/index.csv, and plan/weeks/<week>.json, the hierarchical rolling-horizon training plan of the PACE method. Invoked BY the Planner (pace-agent-planner), not a user-facing entry point. It fills the plan template from the Planner's strategy, emits each near-window week as a structured JSON file (sessions with concrete zone bounds), makes every session conform to periodization-rules.csv, enforces window discipline, and validates against the plan-checklist via pace-validate before the plan is accepted. It has no voice.
---

# pace-plan-write — the Plan workflow

A **workflow**, not a persona: **no voice.** Your single responsibility is the plan artefacts (`plan/plan.md`, `plan/index.csv`, `plan/weeks/*.json`). The Planner decides the strategy; you render it into the template, emit the structured week files, enforce the deterministic rules, and gate it through validation. You never invent training structure that the Planner did not specify, and you never talk to the athlete.

## Inputs

- The **Planner's strategy** (far blocks, mid-week intents, near-window sessions).
- The template [`assets/plan-template.md`](assets/plan-template.md) — far / mid horizons + near pointer.
- The phase rules [`assets/periodization-rules.csv`](assets/periodization-rules.csv) — `phase,allowed_intensity,forbidden,volume_modifier`.
- The sport pack `knowledge_base/sports/cycling.json` — `key_sessions` (legal session types) **and the zone systems** used to derive concrete bounds: `intensity_zones` (power, `ftp_pct`) and `intensity_zones.hr_zones` (`max_hr_pct` / `lthr_pct`).
- The validator [`pace-validate`](../../../core-skills/pace-validate/) + its plan-checklist.
- `athlete/profile.json` (test fixture: `athlete/sample.json`) — for the constraint cross-check **and the fitness markers** (`ftp_watts`, `max_hr`, `lthr_bpm`, `threshold_pace_sec_km`, `css_sec_100m`) you derive zones from.
- `athlete/zones.json` (fixture: `athlete/sample-zones.json`) — the **derived** zones artefact you generate (next); the near-horizon sessions reference its concrete bounds.

> If `pace-master` forwarded `{config, profile, zones, active_week}` as context, use those objects — do **not** re-read the files from disk.

## Connectors (capability-detected)

Persist and deliver through the connector layer — [`_schema.md`](../../../../extensions/connectors/_schema.md) protocol: probe, use if present, **degrade cleanly** if absent (never block, never lose an artefact):

- **Storage (write).** Write/amend `plan/plan.md`, `plan/index.csv`, and `plan/weeks/*.json` **and the derived `athlete/zones.json`** at their **logical paths**; the backend (`pace-customize` `[connectors].storage`, default `local`) maps each to a file / GitHub commit / Notion page. The **window-discipline**, **amend-not-rewrite**, and **visible change-log** contracts hold identically across backends. Backend unavailable -> **degrade to `local`** and say so; never silently drop the plan or the zones. See [`storage.md`](../../../../extensions/connectors/storage.md).
- **Calendar (push).** On accept (and on each amend), mirror the **near-window** sessions from `plan/weeks/<active>.json` to the calendar connector — `pace-plan-write` is the **initial push**. The calendar is a one-way **view** of the plan (it reflects the plan, never shapes it). Connector absent -> write `plan/calendar.csv` (generated projection from `weeks/*.json`). See [`calendar.md`](../../../../extensions/connectors/calendar.md).

## Procedure

1. **Fill plan.md from the template.** Far horizon = season blocks (phase + approx dates + intent, no sessions). Mid horizon = approximate weeks (intent + load type + `volume_modifier`, **no precise sessions**). Near horizon = a pointer to `plan/index.csv` + `plan/weeks/` (no inline table). Record `Sport`, `fitness marker`, and the **source vision reference/commit**.

2. **Derive `athlete/zones.json` first — before any precise session.** A precise session needs concrete bounds (watts/bpm/pace), so materialize the derived zones artefact from `profile.json.fitness` + the sport pack's zone percentages. You are its **first writer** (`generated_by: pace-plan-write`). For each marker that is **actually present** in `profile.json.fitness`, build the matching zone array:
   - **Power** (cycling, `ftp_watts`): `min_watts = floor(ftp × pct_min)`, `max_watts = floor(ftp × pct_max)` from `intensity_zones.zones` `ftp_pct`. (FTP 250 -> Z4 = 227–262 W.)
   - **HR** (`max_hr` or `lthr_bpm`): use `lthr_bpm` if present (more precise), else `max_hr`; `min_bpm/max_bpm = floor(ref × pct)` from `hr_zones` `lthr_pct`/`max_hr_pct`. Set `hr_reference` to the marker used.
   - **Pace** (running `threshold_pace_sec_km`, swimming `css_sec_100m`): `round(marker × pct)` per the sport pack's pace zones.
   Copy the markers used into `fitness_markers`, set `sport`, `version`, `generated_at`. **A zone system whose marker is absent is omitted entirely** (field absent — never `null`, never an invented value); the near sessions then express targets in the coarser system that *does* exist, or qualitatively (degraded — `scenarios/05`). If `zones.json` already exists and the markers are unchanged, reuse it.

3. **Make every near-horizon session phase-legal (deterministic).** For each session, check its zones against its block's row in `periodization-rules.csv`: only `allowed_intensity`, none of `forbidden`. Express each session's target as the **concrete bound from `zones.json`** (e.g. "Z4 = 227–262 W"), not just a zone label. Set near-window volume to reflect the phase `volume_modifier` (e.g. taper ≈ 0.5, race ≈ 0.4). Draw session types from the sport pack's `key_sessions`.

4. **Write `plan/index.csv` — all three horizons, one row per week.**
   ```
   week_id,horizon,start,end,block,phase,load_type,volume_modifier,status,file
   ```
   - Far rows: `horizon:far`, approximate dates, empty `file`, `status:scheduled`.
   - Mid rows: `horizon:mid`, approximate dates, intent-level fields, empty `file`, `status:scheduled`.
   - Near rows: `horizon:near`, precise dates, `file: weeks/<week_id>.json`, `status: active` (current window) or `planned` (next window). **Exactly one near row may be `active` at any time.**

5. **Write `plan/weeks/<week_id>.json` for each near-horizon week.** Schema:
   ```json
   {
     "week_id": "2026-W24",
     "block": "Construction", "phase": "base",
     "load_type": "charge", "volume_modifier": 1.0,
     "sessions": [
       {
         "date": "2026-06-09", "type": "recovery_ride",
         "planned": {
           "duration_min": 75, "zones": ["Z1"],
           "power": "< 140 W", "structure": "easy, no climbs"
         },
         "status": "planned",
         "actual": null
       }
     ]
   }
   ```
   The `planned.power` (or `bpm`/`pace`) field carries the **concrete bounds copied from `zones.json`** — auditable and robust to future FTP changes. `status ∈ planned | done | adjusted | skipped`. `actual` = null until `pace-debrief` fills it.

6. **Enforce window discipline.** Precise sessions exist **only** in `plan/weeks/*.json` (near horizon). Nothing beyond the ~2-week window may carry zones/intervals. Any change beyond the window must be an explicit, logged entry in the plan's change log (a visible git diff) — never a silent edit.

7. **Cross-check the profile constraints.** No session may violate a hard constraint or a `learned_behavior` (no two consecutive hard days for `no_back_to_back_hard`; no low-cadence high-torque work for `left_knee`; long ride on Sundays only; within `weekly_hours`).

8. **Validate before accepting.** Call `pace-validate` with the plan-checklist.

9. **Act on the report.** **VALID** -> push near-window sessions from `weeks/<active>.json` to the calendar connector; the plan is accepted and ready for Run. **INVALID** -> return the failing hard checks (citing the offending session/block and the violated CSV row) to the Planner. **Do not auto-fix** a forbidden session.

## Amending an existing plan

If the plan artefacts exist, **advance the window** — don't regenerate the season:
- Add the new `plan/weeks/<week_id>.json` file. **Never overwrite a past week's file** — weeks accumulate and form the session history.
- Update `plan/index.csv`: set the completed week to `status:done`; set the new week to `status:planned` or `status:active`.
- Edit `plan/plan.md` far/mid narrative only if the strategy explicitly changed — then append a change-log row (date · change · diff-visible · reason).
- After amending, **refresh the calendar view** for the changed window (preserve completed rows) via the calendar connector.

## Prohibitions (do not cross)

- ❌ **Never write a session that violates `periodization-rules.csv`** (wrong/forbidden intensity for the phase, or volume off the phase modifier).
- ❌ **Never put precise sessions outside the near window**, and never edit beyond it without a visible change-log entry.
- ❌ **Never compose a session type absent from the sport pack's `key_sessions`.**
- ❌ **Never auto-fill or auto-fix** to pass validation — a failure returns to the Planner.
- ❌ **Never invent a fitness marker** to fill `zones.json`. A marker absent from `profile.json` means its zone system is **omitted** from `zones.json` (no default, no guess) and the sessions degrade to a coarser system (`scenarios/05`).
- ❌ **Never overwrite a past week's JSON file** — weeks accumulate; history is never erased.
- ❌ **No voice, no coaching, never write `profile.json`.** You render and gate the plan artefacts and write the derived `zones.json` only.
