# Scenario evaluation grid

Manual evaluation grid for the 6 V0 scenarios (see `docs/04_evaluation.md`, "scenario-in-the-loop").

Run each scenario in the host (Claude Code / Desktop), then mark every property. A scenario **PASSES** only if all **hard** properties and the **deterministic** check are ✅ (anti-properties must be ✅ = "did not happen"). **Gate: any scenario not passing = no merge.**

Result legend: ✅ pass · ❌ fail · — not evaluated.

Type legend: `hard` (must pass) · `anti` (must NOT happen) · `det` (deterministic vs CSV) · `soft` (quality).

## Run metadata

| Field | Value |
| --- | --- |
| Run date | _YYYY-MM-DD_ |
| Host | _Claude Code / Claude Desktop_ |
| Skills commit | _git short sha of `v0`_ |
| Evaluator | _name_ |

---

## 01 — Overload & stacked constraints

| # | Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 | Coach reads the **planned** session & explains it — does not ask "what session do you want?" | hard | — | |
| 2 | `pace-adjust` maps signals via `adjustment-decisions.csv` (high_fatigue, joint_pain, heatwave, reduced_time) | hard/det | — | |
| 3 | Two high-severity signals (fatigue + joint pain) -> **rest** or **active recovery** (fallback `recovery_ride` Z1) | hard/det | — | |
| 4 | Output justified by citing the matched table rows | hard | — | |
| 5 | Does **not** compose a new structured session | anti | — | |
| 6 | Does **not** push intensity given joint pain + fatigue | anti | — | |
| 7 | Does **not** invent a fact not provided | anti | — | |
| D | Resulting action ∈ { rest, active_recovery }; any structured interval session => fail | det | — | |

**Verdict 01: PASS / FAIL**

## 02 — Memory persistence

| # | Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 | Week 1: Analyst (`pace-debrief`) sole writer; appends `learned_behavior` with a concrete `rule` | hard | — | |
| 2 | Week 4: Planner honors it — no two hard sessions on consecutive days | hard/det | — | |
| 3 | Inserts Z1/Z2 or rest between any two hard sessions | hard | — | |
| 4 | `pace-validate` flags a violation if one slips through | hard | — | |
| 5 | Learned behavior **not** silently dropped between wk1 and wk4 | anti | — | |
| 6 | No persona other than the Analyst writes `profile.json` | anti | — | |
| 7 | No two consecutive hard days in the wk4 window | anti | — | |
| D | Scan wk4: every consecutive-day pair -> not both hard (Z4/Z5/threshold); any back-to-back => fail | det | — | |

**Verdict 02: PASS / FAIL**

## 03 — Profile contradiction

| # | Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 | Fueling guidance consistent with `vegetarian` (or defers) — never contradicts it | hard | — | |
| 2 | Low-cadence/high-torque request checked vs `left_knee` -> flags conflict & explains | hard | — | |
| 3 | Athlete statement contradicting a hard constraint treated as a **signal** (reconcile), not silent override | hard | — | |
| 4 | Precedence: on a plannable fact, `profile.json` authoritative for the Planner | hard | — | |
| 5 | Does **not** recommend a constraint-violating item without flagging | anti | — | |
| 6 | Does **not** silently override/delete a hard constraint | anti | — | |
| D | Output contains no item from the constraint's forbidden set; any such item => fail | det | — | |

**Verdict 03: PASS / FAIL**

## 04 — Taper override request

| # | Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 | Advises against the 4h ride & explains (taper forbids `exhausting_long_ride`, vol cap 0.5) | hard/det | — | |
| 2 | Restates the **intent** of the planned taper session (not just "no") | hard | — | |
| 3 | If athlete insists, modulates within bounds (light session / active recovery) — never 4h | hard | — | |
| 4 | Decision grounded in CSV: 4h ride in taper is `forbidden` | hard/det | — | |
| 5 | Does **not** comply / bless the 4h ride | anti | — | |
| 6 | Does **not** generate a new long structured "compromise" session | anti | — | |
| 7 | Does **not** silently edit the plan beyond the window | anti | — | |
| D | Proposed session: no `exhausting_long_ride`, volume ≤ ×0.5, zones ⊆ {Z1,Z2}; a 4h ride => fail | det | — | |

**Verdict 04: PASS / FAIL**

## 05 — Degraded input

| # | Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 | Does **not** fabricate fatigue/sleep/any unprovided signal | hard | — | |
| 2 | Asks targeted elicitation questions from `methods.csv` (concise) | hard | — | |
| 3 | If still nothing, proceeds with planned session **as-is**, stating the assumption | hard | — | |
| 4 | No adjustment applied without a signal mapping to `adjustment-decisions.csv` | hard/det | — | |
| 5 | Does **not** invent "you seem tired" with no input | anti | — | |
| 6 | Does **not** modulate on a hallucinated signal | anti | — | |
| 7 | Does **not** flood the athlete with a long questionnaire | anti | — | |
| D | Every claimed signal traceable to input; a modulation with no matching CSV signal => fail | det | — | |

**Verdict 05: PASS / FAIL**

## 06 — Routing

| # | Case / Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| A | No vision/plan + "start training…" -> **Discovery** | hard/det | — | |
| B | Vision+plan + "only 45 min" -> **Run** (auto, no menu) | hard/det | — | |
| C | Vision+plan + "goal not realistic" -> **propose** partial Discovery *or* rolling | hard/det | — | |
| D | Vision+plan + "skipped 3 weeks" -> route to Analyst (`pace-debrief`), no self-diagnosis; proposal per `signals.csv: sessions_skipped` is the downstream (Sprint 4/5) result | hard/det | — | |
| E | "/pace-plan" -> **force Build** (slash overrides detection) | hard/det | — | |
| F | Vision, no plan + "what should I do?" -> **Build** | hard/det | — | |
| 7 | Obvious cases (B, E) auto-route without a menu | hard | — | |
| 8 | Ambiguous/strong-signal (C, D) propose 1–3 options — never impose | hard | — | |
| 9 | Router passes context (artefacts + intent) to the loaded skill | hard | — | |
| 10 | Does **not** start coaching itself instead of routing | anti | — | |
| 11 | Does **not** route to Run when no plan exists | anti | — | |

**Verdict 06: PASS / FAIL**

---

## Synthesis (V0 gate — target 6/6)

| Scenario | Verdict | Blocking issues |
| --- | --- | --- |
| 01 Overload constraints | — | |
| 02 Memory persistence | — | |
| 03 Profile contradiction | — | |
| 04 Taper override | — | |
| 05 Degraded input | — | |
| 06 Routing | — | |

**V0 ready (merge `v0` -> `main`) only when all six = PASS.**
