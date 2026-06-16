# routing.md — the master's decision procedure

A **capability file** of the `pace` master: loaded on demand into the same context (no skill boundary). This is the detailed logic behind the four-step behavior: read state -> detect mode -> pick a lane -> pass context. The worked walkthrough at the end is also the **static test trace** for `scenarios/06_routing.md`.

---

## 1. Read state

Check the athlete repo for the config + the three persistent artefacts:

| Artefact | Present means |
| --- | --- |
| `pace.config.toml` | The workspace has been set up (language, storage, connectors). **Absent + nothing else => first run -> Onboarding.** |
| `vision/vision.md` | Discovery has happened at least once. |
| `plan/plan.md` | A plan exists -> Run is possible. |
| `athlete/profile.json` | Structured long-term state (FTP, phase, constraints, `learned_behaviors`). Test fixture: `athlete/sample.json`. |

State drives what is *possible*: **zero-state (none of the four) => Onboarding before anything else**; **no `plan/plan.md` => Run is off the table.**

### Onboarding (zero-state, before Discovery)

When **none** of `pace.config.toml` / vision / plan / profile exists, the master runs a short setup wizard **itself** (concierge lane — configuration, never a training judgment): **language** -> `[surface].language`; **storage** (`local`|`github`|`notion`|`gdrive`) -> `[connectors].storage`; **connectors** (calendar `local`|`gcal`|`notion`, Strava on/off) -> `[connectors]`. It writes `pace.config.toml` (from the root `pace.config.template.toml`), then **routes into Discovery** (`pace-discovery`) in the chosen language. Unavailable backend -> fall back to `local` and say so. `pace.config.toml` already present -> do not relaunch (offer "reconfigure?").

## 2. State × intent matrix

| Vision? | Plan? | Athlete intent | Mode / route |
| --- | --- | --- | --- |
| no | no | **zero-state** (no config either) — anything | **Onboarding** (wizard -> write `pace.config.toml` -> `pace-discovery`) |
| no | no | wants to start / has a goal | **Discovery** (`pace-discovery`) |
| yes | no | "what now?" / ready to train | **Build** (`pace-planner`) |
| yes | yes | about today's planned session, time, feeling *now* | **Run** (`pace-coach`) |
| yes | yes | reports on **executed** training / physical state | **Debrief** (`pace-analyst`) |
| yes | yes | doubts the **goal** / situation changed | **Propose**: partial Discovery *or* rolling |
| any | any | message contains a `/pace-*` token | **Force** that route (overrides all the above) |

## 3. Lane selection

Decide *how* to act, in this order. The governing line: **state facts about the system and the existence/location/summary of artefacts directly — including reciting today's planned session verbatim; the moment a reply needs a training judgment (why, how hard, is it safe, modulate), route.**

