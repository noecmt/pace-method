# 02 — The PACE Method

The heart of PACE: the orchestrator, the modes, the personas (each with its voice), the workflows, and the artefacts that connect them. This is, for endurance, the equivalent of BMAD's agent-personas — not just a prompt pack.

---

## `pace-master` — the orchestrator

Default entry point. It does not coach itself: it **understands the request, detects the mode, proposes the right persona/workflow, passes the context, and loads it.**

Behavior:

1. Read the state (Vision? Plan? current mode?).
2. Detect the mode (Discovery / Build / Run).
3. Route: auto when obvious; otherwise **propose 1-3 options** and let the athlete choose.
4. Pass the context (artefacts + intent) and load the target skill.

> "I have an unexpected change, only 45 min today" -> `pace-master` routes directly to the Daily coach (Run, obvious).
> "I think my goal is no longer realistic" -> `pace-master` proposes: *partial Discovery* (revisit the goal) or *rolling* -> the athlete chooses.

Dual routing: **auto by default + slash commands** (`/pace-discovery`, `/pace-plan`, `/pace-today`, `/pace-debrief`) to force. A deliberate CLI mode, naturally plugin-compatible.

---

## The three modes

| Mode | When | Goal | Artefact produced |
|---|---|---|---|
| **Discovery** | First launch, request, or strong signal | Understand before planning | `vision/vision.md` |
| **Build** | After a validated Discovery, or replanning | Build / refine the plan | `plan/plan.md` |
| **Run** | The everyday (a plan exists) | Execute, explain, adjust | Session + log |

### Triggering an unsolicited Discovery

`pace-master` (via the Analyst) **proposes** (never imposes) a Discovery when a strong signal is detected: goal reached/cancelled, ≥3 weeks of skipped or heavily modified sessions, stagnation/regression, declared life change. The `signals.csv` table defines signal -> proposal.

> "You've systematically modified your threshold sessions for 3 weeks — shall we revisit this block together?"

---

## Personas vs workflows

Distinction taken from BMAD:

- **Persona** = a *who*, with its voice and domain (the coach who explores, the planner, the daily coach). You embody it.
- **Workflow** = a *what* on an artefact (create/edit/validate the vision, the plan, a session). Often invoked by a persona.

Distinct voices are **intentional**: as in BMAD, you always know who you're talking to. No common voice layer.

### Personas

Voice <-> skill mapping (see `05_skill_map.md`):

| Persona (voice) | Skill |
|---|---|
| Discovery coach | `pace-agent-discovery` |
| Planner | `pace-agent-planner` |
| Daily coach | `pace-agent-coach` |
| Analyst / debrief | `pace-debrief` |

**Discovery coach** *(voice: curious, attentive)* — Leads the in-depth conversation. Explores, asks the right questions (via `core-skills/pace-elicitation`), spots contradictions. **Generates neither plan nor session.** Can be restarted *partially* (revising a single aspect). Writes via the `pace-vision` workflow.

**Planner** *(voice: structured, strategic)* — Builds the plan from the vision + the profile + the knowledge, following the rolling horizon. **Does not talk to the athlete** — works on the artefacts. Writes via `pace-plan`; maintains the window via `pace-rolling`.

**Daily coach** *(voice: motivating, concrete)* — The everyday interface. Takes the temperature, **explains why this session today in this block**, decides whether an adjustment is needed. **NEVER generates a session** — it already exists in the plan. This is the most important prohibition in the whole method (boundary defined in "Modulate vs generate" below).

**Analyst / debrief** *(voice: factual, measured)* — Takes the post-session feedback, structures the log, compares planned vs actual, computes drift, emits signals (on track / drift / strong signal). It is **the sole writer of *updates* to `athlete/profile.json`** (the file is first created by the Discovery intake): on a clear signal, it persists a `learned_behavior` there. In V0: minimal declarative (appends a `learned_behavior` from manually entered feedback). In V2: wired to Strava data, **without changing its role**.

### Main workflows

| Workflow | Role | Reads | Writes |
|---|---|---|---|
| `pace-vision` | Create/edit/validate the vision | profile, athlete answers | `vision/vision.md` |
| `pace-plan` | Create/edit/validate the plan | vision, profile, knowledge | `plan/plan.md` |
| `pace-rolling` | Move the window forward (weekly) | plan, recent log | `plan/plan.md` (amended) |
| `pace-checkin` | Explain today's session | plan, session, day's state | short-term log |
| `pace-adjust` | Modulate the planned session | session, `adjustment-decisions.csv` | modulated session |
| `pace-debrief` | Collect feedback, measure | log, plan | log, signals, **`profile.json` (learned_behaviors)** |

