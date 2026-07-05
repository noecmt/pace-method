# Scenario 17 — Debrief of an off-plan session

**Tests:** the Analyst (`pace-analyst`) records an **executed** activity that matches **no** session in the active week (a training done on a rest day, a bonus session, a different sport). Instead of writing into the void and hallucinating a confirmation, it **creates** an `unplanned` session object (`planned: null`, `unplanned: true`, `status: "done"`, `actual` from the report only), inserts it in chronological order, and the week `summary` picks it up. Recording *executed* history is **memory**, not session generation — the `plan-first` prohibition (`the Run coach NEVER generates a session`) governs *future/prescribed* sessions only, and is untouched here.

## Setup

- Athlete: `athlete/sample.json` + `athlete/sample-zones.json`.
- Active week `2026-W27` **materialized** (`plan/weeks/2026-W27.json` present, `status:active` near row in `plan/index.csv`). Planned sessions: Tue 30 Jun endurance, **Wed 1 Jul — rest day (no session object)**, Thu 2 Jul tempo Z3, Sat 4 Jul endurance, Sun 5 Jul long ride.
- `[surface].language = fr`.

## Cases & expected behavior

| # | Trigger | Expected |
| --- | --- | --- |
| A | "mercredi 1er juillet — j'ai fait une séance non prévue : sortie de 3h 90km, Z2 principal, RAS" (date **inside** the materialized near window, no matching session) | The Analyst **creates** a session `2026-07-01-am` with `unplanned: true`, `planned: null`, `status: "done"`, `actual` filled only from the report, inserts it chronologically in `sessions[]`, then refreshes the week `summary`. Confirmation states it was recorded **as an unplanned session**. |
| B | Same report, but the date falls **outside** the ~2-week near window (no materialized week file) | The Analyst does **not** create anything; it says plainly there is no materialized week for that date and points to Build/rolling (`/pace-plan`). No fabricated "recorded". |
| C | A bonus session on a day that **already holds** a planned session (a second, unplanned ride) | The Analyst creates a **second** session on that date under a distinct `slot` (`pm`, or an ordinal), leaving the planned session untouched. |

## Expected properties

- [ ] **Off-plan branch exists.** A report of an executed activity whose date/`id` matches no session **in a materialized near week** makes the Analyst **create** a session object — it never writes into the void.
- [ ] **Unplanned shape.** The created session carries `unplanned: true`, `planned: null`, `status: "done"`, a well-formed `id` = `<date>-<slot>` unique within its date, a `sport`, and a `type` classified from what the athlete described (nearest sport-pack `key_session`). It conforms to `extensions/week.schema.json` (which now allows `planned: null` on an `unplanned` session).
- [ ] **Actual from the report only.** `actual` records only what the athlete gave; absent metrics (rpe, distance if unstated) -> `null`, never invented (scenario 05). A Strava summary read may fill `distance_km` if present.
- [ ] **Chronological insert.** The new session sits at its correct place in `sessions[]` by `date`/`slot`; existing sessions are unchanged (past/other sessions immutable).
- [ ] **Summary refreshes.** The week `summary` is recomputed whole to include the new session: `sessions.done` +1, `duration_min.actual` and `distance_km.<sport>` include the execution; `intensity_split_min` classifies it by its **reported executed zone** (no planned zone exists), or omits its minutes if no zone was given.
- [ ] **Honest confirmation (anti-hallucination).** The spoken "recorded" is **conditioned** on a session object actually existing for the reported activity after the write. When none can be placed (case B), the Analyst says so and offers the action instead of asserting a fictional record.
- [ ] **Single voice.** The athlete sees one short French acknowledgement — the created object and the summary refresh are silent file work.

## Anti-properties (must NOT happen)

- [ ] ❌ Confirms "enregistré" while **no** session object was written (the observed bug).
- [ ] ❌ **Fabricates** a metric the athlete didn't give (rpe, distance) or a debrief the report didn't contain (scenario 05).
- [ ] ❌ **Prescribes / plans** a future session, or writes a `planned` block onto the unplanned session — `planned` stays `null`. Recording the *past done* is not generating a *future to-do*.
- [ ] ❌ **Silently creates** a session for a date **outside** the materialized near window (case B must defer to Build/rolling, not invent a week).
- [ ] ❌ Overwrites or renames the planned rest day's neighbours, or the planned session on a shared date (case C).

## Deterministic check

After case A on the `2026-W27` file:

- a session exists with `id: "2026-07-01-am"`, `unplanned: true`, `planned: null`, `status: "done"`, `actual.distance_km == 90`, `actual.duration_min_actual == 180`;
- `summary.sessions.done` is the pre-write value **+1**; `summary.distance_km.cycling` includes the 90 km;
- the created session validates against `extensions/week.schema.json` (planned `null` allowed only with `unplanned: true`).

Any deviation — no object written, a fabricated metric, a non-null `planned`, or a schema-invalid session — => **fail**.

**Gate:** an off-plan executed report yields either a written `unplanned` session (in a materialized week) **or** an honest "no session at plan for that date" message — **never** a fabricated confirmation, **never** a generated future session.
