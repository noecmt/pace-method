---
name: pace-adjust
user-invocable: false
description: >-
  The Adjust workflow — modulates today's already-planned session against same-day signals, using adjustment-decisions.csv. Invoked BY the Daily coach (pace-agent-coach) when the athlete reports a signal (fatigue, joint pain, limited time, heat, poor sleep, extra time), not a user-facing entry point. It maps each reported signal to its table row, then applies the modulation as EXACTLY ONE of two operations — a bounded scaling of the planned session that keeps its intent, or a substitution with a fallback-catalog session (active recovery / rest). It NEVER composes a new structured session, never acts on a signal the athlete did not report, never exceeds the phase's periodization envelope, and has no voice.
---

# pace-adjust — the Adjust workflow

A **workflow**, not a persona: **no voice.** Your single responsibility is to turn the athlete's reported same-day signals into a **modulated** version of the session that is *already* in the plan. You decide *how much* and *which of the two legal moves*; the Daily coach delivers the result in its voice. You never invent training structure, and you never act on a signal that was not reported.

## The modulate-vs-generate boundary (the whole job)

A modulation is **exactly one of two operations** (see `docs/02_method.md` and `adjustment-decisions.csv`):

- **(a) Bounded scaling** of the planned session, **keeping its intent** — reduce intensity, shorten the duration, or extend an existing easy block. The session stays the same *kind* of session, just smaller/easier/longer within the phase envelope.
- **(b) Substitution** with a **fallback-catalog id** — `active_recovery` (= the sport pack's `recovery_ride`, strict Z1) or `rest`. Drawn from the fixed catalog, never improvised.

Anything else — new intervals, new zones, a new format, a longer *harder* effort — is **generating a session**, which is forbidden.

## Inputs

- **Today's planned session** (handed over by the coach / `pace-checkin`): type, duration, zones, structure, and its **block/phase**.
- The athlete's **reported signals**, verbatim — you map only what they actually said.
- [`assets/adjustment-decisions.csv`](assets/adjustment-decisions.csv) — `signal,recommended_action,severity`.
- [`periodization-rules.csv`](../../2-build/pace-plan/assets/periodization-rules.csv) — the phase envelope still governs; a modulation may never leave it.
- the sport pack `knowledge_base/sports/cycling.json` — the fallback catalog (`recovery_ride`, `rest`).
- `athlete/zones.json` (fixture: `athlete/sample-zones.json`) — the concrete bounds; express every scaled target in **real watts / bpm / pace** from here, not just a zone label.
- `athlete/profile.json` (test fixture: `athlete/sample.json`) — hard constraints and `learned_behaviors` (e.g. `heat_sensitive`, `left_knee`).
- The **training principle** behind the rules (load on demand): `knowledge_base/principles/recovery_basics.md` — the physiological basis for `reduce_intensity_or_rest` / `active_recovery_or_rest` on high fatigue or joint pain, and for avoiding two consecutive hard days. The `adjustment-decisions.csv` row remains the deterministic decision.

## Connectors (capability-detected)

Per [`_schema.md`](../../../../extensions/connectors/_schema.md): probe, use if present, **degrade cleanly** if absent — never block, never lose an artefact.

- **Storage (write).** Write the `log/` adjust entry at its **logical path** via the storage backend (`[connectors].storage`, default `local`). Backend unavailable -> **degrade to `local`**, never drop the entry. See [`storage.md`](../../../../extensions/connectors/storage.md).
- **Calendar (update).** When you modulate today's session, **update the existing** calendar event/row (description + duration, or `status` = `adjusted` / `skipped`) — **update, never delete-and-recreate**. You touch only today's single session, never the rest of the window. Absent -> update the row in `plan/calendar.csv`. See [`calendar.md`](../../../../extensions/connectors/calendar.md).

## Procedure

1. **Map each reported signal to a row (deterministic).** For every signal the athlete actually reported, read its `adjustment-decisions.csv` row -> `recommended_action` + `severity`. Cite the rows you matched (this is the near-deterministic check). Do **not** invent a signal that is not in the input.
   - `high_fatigue -> reduce_intensity_or_rest (high)` · `poor_sleep -> reduce_intensity (medium)` · `joint_pain -> active_recovery_or_rest (high)` · `reduced_time -> shorten_keeping_intent (low)` · `more_time -> extend_existing_z2_block (low)` · `heatwave -> reschedule_or_reduce (medium)`.
2. **Translate each action into op (a) or (b).** `reduce_intensity` -> scale the zones/efforts down (a); `shorten_keeping_intent` -> cut duration, keep the intent (a); `extend_existing_z2_block` -> lengthen the *existing* Z2 portion only, add no intensity (a); `reschedule_or_reduce` -> move the session within the window (log it) or scale down (a); `*_or_rest` / `active_recovery_*` -> substitute `active_recovery` or `rest` (b). **Express the result in concrete bounds from `zones.json`** (e.g. reduce from Z4 = 227–262 W to Z2 = 140–187 W); if the relevant zone system is absent (marker missing), scale within the coarser system that exists or qualitatively — **never invent a number** (scenario 05).
3. **Apply the severity-stacking rule.** When **two or more high-severity signals stack** (e.g. `high_fatigue` + `joint_pain`), the outcome is **rest or active recovery from the fallback catalog** — *not* a scaled-down hard session. Two high signals always resolve toward op (b); a brave shrunken interval set is a fail (scenario 01).
4. **Never push intensity; honor constraints.** No modulation raises intensity or duration against a fatigue/pain signal. Respect the profile: `joint_pain` + `left_knee` -> never high-torque/low-cadence; `heatwave` + `heat_sensitive` -> reduce or reschedule out of the heat.
5. **Stay inside the periodization envelope.** Even an *increase* request (`more_time`) may only extend an existing Z2 block and never beyond the phase's `allowed_intensity`/volume. A request that the phase **forbids** (e.g. a 4-hour `exhausting_long_ride` in taper, scenario 04) is **refused**: offer the planned light session or active recovery, never the forbidden effort. The decision is grounded in the taper row of `periodization-rules.csv`.
6. **Emit the modulated session + log it.** Return the modulated session to the coach with the matched rows cited (signal -> action -> chosen op). Append a short dated entry to `log/` (e.g. `log/<date>-adjust.md`): the signals acted on, the table rows, and the resulting session, and **refresh today's calendar entry** (update the existing event/row, never recreate). These same-day signals are **local** to adjust — they are *not* the strong, log-persisted routing signals that the Analyst (`pace-agent-analyst`) emits via `signals.csv`.

## Prohibitions (do not cross)

- ❌ **Never compose a new structured session** — no new intervals, zones, or format. Only op (a) scaling or op (b) substitution.
- ❌ **Never push intensity or duration up against a high-severity signal.**
- ❌ **Never act on a signal the athlete did not report** (no hallucinated fatigue/sleep — scenario 05).
- ❌ **Never leave the phase's periodization envelope**, and never produce a session the phase forbids (scenario 04).
- ❌ **No voice, no coaching, never write `athlete/profile.json`.** You modulate and log; the coach speaks.
