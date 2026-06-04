# routing.md — pace-master decision procedure

Loaded on demand by `pace-master`. This is the detailed logic behind the four-step behavior: read state -> detect mode -> pick a lane -> pass context. The worked walkthrough at the end is also the **static test trace** for `scenarios/06_routing.md`.

---

## 1. Read state

Check the athlete repo for the three persistent artefacts:

| Artefact | Present means |
| --- | --- |
| `vision/vision.md` | Discovery has happened at least once. |
| `plan/plan.md` | A plan exists -> Run is possible. |
| `athlete/profile.json` | Structured long-term state (FTP, phase, constraints, `learned_behaviors`). Test fixture: `athlete/sample.json`. |

State drives what is *possible*: **no `plan/plan.md` => Run is off the table.**

## 2. State × intent matrix

| Vision? | Plan? | Athlete intent | Mode / route |
| --- | --- | --- | --- |
| no | no | wants to start / has a goal | **Discovery** |
| yes | no | "what now?" / ready to train | **Build** |
| yes | yes | about today's planned session, time, feeling *now* | **Run** (Daily coach) |
| yes | yes | reports on **executed** training / physical state | **Debrief** (Analyst) |
| yes | yes | doubts the **goal** / situation changed | **Propose**: partial Discovery *or* rolling |
| any | any | message contains a `/pace-*` token | **Force** that route (overrides all the above) |

## 3. Lane selection

Decide *how* to act, in this order. The governing line: **state facts about the system and the existence/location/summary of artefacts directly; the moment a reply needs a training judgment (what to do, why, how hard, is it safe), route.**

1. **Concierge (answer directly).** The request is meta / navigation / read-only state and needs no training judgment. Examples: capabilities, where an artefact is, which mode is active, a plain summary of `profile.json`. -> Answer; load no persona.
2. **Auto-route (silent, one hop).** The coaching intent is unambiguous and a single route clearly applies. -> Load that skill, pass context, let it take over. No menu, no ceremony.
3. **Propose 1–3.** Genuine ambiguity between real routes, or a strong signal. -> Offer 1–3 options; the athlete chooses. Never impose. If the input is only *vague* (not a true fork), ask **one** aiguillage question instead of loading a persona speculatively.

## 4. Slash-command force table

A literal token forces the route regardless of detection (V0: recognised in plain text; no registered plugin command until Sprint 7).

| Token | Forces | Notes |
| --- | --- | --- |
| `/pace-discovery` | Discovery | even if a vision already exists (partial re-Discovery). |
| `/pace-plan` | Build | even if no vision yet — but the Planner will then bounce back if its vision input is missing. |
| `/pace-today` | Run (Daily coach) | requires a plan; if none, say so and fall back to Discovery/Build. |
| `/pace-debrief` | Debrief (Analyst) | hands raw feedback to the Analyst to structure + emit signals. |

## 5. Strong-signal flow (the two-step Analyst path)

`pace-master` **does not pattern-match prose into a signal id.** Signals are the Analyst's vocabulary. The flow has two distinct steps:

```text
Athlete reports an execution/state fact (prose)
        │
        ▼
[pace-master]  classify -> "this is executed-training/state" -> ROUTE to pace-debrief
        │                                   (master does NOT label the signal)
        ▼
[pace-debrief / Analyst]  structure the feedback -> emit a structured signal into log/
        │                 (sole writer of signals & profile.json)
        ▼
[pace-master]  read the emitted signal -> map via signals.csv (proposal column) -> PROPOSE
        │                                                   (never impose)
        ▼
Athlete chooses (e.g. partial Discovery vs rolling)
```

`signals.csv` columns split by reader:

- `threshold` — **Analyst-facing**: when an observation is worth emitting (e.g. `3_weeks`).
- `proposal` — **master-facing**: what to propose once the signal exists.

> Sprint sequencing: `pace-debrief` is built in Sprint 4. Until then, the **master-side** behaviour that Sprint 2 must get right is the *first* step — correctly **routing an execution/state fact to the Analyst** instead of self-diagnosing. The downstream proposal is verified end-to-end at Sprint 4/5.

## 6. Context passing

When routing, hand the loaded skill a compact context bundle:

| Route | Artefacts handed over | Plus |
| --- | --- | --- |
| Discovery | `vision/vision.md` (if any), `athlete/profile.json` | intent; whether it's a full or partial re-Discovery |
| Build | `vision/vision.md`, `athlete/profile.json`, sport pack | intent; what changed |
| Run | `plan/plan.md` + today's session, recent `log/`, `athlete/profile.json` | intent; any stated constraint (time, feeling) |
| Debrief | `plan/plan.md` (planned vs actual), recent `log/`, `athlete/profile.json` | the raw feedback verbatim |

Always include: the athlete's intent in one line, and any slash-force or proposal choice that selected the route.

---

## 7. Worked walkthrough — `scenarios/06_routing.md` (test trace)

Each case traced through the procedure above; the result must match the scenario's expected route.

- **A — no vision, no plan, "start training for a gran fondo in September."** State: nothing exists. Intent: a goal, forward-looking. Matrix -> **Discovery**. Lane: auto-route (obvious, no plan to run). ✅ Discovery.

- **B — vision + plan, "only got 45 min today."**
  State: plan exists. Intent: about *today's* execution constraint, needs a training judgment. Matrix -> **Run**. Lane: auto-route (obvious), silent hand-off to the Daily coach. ✅ Run, no menu.

- **C — vision + plan, "I don't think my goal is realistic anymore."** Intent: a **doubt about the goal** (not an executed-training fact). Matrix -> propose partial Discovery *or* rolling. Lane: **propose 1–3** (genuine fork). ✅ Proposes, never imposes. No Analyst detour (this is goal-intent, not an execution fact).

- **D — vision + plan, "I've basically skipped my sessions for the last 3 weeks."** Intent: a fact about **executed training**. Classification -> Analyst's domain. Matrix -> **Debrief**. Lane: route to `pace-debrief`; master does **not** label `sessions_skipped` itself. The Analyst emits the signal; master then maps `signals.csv: sessions_skipped -> partial_discovery_or_rolling` and **proposes**. **Sprint-2 pass criterion: routes to the Analyst without self-diagnosing.** ✅ (downstream proposal verified at Sprint 4/5).

- **E — any state, "/pace-plan".** Slash token present. Force table -> **Build**, overriding detection. ✅ Forced Build.

- **F — vision exists, no plan, "what should I do?"** State: vision yes, plan no. Intent: ready to proceed. Matrix -> **Build** (the plan is the missing artefact; Run is impossible without a plan). Lane: auto-route. ✅ Build.

**Anti-properties to keep:** never start coaching instead of routing; never impose re-Discovery on a signal; never route to Run when no plan exists.
