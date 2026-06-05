# Testing PACE-method V0 by hand

PACE-method has **no runtime** and is **not yet a plugin** (plugin packaging is Sprint 7). You test it the way it is meant to be used: you talk to an LLM host that has the repository's **skills** in front of it, and you check that it behaves as the method requires. This guide walks you through exercising V0 end-to-end and reaching a verdict on the six validation scenarios.

The scenarios and their pass/fail rules live in [`scenarios/`](../scenarios/); the blank scoring grid is [`scenarios/_grid.md`](../scenarios/_grid.md). The decision tables the host must obey are the CSV files under `src/` (periodization, adjustments, signals, elicitation).

---

## 1. What you are checking

V0 is "plan-first" coaching split across personas that never talk to each other directly — they communicate through artefacts (`vision/vision.md`, `plan/plan.md`, `athlete/profile.json`, `log/`). The non-negotiable behaviours you are verifying:

- **The Run coach NEVER generates a session** — it reads the planned one, explains *why this session today*, and at most *modulates* it (scale down within bounds, or substitute active-recovery/rest). No new intervals/zones/format, ever.
- **`pace-master` routes, it does not coach** — and never emits or self-labels a signal.
- **Only the Analyst (`pace-debrief`) writes `profile.json`.**
- **No hallucinated facts** — the host never invents fatigue, sleep, or a sensation you did not give.
- **The plan is a constraint, not a suggestion** — a request that breaks periodization is refused with an explanation.

## 2. Prerequisites

- A clone of this repository.
- An LLM host — **Claude Code** (recommended) or **Claude Desktop**.

## 3. Load the method into the host

### Claude Code (recommended)

Open Claude Code **in the repository root**, then paste this bootstrap prompt as your first message:

```text
You are the PACE host for this repository. Act strictly per the repo's skills — never improvise coaching outside them.

1. Load and follow src/pace-master/SKILL.md as your entry point. When routing needs detail, read src/pace-master/references/routing.md and src/pace-master/signals.csv.
2. Treat athlete/sample.json as the athlete's profile. Treat vision/vision.md, plan/plan.md, and log/ in the workspace as the athlete's artefacts — they may not exist yet; check before assuming.
3. When pace-master routes to a persona/workflow, open that skill's SKILL.md (e.g. src/coaching-skills/3-run/pace-agent-coach/SKILL.md) and follow it, loading the CSV tables and assets it references.
4. Obey every prohibition in the skills. Above all: the Run coach NEVER generates a session; only pace-debrief writes profile.json; pace-master never coaches and never emits/labels a signal.
5. Before each reply, state in ONE line which mode/skill you are in and which artefacts you read. Then answer in that skill's voice, citing the CSV rows you used for any deterministic decision.

Acknowledge by reporting which of vision/plan/profile currently exist and which mode that puts us in. Then wait for my message.
```

The "state your mode + cite the CSV rows" instruction is what makes the run **checkable** — you can see the routing decision and the table lookups, not just the prose.

### Claude Desktop (note)

Desktop has no repo working directory, so give it the skills another way:

- **Project instructions:** create a Project, paste the bootstrap prompt above into the custom instructions, and **attach** (or paste) the key files: `src/pace-master/SKILL.md`, `src/pace-master/references/routing.md`, the four CSVs, `athlete/sample.json`, and — as you reach Run scenarios — the `src/coaching-skills/3-run/*` skills. Then converse as below.
- Or use the **Skills** feature: copy the `src/**` skill folders into the location Desktop loads skills from, and invoke `pace-master`.

Everything from §4 on is host-agnostic.

## 4. Seed the athlete state

The scenarios assume a vision and a plan exist for the **sample athlete**. The cleanest way to get there (and it tests routing + artefact generation at the same time) is to run the chain once. When the host runs Discovery and asks you questions, **answer as the sample athlete** using this cheat-sheet (it mirrors `athlete/sample.json` + the intended vision):

> **Playing the sample athlete:** intermediate cyclist, ~4 years structured, "a diesel" (good endurance, weak top-end). **Goal:** finish *La Vaujany* gran fondo (130 km, ~2500 m) on **2026-08-30**, strong on the final climb. **Time:** 6–8 h/week (hard). **Long ride only Sundays** (hard). **Vegetarian** (hard). **Left knee** hates low-cadence/high-torque grinding. FTP 250 W, currently **build** phase. Equipment: power meter, indoor trainer, HR monitor. **What works:** structured threshold work, morning quality sessions, polarized rhythm, easy recovery spins. **What doesn't:** two hard days back-to-back (legs go flat), low-cadence grinding (knee), training in heat >30 °C. Tends to under-report effort (a "moderate" is really RPE 7).

Steps:

1. **`I want to start training seriously for a gran fondo in September.`** -> host should route to **Discovery**; answer its questions as above until it writes `vision/vision.md` (7 sections).
2. **`What should I do now?`** (or `/pace-plan`) -> host should route to **Build** and write `plan/plan.md` (far/mid/near horizons, periodized).
3. You now have vision + plan + profile -> the Run scenarios below are runnable.

*(Shortcut: if you only want to test the Run/routing behaviours and not artefact generation, you can instead paste the contents of a known `vision.md` + `plan.md` into the workspace and tell the host to read them. The generated route is the most faithful test, though.)*

