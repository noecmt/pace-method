# Scenario 13 — Week summary

**Tests:** the Analyst (`pace-analyst`) maintains a week-level `summary` block on `plan/weeks/<week>.json` — derived, structured, idempotent — and the `pace` master can recite it verbatim in the concierge lane ("summarize my week"). The summary is an *aggregate of executed sessions*, never a coaching judgment and never a fabricated metric.

## Setup

- Athlete: `athlete/sample.json` + `athlete/sample-zones.json`.
- Active week: a `plan/weeks/<active>.json` shaped like [`src/pace-planner/assets/week-example.json`](../src/pace-planner/assets/week-example.json) — 6 sessions, statuses `done, done, skipped, done, adjusted, planned` (1 still pending), spanning **2 sports** (cycling + a swimming session) with a **two-a-day** on `2026-06-13` (swim `am` + cycling `pm`).
- `[surface].language = fr`.

## Cases & expected behavior

| # | Trigger | Expected |
| --- | --- | --- |
| A | Athlete debriefs a session of the active week (`/pace-debrief` or a report) | The Analyst writes `actual`+`status`+`debrief` on the session **and** (re)computes the week-level `summary` block from the week's current statuses. |
| B | Athlete (later) asks "résume-moi ma semaine" / "where is my week at?" | The **master** recites the stored `summary` block **verbatim-as-data** in `[surface].language` (concierge lane). It launches **no** agent and makes **no** training judgment. |
| C | Same ask but **no `summary` block exists yet** (nothing debriefed) | The master states the week isn't summarized yet and offers `/pace-debrief` — it does **not** compute the summary itself. |

## Expected properties

- [ ] **Owner.** The `summary` is written **only** by the Analyst (`pace-analyst`) — same sole-writer discipline as the session `debrief`. It lives at the **week level** of `plan/weeks/<week>.json` (sibling of `sessions`), the home of the week aggregate.
- [ ] **Idempotent / refreshed.** Re-running the debrief flow recomputes the whole `summary` from the current session statuses (never an incremental patch); `status: in_progress` while sessions remain `pending`, `complete` once all sessions are terminal.
- [ ] **Lean + intensity split.** The block carries exactly: `sessions {total, done, adjusted, skipped, pending}`, `adherence`, `duration_min {planned, actual}`, `distance_km` **keyed by sport** (`{<sport>: actual}` — executed only, no planned distance by design; cross-sport sum forbidden), `intensity_split_min` (minutes by band **Z1-Z2 / Z3 / Z4-Z5**), a `read` (≤2 sentences, neutral), `generated_by`, `generated_at`, `status`. **`by_sport`** (`{<sport>: {sessions, duration_min, distance_km}}`) appears **only because the week has >1 sport**; a mono-sport week omits it.
- [ ] **Deterministic aggregation.** `duration_min.actual` sums `actual.duration_min_actual` over `done`/`adjusted` sessions; `distance_km.<sport>` sums `actual.distance_km` over the same sessions **of that sport** (never collapsed across sports); `intensity_split_min` assigns each executed session's actual minutes to the band of its **dominant (highest-intensity) planned zone**; `adherence = (done + adjusted) / (done + adjusted + skipped)` (pending excluded).
- [ ] **Concierge recite (B).** Reciting a stored block is a **factual read** (like reciting today's planned session) — it stays in the concierge lane; the master neither recomputes nor editorializes.
- [ ] **Single voice.** The athlete sees one short message: the Analyst's acknowledgement (A) or the master's recital (B). No "SUMMARY FOR …" block, no narrated bookkeeping.

## Anti-properties (must NOT happen)

- [ ] ❌ The Analyst **fabricates** a metric the sessions don't carry (e.g. a watt/TSS number the athlete never reported, time-in-zone from absent data).
- [ ] ❌ Any agent other than the Analyst writes the `summary` block; the **Planner** (`plan-write`/`rolling`) touches it.
- [ ] ❌ The master **computes** the summary or makes a training judgment about the week under the concierge lane (C must offer `/pace-debrief`, not improvise).
- [ ] ❌ The `summary` overwrites or duplicates the per-session `debrief` (the session stays the home of its own lifecycle).

## Deterministic check

Given the [`week-example.json`](../src/pace-planner/assets/week-example.json) fixture (statuses `done, done, skipped, done, adjusted, planned`; 2 sports): `summary.sessions = {total:6, done:3, adjusted:1, skipped:1, pending:1}`; `duration_min = {planned:580, actual:325}`; `distance_km = {cycling:137, swimming:1.8}`; `intensity_split_min = {"Z1-Z2":205, "Z3":120, "Z4-Z5":0}`; `by_sport = {cycling:{sessions:5, duration_min:285, distance_km:137}, swimming:{sessions:1, duration_min:40, distance_km:1.8}}`; `adherence = 0.8`; `status = "in_progress"`. Any deviation in these computed fields => **fail**.

**Gate:** the Analyst writes a correct, idempotent week `summary`; the master recites it (B) or defers to `/pace-debrief` (C) — never fabricates, never coaches.
