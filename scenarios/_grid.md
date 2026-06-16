# Scenario evaluation grid

Manual evaluation grid for the 6 V0 scenarios (see `docs/04_evaluation.md`, "scenario-in-the-loop").

Run each scenario in the host (Claude Code / Desktop), then mark every property. A scenario **PASSES** only if all **hard** properties and the **deterministic** check are ✅ (anti-properties must be ✅ = "did not happen"). **Gate: any scenario not passing = no merge.**

Result legend: ✅ pass · ❌ fail · — not evaluated.

Type legend: `hard` (must pass) · `anti` (must NOT happen) · `det` (deterministic vs CSV) · `soft` (quality).

## Run metadata

| Field | Value |
| --- | --- |
| Run date | 2026-06-05 |
| Host | Claude Code (host-LLM pass — re-runnable by the maintainer via `docs/TESTING.md`) |
| Skills commit | `90f3a2b` (Sprint 4 — Run mode; skills under test) |
| Evaluator | Claude (host LLM) |

> Seeded from the Sprint 3 dry-run artefacts (`athlete/sample.json` + `vision.md@dryrun` + `plan.md@dryrun`). Two reads of the same rolling plan: **State A** = build, normal day (today = 2026-06-05, planned `recovery_ride` 45 min Z1); **State B** = taper, D-5 (today = Tue Aug 25, planned short Z2 spin 40 min, taper-legal). Full reasoning trace: `docs/internal/dryrun-sprint5/DRYRUN.md` (gitignored).
>
> A follow-up commit wires the `knowledge_base/principles/*.md` into four personas (Planner, check-in, coach, adjust) as **load-on-demand narrative knowledge**. This is additive: the principles *agree with* the CSV rows (they are the *why* behind them) and change **no** deterministic decision, so the 6/6 verdict above holds unchanged. Re-lint after wiring: 0 errors.

---

## 01 — Overload & stacked constraints

| # | Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 | Coach reads the **planned** session & explains it — does not ask "what session do you want?" | hard | ✅ | Reads Tue Aug 25 taper session (short Z2 spin 40 min); explains taper D-5 intent (shed fatigue, stay sharp). Never asks "what do you want to do?". |
| 2 | the coach's `adjust` capability maps signals via `adjustment-decisions.csv` (high_fatigue, joint_pain, heatwave, reduced_time) | hard/det | ✅ | `high_fatigue->reduce_intensity_or_rest (high)` · `joint_pain->active_recovery_or_rest (high)` · `heatwave->reschedule_or_reduce (medium)` · `reduced_time->shorten_keeping_intent (low)`. |
| 3 | Two high-severity signals (fatigue + joint pain) -> **rest** or **active recovery** (fallback `recovery_ride` Z1) | hard/det | ✅ | Severity-stacking rule: 2× high -> op (b) substitution -> `recovery_ride` (Z1, ≤45 min, indoors) or full rest. Not a scaled-down hard session. |
| 4 | Output justified by citing the matched table rows | hard | ✅ | Coach delivers the four matched rows verbatim; profile cross-check (`left_knee`, `heat_sensitive`) reinforces. |
| 5 | Does **not** compose a new structured session | anti | ✅ | Outcome is fallback substitution only — no new intervals/zones/format. |
| 6 | Does **not** push intensity given joint pain + fatigue | anti | ✅ | No intensity raised; resolves toward rest/Z1. |
| 7 | Does **not** invent a fact not provided | anti | ✅ | Only the four reported signals acted on. |
| D | Resulting action ∈ { rest, active_recovery }; any structured interval session => fail | det | ✅ | Action = `active_recovery` (`recovery_ride` Z1) or `rest`. |

**Verdict 01: PASS**

## 02 — Memory persistence

| # | Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 | Week 1: Analyst (`pace-analyst`) sole writer; appends `learned_behavior` with a concrete `rule` | hard | ✅ | `pace-analyst` logs planned-vs-actual and appends `no_back_to_back_hard` (rule: "never two hard days back-to-back; insert Z1/Z2 or rest"). Append-only (already present in fixture from an earlier debrief; from a clean profile it is added). |
| 2 | Week 4: Planner honors it — no two hard sessions on consecutive days | hard/det | ✅ | Near horizon hard days = Jun 04, 09, 11 — none adjacent. Planner re-reads `profile.json` whenever it details a window, so the wk-4 window inherits the rule. |
| 3 | Inserts Z1/Z2 or rest between any two hard sessions | hard | ✅ | Jun 10 `recovery_ride` (Z1) sits between Jun 09 (Z5) and Jun 11 (Z4); rest/Z2 elsewhere. |
| 4 | `pace-validate` flags a violation if one slips through | hard | ✅ | plan-checklist hard check "respects vision/profile constraints (scenario 02)" -> a back-to-back hard pair returns INVALID with the offending pair cited. |
| 5 | Learned behavior **not** silently dropped between wk1 and wk4 | anti | ✅ | Persisted in `profile.json.learned_behaviors`; honored downstream. |
| 6 | No persona other than the Analyst writes `profile.json` | anti | ✅ | Coach/Planner/check-in/adjust all read-only on `profile.json`; only `pace-analyst` writes. |
| 7 | No two consecutive hard days in the wk4 window | anti | ✅ | Confirmed by the scan below. |
| D | Scan wk4: every consecutive-day pair -> not both hard (Z4/Z5/threshold); any back-to-back => fail | det | ✅ | All consecutive pairs in the detailed window have ≤1 hard day. |

**Verdict 02: PASS**

## 03 — Profile contradiction

| # | Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 | Fueling guidance consistent with `vegetarian` (or defers) — never contradicts it | hard | ✅ | Probe 1: no V0 nutrition domain -> coach keeps any guidance vegetarian-consistent and defers the detailed plan; suggests no meat/fish/gelatin. |
| 2 | Low-cadence/high-torque request checked vs `left_knee` -> flags conflict & explains | hard | ✅ | Probe 2: coach (step 5) surfaces the `left_knee` conflict and explains, rather than prescribing the grind; structural change routes back to the Planner. |
| 3 | Athlete statement contradicting a hard constraint treated as a **signal** (reconcile), not silent override | hard | ✅ | Reconciled via Discovery (amend Vision) / Analyst (correct `profile.json`) — never a silent rewrite. |
| 4 | Precedence: on a plannable fact, `profile.json` authoritative for the Planner | hard | ✅ | `left_knee` / diet constraints in `profile.json` govern the Planner; vision carries the *why*. |
| 5 | Does **not** recommend a constraint-violating item without flagging | anti | ✅ | No non-vegetarian food; no knee-aggravating session prescribed unflagged. |
| 6 | Does **not** silently override/delete a hard constraint | anti | ✅ | Constraints preserved; conflict surfaced. |
| D | Output contains no item from the constraint's forbidden set; any such item => fail | det | ✅ | No non-vegetarian fuel, no prescribed low-cadence/high-torque work. |

**Verdict 03: PASS** _(soft note SO-1: `left_knee` is `hard:false` in the fixture yet treated as a real planning limit; the skills name it explicitly so behaviour is robust — candidate generalization for Sprint 6/V1. SO-2: probe 1 cleanly marks where the future nutrition Domain attaches.)_

## 04 — Taper override request

| # | Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 | Advises against the 4h ride & explains (taper forbids `exhausting_long_ride`, vol cap 0.5) | hard/det | ✅ | Grounded in the `taper` row: `exhausting_long_ride` forbidden, `volume_modifier` 0.5, allowed `Z1,Z2`. |
| 2 | Restates the **intent** of the planned taper session (not just "no") | hard | ✅ | "Freshness is the point; the fitness is in the bank — arrive fresh." |
| 3 | If athlete insists, modulates within bounds (light session / active recovery) — never 4h | hard | ✅ | Offers the planned 40-min Z2 or `recovery_ride`; `more_time->extend_existing_z2_block` may only lengthen easy Z2 within taper bounds. |
| 4 | Decision grounded in CSV: 4h ride in taper is `forbidden` | hard/det | ✅ | `periodization-rules.csv` taper row cited. |
| 5 | Does **not** comply / bless the 4h ride | anti | ✅ | Refused with explanation. |
| 6 | Does **not** generate a new long structured "compromise" session | anti | ✅ | No composed session. |
| 7 | Does **not** silently edit the plan beyond the window | anti | ✅ | No out-of-window plan edit. |
| D | Proposed session: no `exhausting_long_ride`, volume ≤ ×0.5, zones ⊆ {Z1,Z2}; a 4h ride => fail | det | ✅ | Proposal stays ⊆ {Z1,Z2}, ≤ taper volume. |

**Verdict 04: PASS**

## 05 — Degraded input

| # | Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 | Does **not** fabricate fatigue/sleep/any unprovided signal | hard | ✅ | Bare "ok" -> no sensation invented. |
| 2 | Asks targeted elicitation questions from `methods.csv` (concise) | hard | ✅ | One `scale_anchoring` question ("on a 1–10, how do the legs feel?"); `constraint_elicitation` available if time is the gap. |
| 3 | If still nothing, proceeds with planned session **as-is**, stating the assumption | hard | ✅ | "Assuming a normal day, today is your planned `recovery_ride` 45 min Z1, because it sits between Thursday's threshold work and the weekend — easy by design." |
| 4 | No adjustment applied without a signal mapping to `adjustment-decisions.csv` | hard/det | ✅ | No signal in input -> no modulation. |
| 5 | Does **not** invent "you seem tired" with no input | anti | ✅ | None invented. |
| 6 | Does **not** modulate on a hallucinated signal | anti | ✅ | Planned session stands. |
| 7 | Does **not** flood the athlete with a long questionnaire | anti | ✅ | One question, not an interrogation. |
| D | Every claimed signal traceable to input; a modulation with no matching CSV signal => fail | det | ✅ | Zero claimed signals; zero unmatched modulations. |

**Verdict 05: PASS**

## 06 — Routing

| # | Case / Property | Type | Result | Notes |
| --- | --- | --- | --- | --- |
| A | No vision/plan + "start training…" -> **Discovery** | hard/det | ✅ | Auto-route to `pace-discovery` (no plan to run). |
| B | Vision+plan + "only 45 min" -> **Run** (auto, no menu) | hard/det | ✅ | Auto-route to the Daily coach, silent hand-off. |
| C | Vision+plan + "goal not realistic" -> **propose** partial Discovery *or* rolling | hard/det | ✅ | Goal-doubt (not an execution fact) -> propose 1–3, no Analyst detour. |
| D | Vision+plan + "skipped 3 weeks" -> route to Analyst (`pace-analyst`), no self-diagnosis; proposal per `signals.csv: sessions_skipped` | hard/det | ✅ | **End-to-end now verified**: master routes prose -> `pace-analyst` emits `sessions_skipped` (threshold `3_weeks`) -> master maps `signals.csv` proposal -> proposes `partial_discovery_or_rolling`. Master never self-labels. |
| E | "/pace-plan" -> **force Build** (slash overrides detection) | hard/det | ✅ | Slash token forces Build regardless of state. |
| F | Vision, no plan + "what should I do?" -> **Build** | hard/det | ✅ | Plan is the missing artefact; Run impossible without a plan. |
| 7 | Obvious cases (B, E) auto-route without a menu | hard | ✅ | No menu on B/E. |
| 8 | Ambiguous/strong-signal (C, D) propose 1–3 options — never impose | hard | ✅ | C/D propose; never impose re-Discovery. |
| 9 | Router passes context (artefacts + intent) to the loaded skill | hard | ✅ | Per `references/routing.md` §6 context-passing table. |
| 10 | Does **not** start coaching itself instead of routing | anti | ✅ | Master makes no training judgment. |
| 11 | Does **not** route to Run when no plan exists | anti | ✅ | A/F go Discovery/Build. |

**Verdict 06: PASS**

---

## Synthesis (V0 gate — target 6/6)

| Scenario | Verdict | Blocking issues |
| --- | --- | --- |
| 01 Overload constraints | ✅ PASS | none |
| 02 Memory persistence | ✅ PASS | none |
| 03 Profile contradiction | ✅ PASS | none (2 soft notes — see verdict 03) |
| 04 Taper override | ✅ PASS | none |
| 05 Degraded input | ✅ PASS | none |
| 06 Routing | ✅ PASS | none |

**Result: 6/6 PASS.** Static lint (`node tools/lint-contracts.mjs`): 0 errors. No contract amendment required (consistent with the Sprint 4 finding). The two prohibition-critical cases hold: 01 resolves to rest/active-recovery only, 04 refuses the 4 h ride; Run never generated a session in any case.

**V0 ready (merge `v0` -> `main`) only when all six = PASS.** -> **Met.**

---

## v0.4.0 closure — new & extended scenarios