---

## Modulate vs generate — the line not to cross

The prohibition "Run NEVER generates a session" only means something if "modulate" is precisely defined. **Modulating** is exactly two operations, and nothing else:

1. **Scale down, within bounds** — reduce the duration or intensity of the planned session *while keeping its intent* (a threshold stays a threshold, shorter or easier). Never scale beyond what the planned session contains.
2. **Substitute with a session from the fixed fallback catalog** — active recovery or rest, defined per phase. The catalog draws on the `key_sessions` of the sport pack (e.g. `recovery_ride` in `cycling.json`), never on an invented structure.

**Forbidden**: composing a new structured session (new intervals, new zones, new format) that the plan does not contain. The "more time" case is *not* an exception: you **extend the existing Z2 block** (duration scaling at constant intent), you do not add a new structure.

`pace-adjust` enforces this boundary by reading `adjustment-decisions.csv`: each action is either a bounded scaling or a fallback-catalog id (see `05_skill_map.md`).

---

## The artefacts (the contracts)

**`vision/vision.md`** — narrative source of truth. **Amended, never rewritten.** Template `assets/vision-template.md`. Sections: athletic self · main goal · real constraints · what works · what doesn't work · relationship to effort · revision history.

**`plan/plan.md`** — the current hierarchical plan:

```
Far horizon    -> season blocks (Base, Build, Taper, Race) — stable
Mid horizon    -> approximate weeks (4-8 wks) — intents, no sessions
Near horizon   -> precise sessions (~2 wks) — type, duration, zones, intervals
```

Hard constraint: not modifiable beyond the immediate window without an explicit, visible change (git diff).

**`athlete/profile.json`** — long-term memory: sport, level, fitness markers (FTP / threshold pace / max HR…), constraints, preferred methods, equipment, `learned_behaviors` (good/bad responses, RPE calibration). **Created once by the Discovery intake** (markers, current level, equipment — seeded only from what the athlete gave); thereafter **updated only by the Analyst**.

**`log/`** — completed sessions, check-ins, debriefs, signals.

### Vision <-> profile.json: allocation and precedence

Both may speak of "constraints" or "what works." To avoid ambiguity:

- **`vision/vision.md`** carries the **human narrative intent** — the *why*, the goal, the relationship to effort. Amended by the Discovery coach, never rewritten.
- **`athlete/profile.json`** carries the **structured / quantitative state** — FTP, phase, constraints usable as data, preferred methods, and the `learned_behaviors`. **Created by the Discovery intake** (which seeds the fitness markers the Planner later turns into the derived `athlete/zones.json`), then updated by the Analyst/debrief.

**Precedence**: on a *plannable* fact (a value, a constraint, a learned behavior), **`profile.json` is authoritative for the Planner**; the Vision provides the meaning, not the data. If the two diverge, that's a signal — the Discovery coach reconciles by amending the Vision, the Analyst corrects `profile.json`.

---

## Typical Run-mode sequence (day D)

```
1. pace-master: loads profile + plan + today's session + recent log
2. Daily coach (pace-checkin): takes the temperature, explains the session
3. If an adjustment is needed -> pace-adjust: reads adjustment-decisions.csv -> modulates
4. Log update
5. (post-session) Analyst (pace-debrief): collects, measures, emits signals
6. If a strong signal -> pace-master proposes partial Discovery or rolling
```

---

## The three extension axes in the method

- **Sport**: switching sport = reading another `knowledge_base/sports/` pack. Personas/workflows are identical.
- **Domain** (nutrition, recovery, mental, strength): a parallel persona/workflow that *reads* Plan/Session and writes its own artefact (`nutrition.md`…). **Never touches the training Plan.**
- **Method**: a pack (Markdown + CSV of session structures). Introduced either by contribution (expansion-pack model) or via a `method-onboarding` workflow (explains -> short trial -> the Analyst measures -> adopt/discard).

---

## What changes vs the old design

- Coded orchestrator -> **`pace-master`**, an orchestrator skill.
- Python agents -> **Markdown personas** with distinct voices + separate **workflows**.
- No more "Session Generator" agent: reactive leftover removed. **No persona generates a session ex nihilo.**
- Fuzzy decisions -> **CSV tables** (adjustment, periodization, signals).

*Last updated: May 2026*
