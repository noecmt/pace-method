---
name: pace-adjust
user-invocable: false
description: >-
  The Adjust workflow — modulates today's already-planned session against same-day signals, using adjustment-decisions.csv. Invoked BY the Daily coach (pace-agent-coach) when the athlete reports a signal (fatigue, joint pain, limited time, heat, poor sleep, extra time), not a user-facing entry point. It maps each reported signal to its table row, then applies the modulation as EXACTLY ONE of two operations — a bounded scaling of the planned session that keeps its intent, or a substitution with a fallback-catalog session (active recovery / rest). Writes the modulated result back to plan/weeks/<active>.json (status: adjusted). It NEVER composes a new structured session, never acts on a signal the athlete did not report, never exceeds the phase's periodization envelope, and has no voice.
---

# pace-adjust — the Adjust workflow

A **workflow**, not a persona: **no voice, no user-facing output.** Your single responsibility is to turn the athlete's reported same-day signals into a **modulated** version of the session that is *already* in the plan, and write the result back to `plan/weeks/<active>.json`. You decide *how much* and *which of the two legal moves*; the Daily coach delivers the result in its voice. You never invent training structure, and you never act on a signal that was not reported.

## The modulate-vs-generate boundary (the whole job)

A modulation is **exactly one of two operations** (see `docs/02_method.md` and `adjustment-decisions.csv`):

