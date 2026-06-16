# checkin — the check-in capability

A **capability of the Daily coach** (`pace-coach`), not a separate skill: a local file the coach reads into the same context. **Following it is not a handoff and not a voice change** — you are still the Daily coach. Its single responsibility is to ground today's interaction in the **already-planned** session: locate it deterministically, explain *why it is what it is*, and record that rationale on the session. You deliver the rationale in your own voice; this file production has no voice and never touches the session's structure.

## Inputs

- `plan/index.csv` — the full-season router; read it to find the `status:active` near row.
- `plan/weeks/<active_week_id>.json` — the active week's precise sessions; you find today's session by `date` here.
- `athlete/profile.json` (forwarded; test fixture `athlete/sample.json`) — hard constraints, `learned_behaviors`, `rpe_calibration`.
- `athlete/zones.json` (fixture: `athlete/sample-zones.json`) — the concrete bounds; the active week's `planned` field already carries these (copied at plan-write time), but you may cross-check here.
- recent `plan/weeks/*.json` sessions — the last few sessions' `status` / `actual` / `debrief`, for continuity (what happened yesterday, any open thread); plus `log/signals.md` for any emitted strong signal.
- the [`pace-elicitation`](../../pace-elicitation/) tool + its `methods.csv` — for the targeted questions you suggest on a sensation-free check-in.
- The **training principles** (load on demand, for the *why this session today* rationale): `knowledge_base/principles/periodization.md`, `intensity_zones.md`, `polarized_training.md`.

> If the master forwarded `{config, profile, zones, active_week}` as context, use those objects — the `active_week` is already the loaded `weeks/<active>.json`; do **not** re-read `profile.json`, `zones.json`, or `index.csv` from disk.

## Connectors (capability-detected)

Per [`_schema.md`](../../../extensions/connectors/_schema.md): probe, use if present, **degrade cleanly** if absent — never block, never invent or lose data.

- **Read (Strava, capability-first — use it by default).** Per `read.md`, resolution is capability-first: if a Strava read tool is **present**, read **summaries** of the last few activities for **qualitative context** (Phase 1) **by default** — you don't wait to be asked; it enriches the briefing. It is **not** a signal source and never calibrates the plan. Tool **absent** (or `strava = false` opt-out) -> the athlete's words and recent `plan/weeks/*.json` sessions; never invent a metric (scenario 05). See [`strava.md`](../../../extensions/connectors/strava.md).
- **Storage (write).** Update `plan/weeks/<active>.json` (the session's `rationale` + `status`) at its **logical path** via the storage backend. Backend unavailable -> **degrade to `local`**, never drop the write. See [`storage.md`](../../../extensions/connectors/storage.md).
- **Calendar (status).** When the session is confirmed done or skipped, set its calendar **status** -> `completed` / `skipped` (status only — you never create or move events). Absent -> update the `status` column in `plan/calendar.csv`. See [`calendar.md`](../../../extensions/connectors/calendar.md).

## Procedure

1. **Locate today's session (deterministic, no Markdown parsing).** Read `plan/index.csv` -> find the row where `horizon = near` and `status = active` -> load `plan/weeks/<week_id>.json` -> find the session whose `date` equals today. Edge cases: a **rest day** -> state plainly that rest *is* the plan today; a date **outside the ~2-week near window** -> explain window discipline (no precise session is committed yet that far out) and do **not** invent one; today's session **missing from the week file** -> report the gap rather than fabricate a session. **Legacy plan (no `index.csv`):** if `plan/index.csv` is absent but a legacy `plan/plan.md` with inline week tables exists, do **not** grep or improvise a session from the Markdown — the plan needs its one-time storage migration; end the turn pointing back to **Build** (the Planner's `plan-write` capability performs the migration to `index.csv` + `weeks/*.json`). This replaces the old "search the markdown" fallback.

2. **Build the "why this session today" rationale.** Tie the session to (a) the **phase intent** of its block (from the week file's `phase` field), (b) its **place in the plan** (where it falls in the week's load shape), (c) the **`learned_behaviors` it honors**, and (d) the **concrete bounds from the session's `planned` field** — name at least one real number ("the Z4 efforts are 227–262 W"), degrading to qualitative cues if the marker was absent at plan-write time. This is an explanation of the *existing* session — never a redesign.

3. **Surface signals, don't act on them.** Scan the athlete's prose for same-day signal-shaped input (wrecked legs, joint pain, limited time, heat, poor sleep, extra time). If present, **note it** (verbatim) so you can apply your `adjust` capability ([`adjust.md`](adjust.md)). You do **not** modulate here.

4. **Handle degraded input honestly (anti-hallucination).** On a sensation-free check-in, **never fabricate** a fatigue level, sleep quality, or feeling. Either suggest targeted elicitation questions from `methods.csv` or proceed with the **planned session as-is**, stating the assumption explicitly. No adjustment is applied without a signal that maps to `adjustment-decisions.csv` (scenario 05).

5. **Write the brief onto the session and update status.** Add a `rationale` field — the *why-this-session* brief, one or two sentences — to **today's session object** in `plan/weeks/<active>.json`. The session is the single home for its whole lifecycle, so there is **no separate log file**: you write the brief in place. Update that session's `status` to `"done"` if confirmed completed, else leave `"planned"` for adjust. A same-day signal you spotted is **not** written here — you carry it (step 3) into your `adjust` capability. **Do not** re-tabulate zone/data tables — the numbers are already in `planned`. Write `rationale` in `[surface].language`; keep tokens (`status` enums, `zones` labels) literal. Schema + example: [`../../pace-planner/assets/week-example.json`](../../pace-planner/assets/week-example.json).

   The session object after your write (you add `rationale`; the rest is the plan-time shape):

   ```json
   {
     "date": "2026-06-13", "type": "recovery_ride",
     "planned": { "duration_min": 45, "zones": ["Z1", "Z2"], "power": "0–240 W", "structure": "activation, 2–3 acc. 20s" },
     "rationale": "J-1 avant course 135 km — ouvrir les jambes, garder la fraîcheur, zéro fatigue.",
     "status": "planned", "actual": null
   }
   ```

## Output discipline

The rationale (the session's `rationale` field) is an **internal result** for *you*, the Daily coach — **never** rendered to the athlete as-is. Do **not** print a "CHECK-IN SUMMARY", an ASCII table, or a "For Daily Coach:" section: that is exactly the leak this contract forbids. You read it silently and deliver **one** message in your voice, in `[surface].language` (`docs/02_method.md`, "Single voice").

## Prohibitions (do not cross)

- ❌ **Never generate, compose, or modulate a session** — you read and explain the planned one; modulation is the `adjust` capability's job.
- ❌ **Never invent a sensation, signal, or state** the athlete did not provide (scenario 05).
- ❌ **Never apply an adjustment** with no corresponding `adjustment-decisions.csv` signal in the input.
- ❌ **Never write `athlete/profile.json`** — the Analyst (`pace-analyst`) is its sole writer. You may read it.
