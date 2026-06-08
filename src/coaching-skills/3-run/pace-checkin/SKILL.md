---
name: pace-checkin
description: >-
  The check-in workflow — reads plan/plan.md, locates today's already-planned session, and explains why THIS session today. Invoked BY the Daily coach (pace-agent-coach), not a user-facing entry point. It finds the session for today in the near horizon, builds the rationale (phase intent + place in the plan + the learned_behaviors it honors), records a short check-in entry to log/, and flags any same-day signal the athlete reported so the coach can hand off to pace-adjust. It NEVER generates, modulates, or invents a session, never fabricates a sensation the athlete did not give, and has no voice of its own.
---

# pace-checkin — the check-in workflow

A **workflow**, not a persona: **no voice.** Your single responsibility is to ground today's interaction in the **already-planned** session: locate it, explain *why it is what it is*, and log the check-in. The Daily coach owns the conversation and delivers your rationale in its voice; you read the plan, produce the explanation and the log entry, and never touch the session's structure.

## Inputs

- `plan/plan.md` — the rolling plan; you read the **near horizon** to find today's session by date.
- `athlete/profile.json` (test fixture: `athlete/sample.json`) — hard constraints, `learned_behaviors`, `rpe_calibration`.
- recent `log/` — the last few entries, for continuity (what happened yesterday, any open thread).
- [`pace-elicitation`](../../../core-skills/pace-elicitation/) + its `methods.csv` — for the targeted questions you suggest on a sensation-free check-in.
- The **training principles** (load on demand, for the *why this session today* rationale): `knowledge_base/principles/periodization.md` (what the phase is for), `intensity_zones.md` (what the session's zones train), `polarized_training.md` (why the easy/hard split). You cite the *why* of the existing session — never new structure.

## Connectors (capability-detected)

Per [`_schema.md`](../../../../extensions/connectors/_schema.md): probe, use if present, **degrade cleanly** if absent — never block, never invent or lose data.

- **Read (Strava, optional).** If a Strava read connector is available, you MAY read **summaries** of the last few activities for **qualitative context only** (Phase 1) — e.g. "recent rides have run short". This enriches the briefing; it is **not** a signal source — a same-day adjustment still requires a signal the athlete actually reported, mapped via `adjustment-decisions.csv`. Absent -> the athlete's words and `log/`; never invent a metric (scenario 05). See [`strava.md`](../../../../extensions/connectors/strava.md).
- **Storage (write).** Write the check-in `log/` entry at its **logical path** via the storage backend (`[connectors].storage`, default `local`). Backend unavailable -> **degrade to `local`**, never drop the entry. See [`storage.md`](../../../../extensions/connectors/storage.md).
- **Calendar (status).** When the session is confirmed done or skipped, set its calendar **status** -> `completed` / `skipped` (status only — you never create or move events; that is `pace-plan` / `pace-rolling` / `pace-adjust`). Absent -> update the `status` column in `plan/calendar.csv`. See [`calendar.md`](../../../../extensions/connectors/calendar.md).

## Procedure

1. **Locate today's session.** Find today's date in the plan's **near-horizon** table. Read its type, duration, zones, structure, and the block/phase it sits in. Three edge cases: a **rest day** -> state plainly that rest *is* the plan today (it is a prescribed session, not an absence of one); a date **outside the ~2-week near window** -> explain window discipline (no precise session is committed yet that far out) and do **not** invent one; today's row **missing** -> report the gap to the coach rather than fabricate a session.
2. **Build the "why this session today" rationale.** Tie the session to (a) the **phase intent** of its block (e.g. build: raise threshold / touch VO2max; taper: shed fatigue, stay sharp), (b) its **place in the plan** (where it falls in the week's load shape, what it sets up or recovers from), and (c) the **`learned_behaviors` it honors** (e.g. it follows a hard day with Z1/Z2 because of `no_back_to_back_hard`; it is scheduled in the morning because of `morning_responder`). This is an explanation of the *existing* session — never a redesign.
3. **Surface signals, don't act on them.** Scan the athlete's prose for same-day signal-shaped input (wrecked legs, joint pain, limited time, heat, poor sleep, extra time). If present, **flag it** (verbatim) for the coach to hand off to [`pace-adjust`](../pace-adjust/). You do **not** modulate — that boundary belongs to `pace-adjust`.
4. **Handle degraded input honestly (anti-hallucination).** On a sensation-free check-in (a bare "ok", "let's go"), **never fabricate** a fatigue level, sleep quality, or feeling. Either suggest one or two targeted elicitation questions from `methods.csv` (e.g. `scale_anchoring` for effort/feel, `constraint_elicitation` for available time) — concise, not an interrogation — or, if the athlete still gives nothing, proceed with the **planned session as-is**, stating the assumption explicitly ("assuming a normal day, here's today's session…"). No adjustment is applied without a signal that maps to `adjustment-decisions.csv` (scenario 05).
5. **Log the check-in.** Append a short dated entry to `log/` (e.g. `log/<date>-checkin.md`): the planned session, the rationale you gave, and any signal you flagged for adjust. Keep it terse — the log is the audit trail, not a journal.

## Prohibitions (do not cross)

- ❌ **Never generate, compose, or modulate a session** — you read and explain the planned one; modulation is `pace-adjust`'s job.
- ❌ **Never invent a sensation, signal, or state** the athlete did not provide (scenario 05). A gap is asked about or assumed-explicitly, not filled.
- ❌ **Never apply an adjustment** with no corresponding `adjustment-decisions.csv` signal in the input.
- ❌ **No voice, no coaching** — the Daily coach speaks; you produce the rationale and the log entry.
- ❌ **Never write `athlete/profile.json`** — the Analyst (`pace-debrief`) is its sole writer. You may read it.