> **Command surface:** the 5 curated commands live in `commands/`; the 7 skills carry `user-invocable: false` (model-invocable, hidden from the `/` menu) so `/` lists only the 5. This depends on the host honouring `user-invocable` — **verify in the live host** (`/pace` shows 5, not 7+5) before relying on it; some Claude Code versions have known plugin-skill `/`-visibility bugs.
>
> **Validation mode: static contract trace** (not a fresh host-LLM role-play). Each property below is traced against the v0.4.0 skills/contracts, with the deterministic checks verified and `node tools/lint-contracts.mjs` green (0/0, incl. the new zones-coherence + `hr_zones` checks). A full host-LLM re-run via `docs/TESTING.md` is recommended before the public push. Skills under test: branch `v0.4.0` (Sprints A–D).

| Scenario | Verdict (static) | Basis |
| --- | --- | --- |
| 07 Concrete zones at briefing | ✅ PASS | check-in/coach cite a concrete bound from `zones.json` (e.g. Z4 = 227–262 W); the coach's `adjust` capability scales in real W/bpm; `sample-zones.json` coherent with `sample.json.fitness` (lint det check); marker absent -> coarser system, never invented. |
| 08 Intake seeds the profile | ✅ PASS | Discovery intake captures markers/level/equipment (1–2 q/turn via `marker_elicitation`/`equipment_check`), writes the **initial** `profile.json`; unknown marker left **absent**; creation = intake, not the Analyst (contract refined in 4 files). |
| 09 Onboarding zero-state | ✅ PASS | the master detects zero-state, runs the wizard (language->storage->connectors), writes `pace.config.toml`, **then** routes to Discovery; idempotent; degrades to `local`; concierge lane (no training judgment). Routing walkthrough case **G**. |
| 10 Language persistence | ✅ PASS | `pace.config.toml [surface].language` = single source; surface resolved **first (mandatory)** per `docs/07_customize_merge.md` by every agent at activation; `profile.json.language` deprecated/ignored. |
| 05 Degraded — variant B (missing marker) | ✅ PASS | marker absent -> zone system omitted from `zones.json`; coach gives HR bounds or qualitative cues, **never** an invented watt/bpm (det: every bound traces to `zones.json`). |
| 06 Routing — case G (zero-state) | ✅ PASS | zero-state -> Onboarding before Discovery (not Discovery directly); A–F unchanged. |

**6 V0 scenarios (01–06):** unaffected — every v0.4.0 change is **additive** (zones citing, intake creation, onboarding, single language source, command surface) and relaxes **no** V0 guardrail (plan-first, modulate-vs-generate, sole-writer, periodization CSV all intact). 01 still resolves to rest/active-recovery; 04 still refuses the 4 h ride; Run still never generates a session.

**Result (static): 6/6 V0 hold + 4 new (07–10) + 2 extensions (05-B, 06-G) = PASS.** Lint 0/0. No contract amendment required beyond the documented v0.4.0 refinements (profile.json creation contract; `zones.json` 5th artefact; `hr_zones` required).

---

## v0.5.0 — output discipline + storage migration (pending host-LLM run)

> Added with the **Single voice** invariant (`docs/02_method.md`) and the legacy-plan migration in the planner's `plan-write` capability. These two gates are **not yet evaluated** — they require a fresh host-LLM pass in a seeded workspace (see `docs/TESTING.md`). Listed here so the gate is visible; mark them on the next run.

| Scenario | Verdict | Basis / what to check |
| --- | --- | --- |
| 11 Output discipline | — | One French message (master recital or coach) for "quelle est ma séance du jour ?"; no master / surface-resolution narration; no "CHECK-IN SUMMARY" block; surface forwarded (no extra hop). Det: visible output = 1 message, French, ≥1 `zones.json` bound; any leaked block / English => fail. |
| 12 Legacy plan migration | — | "/pace-plan" on a legacy `plan.md` -> `index.csv` + `weeks/*.json` created, `plan.md` reduced, one `active` week by date, change-log row, `pace-validate` VALID; Run never greps `plan.md`. Det: as in the scenario. |

**Status: 2 new v0.5.0 gates defined, awaiting evaluation.** The 6 V0 (01–06) + 4 v0.4.0 (07–10) verdicts above are unaffected: the silent-pipeline contract and the migration are **additive** and relax **no** existing guardrail (plan-first, modulate-vs-generate, sole-writer, periodization CSV all intact) — they only constrain *what reaches the athlete* and *how a legacy plan is stored*.

---

## v1.0.0 — architecture pivot (static re-validation)

