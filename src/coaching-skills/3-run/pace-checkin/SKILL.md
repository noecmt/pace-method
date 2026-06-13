---
name: pace-checkin
user-invocable: false
description: >-
  The check-in workflow — reads plan/index.csv to find the active week, loads today's session from plan/weeks/<active>.json, and explains why THIS session today. Invoked BY the Daily coach (pace-agent-coach), not a user-facing entry point. It finds the session for today by date in the active week file (no Markdown parsing), builds the rationale (phase intent + place in the plan + the learned_behaviors it honors), records a short check-in entry to log/, and flags any same-day signal the athlete reported so the coach can hand off to pace-adjust. It NEVER generates, modulates, or invents a session, never fabricates a sensation the athlete did not give, and has no voice of its own.
---

# pace-checkin — the check-in workflow

A **workflow**, not a persona: **no voice, no user-facing output.** Your single responsibility is to ground today's interaction in the **already-planned** session: locate it deterministically, explain *why it is what it is*, and log the check-in. The Daily coach owns the conversation and delivers your rationale in its voice; you read the plan artefacts, produce the explanation and the log entry, and never touch the session's structure.

## Inputs

- `plan/index.csv` — the full-season router; read it to find the `status:active` near row.
- `plan/weeks/<active_week_id>.json` — the active week's precise sessions; you find today's session by `date` here.
- `athlete/profile.json` (test fixture: `athlete/sample.json`) — hard constraints, `learned_behaviors`, `rpe_calibration`.
- `athlete/zones.json` (fixture: `athlete/sample-zones.json`) — the concrete bounds; the active week's `planned` field already carries these (copied at plan-write time), but you may cross-check here.
- recent `log/` — the last few entries, for continuity (what happened yesterday, any open thread).
- [`pace-elicitation`](../../../core-skills/pace-elicitation/) + its `methods.csv` — for the targeted questions you suggest on a sensation-free check-in.
- The **training principles** (load on demand, for the *why this session today* rationale): `knowledge_base/principles/periodization.md`, `intensity_zones.md`, `polarized_training.md`.

> If `pace-master` forwarded `{config, profile, zones, active_week}` as context, use those objects — the `active_week` is already the loaded `weeks/<active>.json`; do **not** re-read `profile.json`, `zones.json`, or `index.csv` from disk.

## Connectors (capability-detected)

Per [`_schema.md`](../../../../extensions/connectors/_schema.md): probe, use if present, **degrade cleanly** if absent — never block, never invent or lose data.

- **Read (Strava, optional).** If a Strava read connector is available, you MAY read **summaries** of the last few activities for **qualitative context only** (Phase 1). This enriches the briefing; it is **not** a signal source. Absent -> the athlete's words and `log/`; never invent a metric (scenario 05). See [`strava.md`](../../../../extensions/connectors/strava.md).
- **Storage (write).** Write the check-in `log/` entry and update `plan/weeks/<active>.json` session status at their **logical paths** via the storage backend. Backend unavailable -> **degrade to `local`**, never drop the entry. See [`storage.md`](../../../../extensions/connectors/storage.md).
- **Calendar (status).** When the session is confirmed done or skipped, set its calendar **status** -> `completed` / `skipped` (status only — you never create or move events). Absent -> update the `status` column in `plan/calendar.csv`. See [`calendar.md`](../../../../extensions/connectors/calendar.md).

## Procedure

1. **Locate today's session (deterministic, no Markdown parsing).** Read `plan/index.csv` -> find the row where `horizon = near` and `status = active` -> load `plan/weeks/<week_id>.json` -> find the session whose `date` equals today. Edge cases: a **rest day** -> state plainly that rest *is* the plan today; a date **outside the ~2-week near window** -> explain window discipline (no precise session is committed yet that far out) and do **not** invent one; today's session **missing from the week file** -> report the gap to the coach rather than fabricate a session. **Legacy plan (no `index.csv`):** if `plan/index.csv` is absent but a legacy `plan/plan.md` with inline week tables exists, do **not** grep or improvise a session from the Markdown — report that the plan needs its one-time storage migration and hand back to the coach / `pace-master` to route to **Build** (`pace-plan-write` performs the migration to `index.csv` + `weeks/*.json`). This replaces the old "search the markdown" fallback.

2. **Build the "why this session today" rationale.** Tie the session to (a) the **phase intent** of its block (from the week file's `phase` field), (b) its **place in the plan** (where it falls in the week's load shape), (c) the **`learned_behaviors` it honors**, and (d) the **concrete bounds from the session's `planned` field** — name at least one real number ("the Z4 efforts are 227–262 W"), degrading to qualitative cues if the marker was absent at plan-write time. This is an explanation of the *existing* session — never a redesign.

3. **Surface signals, don't act on them.** Scan the athlete's prose for same-day signal-shaped input (wrecked legs, joint pain, limited time, heat, poor sleep, extra time). If present, **flag it** (verbatim) for the coach to hand off to [`pace-adjust`](../pace-adjust/). You do **not** modulate.

4. **Handle degraded input honestly (anti-hallucination).** On a sensation-free check-in, **never fabricate** a fatigue level, sleep quality, or feeling. Either suggest targeted elicitation questions from `methods.csv` or proceed with the **planned session as-is**, stating the assumption explicitly. No adjustment is applied without a signal that maps to `adjustment-decisions.csv` (scenario 05).

5. **Log the check-in and update session status.** Append a short dated entry to `log/` (e.g. `log/<date>-checkin.md`): the planned session, the rationale you gave, and any signal you flagged for adjust. Update the session's `status` in `plan/weeks/<active>.json` to `"done"` if confirmed completed, or leave as `"planned"` for adjust to handle.

## Output discipline

Your rationale + log entry are an **internal handoff to the Daily coach** — **never** rendered to the athlete. Do **not** print a "CHECK-IN SUMMARY", an ASCII table, or a "For Daily Coach:" section: that is exactly the leak this contract forbids. You return a structured object; the coach reads it silently and delivers **one** message in its voice, in `[surface].language` (`docs/02_method.md`, "Single voice, silent pipeline").

## Prohibitions (do not cross)

- ❌ **Never generate, compose, or modulate a session** — you read and explain the planned one; modulation is `pace-adjust`'s job.
- ❌ **Never invent a sensation, signal, or state** the athlete did not provide (scenario 05).
- ❌ **Never apply an adjustment** with no corresponding `adjustment-decisions.csv` signal in the input.
- ❌ **No voice, no coaching** — the Daily coach speaks; you produce the rationale and the log entry.
- ❌ **Never write `athlete/profile.json`** — the Analyst (`pace-agent-analyst`) is its sole writer. You may read it.