- **(a) Bounded scaling** of the planned session, **keeping its intent** — reduce intensity, shorten the duration, or extend an existing easy block. The session stays the same *kind* of session, just smaller/easier/longer within the phase envelope.
- **(b) Substitution** with a **fallback-catalog id** — `active_recovery` (= the sport pack's `recovery_ride`, strict Z1) or `rest`. Drawn from the fixed catalog, never improvised.

Anything else — new intervals, new zones, a new format, a longer *harder* effort — is **generating a session**, which is forbidden.

## Inputs

- **Today's planned session** (from `plan/weeks/<active_week_id>.json`, handed over by the coach / `pace-checkin`): type, duration, zones, structure, and its **block/phase**.
- The athlete's **reported signals**, verbatim — you map only what they actually said.
- [`assets/adjustment-decisions.csv`](assets/adjustment-decisions.csv) — `signal,recommended_action,severity`.
- [`periodization-rules.csv`](../../2-build/pace-plan/assets/periodization-rules.csv) — the phase envelope still governs; a modulation may never leave it.
- the sport pack `knowledge_base/sports/cycling.json` — the fallback catalog (`recovery_ride`, `rest`).
- `athlete/zones.json` (fixture: `athlete/sample-zones.json`) — the concrete bounds; express every scaled target in **real watts / bpm / pace** from here, not just a zone label.
- `athlete/profile.json` (test fixture: `athlete/sample.json`) — hard constraints and `learned_behaviors` (e.g. `heat_sensitive`, `left_knee`).
- The **training principle** behind the rules (load on demand): `knowledge_base/principles/recovery_basics.md`.

> If `pace-master` forwarded `{config, profile, zones, active_week}` as context, use those objects — do **not** re-read the files from disk.

## Connectors (capability-detected)

Per [`_schema.md`](../../../../extensions/connectors/_schema.md): probe, use if present, **degrade cleanly** if absent — never block, never lose an artefact.

- **Storage (write).** Write the `log/` adjust entry and update `plan/weeks/<active>.json` at their **logical paths** via the storage backend. Backend unavailable -> **degrade to `local`**, never drop the entry. See [`storage.md`](../../../../extensions/connectors/storage.md).
- **Calendar (update).** When you modulate today's session, **update the existing** calendar event/row (description + duration, or `status` = `adjusted` / `skipped`) — **update, never delete-and-recreate**. You touch only today's single session, never the rest of the window. Absent -> update the row in `plan/calendar.csv`. See [`calendar.md`](../../../../extensions/connectors/calendar.md).

## Procedure

1. **Map each reported signal to a row (deterministic).** For every signal the athlete actually reported, read its `adjustment-decisions.csv` row -> `recommended_action` + `severity`. Cite the rows you matched. Do **not** invent a signal that is not in the input.
   - `high_fatigue -> reduce_intensity_or_rest (high)` · `poor_sleep -> reduce_intensity (medium)` · `joint_pain -> active_recovery_or_rest (high)` · `reduced_time -> shorten_keeping_intent (low)` · `more_time -> extend_existing_z2_block (low)` · `heatwave -> reschedule_or_reduce (medium)`.

2. **Translate each action into op (a) or (b).** `reduce_intensity` -> scale zones/efforts down (a); `shorten_keeping_intent` -> cut duration, keep the intent (a); `extend_existing_z2_block` -> lengthen the *existing* Z2 portion only, add no intensity (a); `reschedule_or_reduce` -> move the session within the window (log it) or scale down (a); `*_or_rest` / `active_recovery_*` -> substitute `active_recovery` or `rest` (b). **Express the result in concrete bounds from `zones.json`** (e.g. reduce from Z4 = 227–262 W to Z2 = 140–187 W); if the relevant zone system is absent, scale within the coarser system or qualitatively — **never invent a number** (scenario 05).

3. **Apply the severity-stacking rule.** When **two or more high-severity signals stack** (e.g. `high_fatigue` + `joint_pain`), the outcome is **rest or active recovery from the fallback catalog** — not a scaled-down hard session. Two high signals always resolve toward op (b) (scenario 01).

4. **Never push intensity; honor constraints.** No modulation raises intensity or duration against a fatigue/pain signal. Respect the profile: `joint_pain` + `left_knee` -> never high-torque/low-cadence; `heatwave` + `heat_sensitive` -> reduce or reschedule out of the heat.

5. **Stay inside the periodization envelope.** Even an *increase* request (`more_time`) may only extend an existing Z2 block and never beyond the phase's `allowed_intensity`/volume. A request the phase **forbids** (e.g. a 4-hour exhausting long ride in taper, scenario 04) is **refused**: offer the planned light session or active recovery.

6. **Write the modulated result onto the session object in `plan/weeks/<active>.json`.** In today's session: set `status: "adjusted"`, update the `planned` fields to the modulated values (scaled zones/duration), and add an `adjustment` object recording **what** you did — `{ "signals": [<the same-day signals acted on>], "rows": [<the adjustment-decisions.csv rows applied, e.g. "heatwave -> reschedule_or_reduce">] }`. The session is the single home for its lifecycle, so there is **no separate log file**. Do **not** re-tabulate the resulting session — it *is* the updated `planned`. Write prose in `[surface].language`; keep the `signal:` ids and `status` enums literal. Refresh the calendar entry (update the existing event/row, never recreate). The same-day signals handled here are **local** to adjust — not the strong, cross-session routing signals the Analyst emits to `log/signals.md`. Schema + example: [`../../2-build/pace-plan/assets/week-example.json`](../../2-build/pace-plan/assets/week-example.json).

## Output discipline

You emit **no user-facing text**. The modulated session, the matched table rows, and the `adjustment` record on the session are **internal objects** the Daily coach renders in its voice and in `[surface].language`. Never print a summary block or the raw `adjustment-decisions.csv` rows to the athlete (`docs/02_method.md`, "Single voice, silent pipeline").

## Prohibitions (do not cross)

- ❌ **Never compose a new structured session** — no new intervals, zones, or format. Only op (a) scaling or op (b) substitution.
- ❌ **Never push intensity or duration up against a high-severity signal.**
- ❌ **Never act on a signal the athlete did not report** (no hallucinated fatigue/sleep — scenario 05).
- ❌ **Never leave the phase's periodization envelope**, and never produce a session the phase forbids (scenario 04).
- ❌ **No voice, no coaching, never write `athlete/profile.json`.** You modulate and write back to `weeks/<active>.json` (`status`, `planned`, `adjustment`); the coach speaks.