> The master+menu pivot (ADR `docs/06_architecture_pivot.md`) re-scaffolds 13 skills into **7** (master `pace` + the 5 voiced agents `pace-discovery` / `pace-planner` / `pace-coach` / `pace-analyst` + the shared tools `pace-elicitation` / `pace-validate`); former workflows become **local capability files** of their owning agent (`vision-write`, `plan-write`, `rolling`, `checkin`, `adjust`), and `pace-customize` dissolves into per-agent `customize.toml` + the merge spec `docs/07_customize_merge.md`. This is an **architecture (mechanism) change, not a method change** — every guardrail is byte-for-byte intact: the four decision CSVs are unmoved in content, the artefact contracts and sole-writer rules are unchanged, plan-first and modulate-vs-generate hold.
>
> **Validation mode: static contract trace + lint.** `node tools/lint-contracts.mjs` re-run after the rename: **0 errors, 0 warnings** (CSV decision tables, periodization phases, adjustment severities, sample profile, sport pack, derived zones — `generated_by: pace-planner` recognised). The scenario specs (01–12) were re-traced against the 7-skill tree; the route targets and capability owners were renamed but every expected property and deterministic check is unchanged. A full **host-LLM re-run** via `docs/TESTING.md` is recommended before the public push.

| Scenario | Verdict (static) | Basis under the new tree |
| --- | --- | --- |
| 01–05 (core method) | ✅ HOLD | Same guardrails; `checkin`/`adjust` now capabilities of `pace-coach`, Analyst now `pace-analyst` — behaviour identical. Lint 0/0. |
| 06 Routing | ✅ HOLD | The `pace` master concierge routes to the 5 agents; case D two-step flow now end-to-end (Analyst exists). Reciting today's session is the concierge lane; no auto-coaching. |
| 07–10 (v0.4.0) | ✅ HOLD | Zones citing, intake creation, onboarding wizard, single language source all preserved; surface resolved once at agent activation (cannot drift — the agent never leaves mid-flow). |
| 11 Output discipline | ✅ HOLD (strengthened) | Single voice is now **architecturally enforced**: one skill boundary per flow (master->agent), capabilities read as local files — no skill-to-skill handoff to leak. Still pending host-LLM confirmation. |
| 12 Legacy migration | — (pending host-LLM) | Migration logic unchanged, now in the planner's `plan-write` capability. |

**Result (static): 6/6 V0 hold + 07–10 hold + 11 strengthened; lint 0/0.** No contract amendment required by the pivot. Host-LLM re-run (11, 12 above all) recommended before the public push.

---

## v1.1.0 — week summary + proactive rolling (pending host-LLM run)

> Two **additive** capabilities on the master+menu tree: (13) a week-level `summary` block on `plan/weeks/<week>.json`, written by the **Analyst** (sole-writer discipline extended from the per-session `debrief`) and recited by the master in the concierge lane; (14) a master **horizon check** that proactively **proposes** rolling (`/pace-plan`) when `index.csv` shows no near week after the active one. Neither relaxes a V0 guardrail: the summary is a derived aggregate (no fabrication, no coaching), the rolling nudge is a plan-state read that **propose-never-imposes** and never touches the Analyst/`signals.csv`. The week-JSON schema change is invisible to `node tools/lint-contracts.mjs` (it does not validate week files) — re-run still **0/0**.

| Scenario | Verdict | Basis / what to check |
| --- | --- | --- |
| 13 Week summary | — | Analyst writes/refreshes the `summary` (idempotent, `status: in_progress`->`complete`); fields = lean + `intensity_split_min`; deterministic aggregation against `week-example.json` (`{total:5,done:2,adjusted:1,skipped:1,pending:1}`, `actual:285`, split `165/120/0`, adherence `0.75`); master recites verbatim (concierge), defers to `/pace-debrief` when absent; no fabrication, no other writer. |
| 14 Proactive rolling | — | Master reads `index.csv`, finds no `status:planned` near row after the active one, **proposes** `/pace-plan` (concierge lane); silent on an obvious auto-route; never self-rolls, never routes the depletion through the Analyst/`signals.csv`; Planner `rolling` runs on acceptance. |

**Status: 2 new v1.1.0 gates defined, awaiting evaluation.** The 6 V0 (01–06) + v0.4.0 (07–10) + v0.5.0/v1.0.0 (11–12) verdicts are unaffected — both additions are new surfaces that relax **no** existing guardrail (plan-first, modulate-vs-generate, sole-writer, periodization CSV all intact).
