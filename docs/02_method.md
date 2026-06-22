# 02 — The PACE Method

The heart of PACE: the master concierge, the modes, the voiced agents, the capabilities that make up each flow, and the artefacts that connect them. This is, for endurance, the equivalent of BMAD's agent-personas — not just a prompt pack.

> Updated 2026-06 to the **master-concierge + menu-of-voiced-agents** model (see `06_architecture_pivot.md`). The method invariants are unchanged; what changed is the *mechanism* — former workflows are now local capability files of their owning agent, not separate skills, and there is no skill-to-skill handoff.

---

## `pace` — the master concierge

Default entry point. It does not coach itself: it **reads the state, detects the mode, renders an intent menu when ambiguous, and then either answers directly or hands off to exactly one agent.**

Behavior:

1. Read the state (Vision? Plan? current mode?).
2. Detect the mode (Discovery / Build / Run).
3. When the intent is ambiguous, render a **ChatGPT-style intent menu** + a "talk freely" escape hatch:
   1. My session today · 2. My goals / situation have changed · 3. Debrief a session · 4. (Re)build my plan · 5. Talk freely.
4. **Concierge lane** — answer directly, launch no agent: recite today's planned session, recite the week `summary` ("summarize my week"), say where the plan/profile lives, report the current mode.
5. **Route lane** — sure -> launch the agent directly; unsure -> propose 1–3 and let the athlete choose. Forward the context bundle and cross the one skill boundary (master -> agent).

> "What's my session today?" -> the master **recites** the planned session itself (concierge lane, 0 agents). If the athlete then asks *why* this session, or wants it *modulated* -> the master escalates to `pace-coach`.
> "I have an unexpected change, only 45 min today" -> route directly to `pace-coach` (Run, obvious).
> "I think my goal is no longer realistic" -> propose *partial Discovery* (revisit the goal) or *rolling* -> the athlete chooses.

Reciting the planned session — or the stored week `summary` — is a **factual read, not a training judgment** — that is what keeps it inside the master's neutral remit (the master recites the `summary`; it never *computes* it — that is the Analyst's). The first whiff of *why / how hard / is it safe / modulate* is the boundary at which it escalates to `pace-coach`.

Dual routing: **auto/menu by default + slash commands** (`/pace-discovery`, `/pace-plan`, `/pace-today`, `/pace-debrief`) to force. A deliberate CLI mode, naturally plugin-compatible.

---

## The three modes

| Mode | When | Goal | Artefact produced |
|---|---|---|---|
| **Discovery** | First launch, request, or strong signal | Understand before planning | `vision/vision.md` |
| **Build** | After a validated Discovery, or replanning | Build / refine the plan | `plan/plan.md` |
| **Run** | The everyday (a plan exists) | Execute, explain, adjust | Session lifecycle + week `summary` on `weeks/*.json` (+ `log/signals.md`) |

### Triggering an unsolicited Discovery

The master (reading the signals the Analyst emitted) **proposes** (never imposes) a Discovery when a strong signal is on the ledger: goal reached/cancelled, ≥3 weeks of skipped or heavily modified sessions, stagnation/regression, declared life change. The `signals.csv` table defines signal -> proposal.

> "You've systematically modified your threshold sessions for 3 weeks — shall we revisit this block together?"

### Proactively proposing rolling (plan-horizon depletion)

A **second proposal source**, read from plan state rather than from a signal: when the master reads `plan/index.csv` and finds **no near week planned after the active one** (the precise window is depleted), it **proposes** advancing the plan — a one-line `/pace-plan` (rolling) nudge in the concierge lane. This is **not** a signal (it never goes through the Analyst or `log/signals.md`); it is a plan-state fact the master reads itself. Propose, never impose; surfaced at a concierge moment, never stapled onto an auto-route to a voiced agent.

> "I see next week isn't planned yet — run `/pace-plan` and I'll extend your plan (rolling)."

---

## Agents and their capabilities

The pivot replaces "personas + separate workflow skills" with **voiced agents that own their workflow internally**:

- An **agent** = a *who*, with its voice and domain, that **stays the single active voice for its whole flow**. You embody it.
- A **capability** = a *what* on an artefact (create/edit/validate the vision, write the plan, brief a session, modulate it). It is **a local file the active agent reads** into the same context — *not* a separate skill, *not* a voice change, *not* a handoff. (BMAD's `prompt = "Read and follow {skill-root}/x.md"`.)

Distinct voices are **intentional** and now *architecturally enforced*: as in BMAD, you always know who you're talking to, because the agent never leaves mid-flow. Only two genuinely heavy, shared utilities stay separate skills and are called **as tools** while the agent keeps its voice: `pace-elicitation` and `pace-validate`.

### The agents

Voice <-> skill mapping (see `05_skill_map.md`):

| Agent (voice) | Skill | Owned capabilities (local files) |
|---|---|---|
| Discovery coach (curious, attentive) | `pace-discovery` | vision-write |
| Planner (structured, strategic) | `pace-planner` | plan-write, rolling |
| Daily coach (present, grounded) | `pace-coach` | checkin, adjust |
| Analyst (factual, neutral) | `pace-analyst` | profile/signals logic |

**Discovery coach** *(voice: curious, attentive)* — Leads the in-depth conversation. Explores, asks the right questions (calling `pace-elicitation` as a tool), spots contradictions. On a brand-new athlete it runs the intake that seeds `athlete/profile.json`. **Generates neither plan nor session.** Can be restarted *partially* (revising a single aspect). When the picture is complete it writes/amends `vision/vision.md` by following its **vision-write** capability file (validated via `pace-validate`).

**Planner** *(voice: structured, strategic)* — Builds the plan from the vision + the profile + the knowledge, following the rolling horizon. **Does not talk to the athlete** in the conversational sense — it is launched in Build mode, works on the artefacts, and reports back. Writes `plan/plan.md` + `plan/weeks/*.json` via its **plan-write** capability; advances the near window via its **rolling** capability. Both conform to `periodization-rules.csv` and are validated via `pace-validate`.

**Daily coach** *(voice: present, grounded)* — The Run-mode interface. Reads the planned session, **explains why this session today in this block** (its **checkin** capability, which writes the session's `rationale`), and decides whether a modulation is needed (its **adjust** capability, which reads `adjustment-decisions.csv`). **NEVER generates a session** — it already exists in the plan. This is the most important prohibition in the whole method (boundary defined in "Modulate vs generate" below).

**Analyst** *(voice: factual, neutral)* — Takes the post-session feedback, writes the `debrief` on the session object, compares planned vs actual, computes drift, emits strong signals to `log/signals.md` (on track / drift / strong signal). It is **the sole writer of *updates* to `athlete/profile.json`** (the file is first created by the Discovery intake): on a clear signal, it persists a `learned_behavior` there, and **fully regenerates `athlete/zones.json`** when a fitness marker changes. In V0: minimal declarative (appends a `learned_behavior` from manually entered feedback). In V2: wired to Strava data, **without changing its role**.

### The capabilities (former workflows, now local files)

| Capability | Owning agent | Role | Reads | Writes |
|---|---|---|---|---|
| vision-write | `pace-discovery` | Create/edit/validate the vision | profile, athlete answers | `vision/vision.md` |
| plan-write | `pace-planner` | Create/edit/validate the plan | vision, profile, KB | `plan/plan.md`, `weeks/*.json` |
| rolling | `pace-planner` | Move the near window forward | plan, recent `weeks/*.json` | `plan/plan.md` (amended), `weeks/*.json` |
| checkin | `pace-coach` | Explain today's session | plan, session, day's state | session `rationale` (`weeks/*.json`) |
| adjust | `pace-coach` | Modulate the planned session | session, `adjustment-decisions.csv` | session `adjustment` (`weeks/*.json`) |
| (analyst core) | `pace-analyst` | Collect feedback, measure | `weeks/*.json`, plan | session `actual`+`debrief` + week `summary`, `log/signals.md`, `profile.json` (learned_behaviors), `zones.json` |

None of these is a skill boundary: the owning agent *reads the file and follows it* without changing voice.

---

## Modulate vs generate — the line not to cross

The prohibition "Run NEVER generates a session" only means something if "modulate" is precisely defined. **Modulating** is exactly two operations, and nothing else:

1. **Scale down, within bounds** — reduce the duration or intensity of the planned session *while keeping its intent* (a threshold stays a threshold, shorter or easier). Never scale beyond what the planned session contains.
2. **Substitute with a session from the fixed fallback catalog** — active recovery or rest, defined per phase. The catalog draws on the `key_sessions` of the sport pack (e.g. `recovery_ride` in `cycling.json`), never on an invented structure.

**Forbidden**: composing a new structured session (new intervals, new zones, new format) that the plan does not contain. The "more time" case is *not* an exception: you **extend the existing Z2 block** (duration scaling at constant intent), you do not add a new structure.

The **adjust** capability enforces this boundary by reading `adjustment-decisions.csv`: each action is either a bounded scaling or a fallback-catalog id (see `05_skill_map.md`).

---

## Single voice — one message per turn

The athlete must experience **one coach, one message** per turn. In the new model this is no longer a fragile "silent handoff between skills" to be maintained — it is **enforced by the architecture**: a flow crosses one skill boundary (master -> agent), then the chosen agent stays the single active voice and pulls in its steps by reading local files. Reading a capability file is not a voice change; calling `pace-elicitation`/`pace-validate` as a tool is not a voice change.

**What "crossing the boundary" means mechanically.** There is no runtime that transfers the conversation to another skill (Claude Code / the Agent SDK have no such primitive — `06_architecture_pivot.md` §2). So "route to the agent" = the master **`Read`s the agent's `SKILL.md` (+ the named capability file) into the same turn and continues acting as that agent** until its result message is produced. It is a **silent context load, not a delegation**: the master never narrates a handoff and never ends its turn on the route decision. (A turn that prints "🔄 handing off to the Planner… waiting for its reply" and stops — leaving `plan-write` un-run — is exactly the bug this enforces against; the master's `references/routing.md` §0 carries the rule and an anti-example.)

The only thing rendered to the athlete each turn is the **single message of the agent that owns the conversation**, in `[surface].language`, at the configured verbosity. Concretely:

- **No skill narrates its own machinery** — not "I'm the master, let me read your state", not "routing you to the coach", not "Reading surface configuration…". The athlete sees the answer, not the plumbing.
- **A capability has no voice of its own and no user-facing output** — its rationale, validation report, written artefact, or internal result is read and rendered by the owning agent. It never prints a summary block, a table, or a "SUMMARY FOR …" section to the athlete.
- **Language-first**: the owner resolves `[surface]` from its `customize.toml` **once, at activation**, and its *first token* is already in `[surface].language` — never an English preamble that later "switches". Because the agent never leaves, language cannot drift across the flow.

This is a hard invariant, on the same footing as plan-first and modulate-vs-generate. A turn whose visible output contains routing narration, a capability's internal result, or a language that contradicts `[surface]` is a **bug** — the regression seen when a one-line "what's my session today?" returned a page of English orchestration logs.

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

**`athlete/profile.json`** — long-term memory: the athlete's **`sports`** (a list — one discipline for a mono-sport athlete, three for a triathlete), level, programme `current_phase`, fitness markers **keyed by discipline** (`fitness.<sport>`: FTP / threshold pace / CSS / max HR…), constraints, preferred methods, equipment, `learned_behaviors` (good/bad responses, RPE calibration). **Created once by the Discovery intake** (markers, current level, equipment — seeded only from what the athlete gave); thereafter **updated only by the Analyst** (into the correct discipline). The programme is the athlete (one `current_phase`); the discipline is the session.

**`athlete/zones.json`** — the **derived artefact**: the athlete's intensity zones precompiled into **concrete bounds** (watts / bpm / pace), **keyed by discipline** under `by_discipline`, from the `profile.json` fitness markers + the sport pack's zone percentages. **Never hand-edited.** Written by the **plan-write** capability (first creation, at Build) and **fully regenerated** by the Analyst when a marker changes — never patched partially, so each change is a visible diff. Each discipline's `fitness_markers` must always equal `profile.json.fitness.<discipline>` (`pace-validate` rejects a plan whose zones are stale). A marker that is **absent** ⇒ its zone system is omitted for that discipline (no invented value). This is what lets the Run coach hold the athlete to real numbers instead of vague zone labels.

**The session is the single home for its whole lifecycle.** The executed-training record is **not** a separate `log/` of Markdown debriefs — it lives **on the session object** in `plan/weeks/<week>.json`, which accumulates as immutable history (the **rolling** capability never overwrites a past week). Each session is keyed by **`id` (`<date>-<slot>`)**, not by `date` alone — a single day may hold **several sessions** (a brick, a two-a-day): each is its own entrainable unit with its own intent, load, and debrief, distinguished by `slot` (`am`/`pm`) and carrying its own **`sport`** (discipline). A warm-up is *not* a session — it is a segment inside `planned.structure`. One object carries everything about a session: its `planned` description (with a metric-agnostic **`target`** — `{metric, zone_ref, range}`, the bounds copied from `zones.json`), its `rationale` (the brief — **checkin**), its `actual` (the Analyst), its `debrief` (`{read, verbatim, notes}` — the Analyst), and its `adjustment` (**adjust**, only if modulated). These Run-mode fields are **absent until they apply** (lean & conditional — no empty placeholders), filled **in place**; the numbers stay in `planned`/`actual` (never re-tabulated). The canonical schema + a worked example covering every state lives in `src/pace-planner/assets/week-example.json`; the frozen contract is `extensions/_artefact_schema.md`.

**`log/signals.md`** — the **cross-session signals ledger.** It is append-only, written **only by the Analyst** and **only when** a `signals.csv` threshold fires (one dated bullet: `- signal: <id> · evidence · date · open|addressed`). The four signals are inherently cross-session (a 3-week skip, 4-week stagnation, a `life_change`, a `goal_reached_or_cancelled`) — they belong to no single session, so they live in the ledger, not on a session object. This ledger is what the master reads to map an emitted signal to a *proposal*. Prose in `[surface].language`; contract tokens (`signal:` ids, `status` words) literal.

### Vision <-> profile.json: allocation and precedence

Both may speak of "constraints" or "what works." To avoid ambiguity:

- **`vision/vision.md`** carries the **human narrative intent** — the *why*, the goal, the relationship to effort. Amended by the Discovery coach, never rewritten.
- **`athlete/profile.json`** carries the **structured / quantitative state** — FTP, phase, constraints usable as data, preferred methods, and the `learned_behaviors`. **Created by the Discovery intake** (which seeds the fitness markers the Planner later turns into the derived `athlete/zones.json`), then updated by the Analyst.

**Precedence**: on a *plannable* fact (a value, a constraint, a learned behavior), **`profile.json` is authoritative for the Planner**; the Vision provides the meaning, not the data. If the two diverge, that's a signal — the Discovery coach reconciles by amending the Vision, the Analyst corrects `profile.json`.

---

## Typical Run-mode sequence (day D)

```
1. pace (master): loads profile + plan + today's session (+ recent weeks/*.json, log/signals.md).
   If the athlete only wants to know the session -> recites it itself (concierge lane, done).
2. pace-coach (checkin capability): reads the planned session, explains why THIS session today,
   writes the session's `rationale`.
3. If a modulation is needed -> same coach follows its adjust capability: reads
   adjustment-decisions.csv -> modulates, writes the session's `adjustment`.
4. (post-session) pace-analyst: writes the session's `actual` + `debrief`, refreshes the
   week-level `summary`; on a threshold, emits to log/signals.md; on a marker change,
   regenerates zones.json.
5. If a strong signal -> the master reads log/signals.md and proposes partial Discovery or rolling.
   If index.csv shows no near week planned after the active one -> the master proposes /pace-plan
   (rolling) from plan state (concierge lane, not a signal).
```

Each step after the master is the **same agent reading a local file** — no skill hop, no voice change.

---

## The three extension axes in the method

- **Sport**: switching sport = reading another `knowledge_base/sports/` pack. Agents/capabilities are identical.
- **Domain** (nutrition, recovery, mental, strength): a parallel persona/workflow that *reads* Plan/Session and writes its own artefact (`nutrition.md`…). **Never touches the training Plan.**
- **Method** (a coach's training philosophy): a pack (Markdown + CSV of session structures the Planner consumes), injected via `customize.toml` + knowledge files. Introduced by contribution (expansion-pack model) or via a `method-onboarding` capability (explains -> short trial -> the Analyst measures -> adopt/discard). **Never** edits a persona.

---

## What changes vs the old design

- Coded orchestrator -> **`pace`**, a master concierge skill.
- Python agents -> a **small menu of Markdown agents** with distinct, persistent voices; their former workflows are now **local capability files** they read, not separate skills.
- 13 skills -> **7** (5 voiced agents + 2 shared tools); `pace-customize` dissolved into per-agent `customize.toml` merged by the LLM. See the migration table in `05_skill_map.md`.
- No more "silent skill-to-skill handoff": **one skill boundary per flow (master -> agent)**, then local-file reads.
- No more "Session Generator" agent: **no persona generates a session ex nihilo.**
- Fuzzy decisions -> **CSV tables** (adjustment, periodization, signals).

*Last updated: June 2026 (master-concierge + menu model, per ADR `06_architecture_pivot.md`)*