1. **Concierge (answer directly).** The request is meta / navigation / read-only state, or asks for a **stored artefact as written** (today's session, the week `summary`), and needs no training judgment. Examples: capabilities, where an artefact is, which mode is active, a plain summary of `profile.json`, "what's my session today?", "summarize my week". -> Answer; launch no agent. Recite the week `summary` block **as stored** (never recompute it; if absent, offer `/pace-debrief`). (For the *why* or a modulation of that session, escalate to `pace-coach`.)
2. **Auto-route (one boundary).** The coaching intent is unambiguous and a single route clearly applies. -> Launch that agent, pass context, let it own the conversation. No menu, no ceremony.
3. **Propose 1–3.** Genuine ambiguity between real routes, or a strong signal. -> Offer 1–3 options (the intent menu); the athlete chooses. Never impose. If the input is only *vague* (not a true fork), ask **one** aiguillage question instead of launching an agent speculatively.

## 4. Slash-command force table

A command (or the same token in plain text) forces the route regardless of detection. These are **real plugin commands** in `commands/` (the curated surface); each delegates back to the master with the same force, so behaviour is identical to a bare token. The command-surface mechanism (which skills are hidden from the `/` menu) is owned by the plugin manifest.

| Command | Forces | Notes |
| --- | --- | --- |
| `/pace` | default entry | onboard on zero-state, otherwise detect + route. Not a force. |
| `/pace-discovery` | Discovery (`pace-discovery`) | even if a vision already exists (partial re-Discovery). |
| `/pace-plan` | Build (`pace-planner`) | even if no vision yet — but the Planner will then bounce back if its vision input is missing. |
| `/pace-today` | Run (`pace-coach`) | requires a plan; if none, say so and fall back to Discovery/Build. |
| `/pace-debrief` | Debrief (`pace-analyst`) | hands raw feedback to the Analyst to structure + emit signals. |

## 5. Strong-signal flow (the two-step Analyst path)

The master **does not pattern-match prose into a signal id.** Signals are the Analyst's vocabulary. The flow has two distinct steps:

```text
Athlete reports an execution/state fact (prose)
        │
        ▼
[pace / master]  classify -> "this is executed-training/state" -> ROUTE to pace-analyst
        │                                   (master does NOT label the signal)
        ▼
[pace-analyst / Analyst]  structure the feedback -> write actual+debrief on the session, emit a signal into log/signals.md
        │                 (sole writer of signals & profile.json)
        ▼
[pace / master]  read the emitted signal -> map via signals.csv (proposal column) -> PROPOSE
        │                                                   (never impose)
        ▼
Athlete chooses (e.g. partial Discovery vs rolling)
```

`signals.csv` columns split by reader:

- `threshold` — **Analyst-facing**: when an observation is worth emitting (e.g. `3_weeks`).
- `proposal` — **master-facing**: what to propose once the signal exists.

> The master-side behaviour to get right is the *first* step — correctly **routing an execution/state fact to the Analyst** instead of self-diagnosing. The downstream proposal is verified end-to-end once the Analyst is exercised.

## 5b. Plan-horizon check (proactive rolling) — read from plan state, not a signal

A **second proposal source**, distinct from §5: it reads **plan state** (`index.csv`), not the Analyst's ledger. While reading state (§1), check whether a `horizon:near` row with `status:planned` exists **after** the active one. If **none** does (every later week is still `mid`/`far`), the precise window is **depleted** — proactively **propose** rolling:

```text
Master reads index.csv (step 1)
        │
        ▼
No horizon:near row status:planned after the active one?  ──no──▶ nothing (window has a buffer)
        │ yes (depleted)
        ▼
[pace / master]  in a concierge moment, append one line: "Next week isn't planned yet — /pace-plan to extend (rolling)."  (PROPOSE)
        │                                                   (never impose; never via log/signals.md)
        ▼
Athlete accepts or types /pace-plan ──▶ ROUTE to pace-planner; rolling capability advances the window
```

Three rules keep it clean:

- **Plan state, not a signal.** Horizon depletion is read by the master directly from `index.csv`; it never goes through the Analyst and is **never** written to `log/signals.md` (contrast §5, which is an executed-training fact the Analyst must structure first).
- **Concierge lane only.** Surface it where the master already speaks: a state question, a greeting/re-engagement turn (alongside "recite where they are + one aiguillage question"), or right after reciting today's session or the week `summary`. **Never staple it onto an auto-route** (that is a second voice in one turn).
- **Propose, never impose; don't nag.** One line + the `/pace-plan` pointer, surfaced once when relevant. The roll itself is the Planner's `rolling` capability, run on the athlete's go-ahead or the command.

## 6. Context passing

When routing, hand the launched agent a compact context bundle:

| Route | Artefacts handed over | Plus |
| --- | --- | --- |
| Discovery | `vision/vision.md` (if any), `athlete/profile.json` | intent; whether it's a full or partial re-Discovery |
| Build | `vision/vision.md`, `athlete/profile.json`, sport pack | intent; what changed |
| Run | `plan/plan.md` + today's session, recent `plan/weeks/*.json` + `log/signals.md`, `athlete/profile.json` | intent; any stated constraint (time, feeling) |
| Debrief | today's session (planned vs actual), recent `plan/weeks/*.json` + `log/signals.md`, `athlete/profile.json` | the raw feedback verbatim |

Always include: the athlete's intent in one line, and any slash-force or proposal choice that selected the route. The agent resolves `[surface]` from the forwarded `config` once, at activation, and never re-reads it.

---

## 7. Worked walkthrough — `scenarios/06_routing.md` (test trace)

Each case traced through the procedure above; the result must match the scenario's expected route.

- **A — no vision, no plan, "start training for a gran fondo in September."** State: nothing exists. Intent: a goal, forward-looking. Matrix -> **Discovery**. Lane: auto-route (obvious, no plan to run). ✅ `pace-discovery`.

- **B — vision + plan, "only got 45 min today."**
  State: plan exists. Intent: about *today's* execution constraint, needs a training judgment. Matrix -> **Run**. Lane: auto-route (obvious), launch `pace-coach`. ✅ Run, no menu.

- **C — vision + plan, "I don't think my goal is realistic anymore."** Intent: a **doubt about the goal** (not an executed-training fact). Matrix -> propose partial Discovery *or* rolling. Lane: **propose 1–3** (genuine fork). ✅ Proposes, never imposes. No Analyst detour (this is goal-intent, not an execution fact).

- **D — vision + plan, "I've basically skipped my sessions for the last 3 weeks."** Intent: a fact about **executed training**. Classification -> Analyst's domain. Matrix -> **Debrief**. Lane: route to `pace-analyst`; master does **not** label `sessions_skipped` itself. The Analyst emits the signal; master then maps `signals.csv: sessions_skipped -> partial_discovery_or_rolling` and **proposes**. ✅ Routes to the Analyst without self-diagnosing.

- **E — any state, "/pace-plan".** Slash token present. Force table -> **Build** (`pace-planner`), overriding detection. ✅ Forced Build.

- **F — vision exists, no plan, "what should I do?"** State: vision yes, plan no. Intent: ready to proceed. Matrix -> **Build** (the plan is the missing artefact; Run is impossible without a plan). Lane: auto-route. ✅ Build.

- **G — zero-state (no `pace.config.toml`, no vision, no plan, no profile), "hi, I want to get into shape for a sportive."** State: nothing exists at all -> **first run**. The master runs the **onboarding wizard itself** (language -> storage -> connectors), writes `pace.config.toml`, then **routes into Discovery** in the chosen language. ✅ Onboarding **before** Discovery — not Discovery directly. (Concierge-lane configuration, no training judgment.)

- **H — vision + plan, "summarize my week" (`scenarios/13`).** Intent: read a **stored artefact**. Lane: **concierge** — recite the week `summary` block from the top of the active `weeks/<week>.json` as stored, in `[surface].language`; launch no agent, recompute nothing. If no `summary` exists yet, say so and offer `/pace-debrief`. ✅ Factual read, like reciting today's session.

- **I — vision + plan, `index.csv` shows no `status:planned` near row after the active one, "où j'en suis ?" (`scenarios/14`).** State read (§1) flags horizon depletion. Lane: **concierge** — recite where they are + one aiguillage question, and **append the rolling proposal** (§5b): "next week isn't planned — `/pace-plan` to extend." On acceptance/command -> route to `pace-planner` (rolling). ✅ Proposes from plan state, never imposes, never via the Analyst. *(Contrast: an obvious Run intent in the same state auto-routes silently — the nudge waits for a concierge moment.)*

**Anti-properties to keep:** never start coaching instead of routing; never impose re-Discovery on a signal; never route to Run when no plan exists; **on zero-state, never jump straight to Discovery — onboard first**; never **self-roll** the plan or staple the rolling nudge onto an auto-route; never recompute the week `summary` under the concierge lane.