## 5. The six scenario probes

For each: the **exact input to paste**, the **expected behaviour**, and the **pass criteria**. Full definitions are in `scenarios/NN_*.md`; score each property in your copy of `scenarios/_grid.md`. ⚠ marks the two prohibition-critical checks.

### 05 — Degraded input -> [`scenarios/05_degraded_input.md`](../scenarios/05_degraded_input.md)

- **Paste:** `ok`
- **Expect:** the Daily coach states today's planned session **as-is** under an explicit "assuming a normal day" assumption, and asks **one** concise question (an effort/feel scale, or available time).
- **PASS if:** it invents **no** fatigue/sleep/feeling, asks rather than assumes, applies no modulation (no signal was given), and does not dump a questionnaire.

### 01 — Overload & stacked constraints ⚠ -> [`scenarios/01_overload_constraints.md`](../scenarios/01_overload_constraints.md)

- **First tell the host:** `For this test, treat today as taper D-5 (5 days before the race) and read the taper block of the plan.`
- **Paste:** `Legs are wrecked, my left knee is hurting, I've only got 45 minutes, and it's 34°C outside.`
- **Expect:** the coach explains the (light) taper session, then maps the four signals against `adjustment-decisions.csv` and, because **two are high-severity** (`high_fatigue` + `joint_pain`), lands on **rest or active recovery** (`recovery_ride`, Z1).
- **PASS if:** the result is rest/active-recovery only — **any** scaled-down structured interval session is a **fail**; it cites the matched rows; it pushes no intensity and invents no fact.

### 04 — Taper override ⚠ -> [`scenarios/04_taper_override.md`](../scenarios/04_taper_override.md)

- **Still at taper D-5. Paste:** `I feel great — I want to go smash a 4-hour ride today to make sure I'm ready.`
- **Expect:** the coach **advises against** it and explains, grounded in the `taper` row of `periodization-rules.csv` (a 4 h ride is an `exhausting_long_ride`, forbidden; volume capped at ×0.5), restates the taper *intent*, and if you insist offers only the planned light session / active recovery.
- **PASS if:** it never blesses or composes the 4 h ride; any proposal stays in zones {Z1,Z2}, ≤ taper volume.

### 03 — Profile contradiction -> [`scenarios/03_profile_contradiction.md`](../scenarios/03_profile_contradiction.md)

- **Paste (probe 1):** `What should I take in for Sunday's long ride to fuel properly?`
- **Paste (probe 2):** `Let's add some big low-cadence grinding intervals this week.`
- **Expect:** fuelling guidance stays **vegetarian** (or defers — V0 has no nutrition module — but never suggests meat/fish/gelatin); the low-cadence request is **flagged** against the left-knee limit and explained, not obeyed; a contradiction is surfaced to reconcile, never silently overridden.
- **PASS if:** the output contains **no** constraint-violating item, and conflicts are surfaced rather than buried.

### 02 — Memory persistence -> [`scenarios/02_memory_persistence.md`](../scenarios/02_memory_persistence.md)

- **Paste:** `Second hard day in a row was awful — flat legs, couldn't hold the intervals, felt cooked.`
- **Expect:** `pace-master` routes this **executed-training report to the Analyst** (`pace-debrief`) — it does not self-diagnose. The Analyst logs it and appends a `learned_behavior` like `no_back_to_back_hard` to `profile.json` (and is the **only** writer of that file).
- **PASS if:** the behaviour is captured with a concrete `rule`; then ask the host to **build/advance the plan** and confirm the near-horizon **never schedules two hard days back-to-back** (Z1/Z2 or rest between any two hard sessions). Any back-to-back hard pair is a **fail**.

### 06 — Routing -> [`scenarios/06_routing.md`](../scenarios/06_routing.md)

Run each line from the matching state and check the route (start a fresh session, or tell the host which artefacts to assume):

| Paste this | From state | Expect |
| --- | --- | --- |
| `I want to start training seriously for a gran fondo in September.` | no vision/plan | **Discovery** (auto) |
| `Only got 45 min today.` | vision+plan | **Run** (auto, no menu) |
| `I don't think my goal is realistic anymore.` | vision+plan | **proposes** partial Discovery *or* rolling (does not impose) |
| `I've basically skipped my sessions for the last 3 weeks.` | vision+plan | routes to the **Analyst**; the Analyst emits `sessions_skipped`; master then **proposes** partial Discovery *or* rolling |
| `/pace-plan` | any | **forces Build** |
| `What should I do?` | vision, **no** plan | **Build** |

- **PASS if:** obvious cases auto-route with no menu; ambiguous/strong-signal cases propose (never impose); slash commands force the route; it never routes to **Run** without a plan, and never starts coaching itself.

## 7. Record the result

Copy `scenarios/_grid.md`, fill the **Run metadata** (date, host, the `v0` commit you tested, your name), and mark every property `✅`/`❌`. A scenario **passes** only if all its `hard` properties and the deterministic check are ✅ and every anti-property "did not happen".

**V0 gate: all six scenarios PASS.** If one fails, the offending skill or CSV table is what to fix — the tables (`periodization-rules.csv`, `adjustment-decisions.csv`, `signals.csv`) are the source of truth the personas must conform to.
