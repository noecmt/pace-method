# 01 — Architecture

How PACE is built and distributed. Replaces the old architecture (Python app + LangGraph + SQLite), abandoned in favor of a **skills / plugin / connector** model native to the agentic ecosystem.

> Updated 2026-06 to the **master-concierge + menu-of-voiced-agents** model — see `06_architecture_pivot.md` (ADR). The earlier "13 skills + silent skill-to-skill handoff" shape is gone: that handoff primitive does not exist in the host, and over-decomposition made the everyday UX slow and verbose. This document now matches the ADR.

---

## The paradigm shift

| | Old model (abandoned) | New model |
|---|---|---|
| Nature | Python app with a runtime | Markdown method read by the host |
| Orchestration | LangGraph (code) | `pace` master (concierge skill) on the host |
| Agents | Python classes (`BaseAgent`) | **Markdown personas** (a few voiced agent skills) |
| Sub-steps | Python functions | **Local capability files** the active agent *reads* (no skill boundary) |
| Memory | SQLite + JSON | **Markdown/JSON files versioned by git** |
| LLM calls | LiteLLM in the code | The host handles the LLM |
| Customization | code config | `customize.toml`, **merged by the LLM** at activation (no runtime) |
| Installation | `git clone` + `uv sync` | `git clone` (skills) -> `/plugin install` |

**Accepted consequence**: we inherit the host's non-determinism (see "Guardrails"). That's the price of the BMAD model, accepted knowingly.

---

## The trunk: artefacts as contracts

Two ideas carry everything:

1. **Artefacts are the contracts.** Personas never talk to each other directly — they communicate via the Vision, the Plan, the profile/zones, the signals ledger. This is what makes everything pluggable: a sport, a domain, or a method attaches to an *artefact*, never to a persona's internals. (BMAD's handoff-by-artefact.)
2. **One conversation owner at a time.** At any moment, a single persona talks to the athlete and stays the single voice for its whole flow. Other personas run "behind" only in the sense that they *previously* wrote the artefacts this one reads — they are not all live at once. Otherwise, agent soup and a dead UX.

```
                 pace — MASTER (neutral concierge, does NOT coach)
                 reads state · detects mode · renders an intent menu when ambiguous
                              │
        ┌─────────────────────┴───────────────────────┐
        │ CONCIERGE lane (answers directly, 0 agents)  │
        │  recite today's planned session · "where is  │
        │  my plan?" · "summarize my profile" · mode?  │
        └──────────────────────────────────────────────┘
                              │
        ROUTE lane -> exactly ONE agent, which becomes the single voice of the flow
        (the only skill boundary crossed in a flow: master -> agent)
        ┌─────────────┬───────────────┬──────────────┬───────────────┐
        ▼             ▼               ▼              ▼
  pace-discovery   pace-planner    pace-coach     pace-analyst
  curious          strategist      present/        neutral/
  interviewer                      grounded        analytical
        │ writes        │ writes        │ reads          │ writes
        ▼               ▼               ▼                ▼
     Vision  ────────> Plan  ────────> today's session  profile / zones / signals
   (+ vision-write   (+ plan-write,   (+ checkin,        (its own logic, all
    as LOCAL files)   rolling, LOCAL)  adjust, LOCAL)     as LOCAL files)

  SHARED TOOLS (called as tools, the agent keeps its voice): pace-elicitation · pace-validate
  PLUGGABLE AXES :  sport packs · domain packs · method packs
  (they attach to artefacts, never to personas)
```

---

## `pace` — the master concierge

Default entry point. The athlete talks to it. It **does not coach**. It:

1. **reads the state** (does a Vision exist? a Plan? which mode?);
2. **detects the mode** (Discovery / Build / Run) from the message;
3. when the intent is ambiguous, **renders a ChatGPT-style intent menu** (the BMAD `[[agent.menu]]`, rendered for a non-technical user) plus a "talk freely" escape hatch that drops back into detection:
   1. My session today · 2. My goals / situation have changed · 3. Debrief a session · 4. (Re)build my plan · 5. Talk freely;
4. then either **answers itself** (concierge lane) or **routes to exactly one agent** (route lane).

**Concierge lane — answers directly, launches no agent.** The master *recites* today's planned session, says where the plan/profile lives, reports which mode the athlete is in. Reciting the planned session is a **factual read, not a training judgment** — so it stays inside the master's neutral remit. The moment the athlete needs *why this session* / *how hard* / *is it safe* / *modulate it*, the master escalates to `pace-coach`.

**Route lane — sure -> launch, unsure -> propose 1–3.** When the mode is obvious the master launches the right agent directly; when it isn't, it proposes 1–3 and lets the athlete choose. Either way it crosses **one** skill boundary (master -> agent), forwards the context bundle, and the chosen agent then owns the conversation.

> Example: "I have knee pain, I think we need to replan" -> the master proposes *restart a partial Discovery* or *an immediate rolling* -> the athlete chooses -> the master launches that agent with the context.

Dual routing by design: **auto/menu by default, slash commands to force** (`/pace-today`, `/pace-debrief`…). A deliberate CLI mode that integrates natively as a plugin.

---

## The one rule that fixes everything

> **A skill boundary is crossed at most once per flow: master -> agent. After that, the active agent stays the single voice and pulls in its steps by reading local files — it never invokes another skill mid-flow.**

This is the core lesson of the pivot. The host has **no "transfer conversation ownership to another skill" operation**: invoking the Skill tool is a *full re-activation* (re-read the SKILL.md, re-resolve config, re-load the bundle). The V0 design stacked three such re-activations to answer "what's my session today" — that *was* the slowness and the verbosity, and the "silent handoff" contract broke because there was no real ownership to keep silent.

So a former workflow (write the vision, write the plan, brief the session, modulate it…) is now a **local capability file** the owning agent *reads* into the same context — no boundary, no re-activation, no voice change. Only two utilities stay separate skills, because they are genuinely heavy and reused across agents:

- `pace-elicitation` — the questioning toolkit;
- `pace-validate` — the artefact validation gate.

They are called **as tools** while the calling agent keeps its voice (the legitimate BMAD `skill =` case).

---

## The three extension axes (never conflate them)

| Axis | What it changes | How it attaches |
|---|---|---|
| **Sport** (cycling -> running -> tri) | The *knowledge* (metrics, zones, periodization) | Pack under `knowledge_base/sports/`. Personas read it. **Not a new agent.** |
| **Domain** (nutrition, recovery) | A *parallel advisor* | Persona/workflow that *reads* Plan/Session and writes **its own artefact**. Never touches the Plan. |
| **Method** (polarized, double threshold) | A coach's *planning philosophy* | Pack (Markdown + CSV: `periodization-rules.csv`, `methods.csv`) the Planner consumes, injected via `customize.toml` + knowledge files. **Never** edits a persona. |

**Golden rule**: a new sport is never a new agent; a new domain is a parallel agent; a new method is a pack. As long as that holds, adding anything does not touch the trunk.

---

## Skill structure (BMAD model)

Not a single `SKILL.md`, but **not** a cloud of micro-skills either: a **master + a small menu of voiced agents + 2 shared tools = 7 skills**. The default unit of work is a **capability = a local file the active agent reads**, not a separate skill; a separate skill is the exception (heavy + shared). See the full inventory and the 13->7 migration table in `05_skill_map.md`. Overview:

```
src/
├── pace/                   <- master concierge (entry point)
├── pace-discovery/         <- agent (voice) + vision-write, elicitation use (local)
├── pace-planner/           <- agent (voice) + plan-write, rolling (local)
├── pace-coach/             <- agent (voice) + checkin, adjust (local)
├── pace-analyst/           <- agent (voice) + profile/signals logic (local)
├── pace-elicitation/       <- shared tool (called as a tool)
└── pace-validate/          <- shared tool (called as a tool)
knowledge_base/             <- sport packs (axis 1)
extensions/                 <- domain & method pack contracts (axes 2 & 3)
```

Each skill = a folder with `SKILL.md` (frontmatter `name` + a "pushy" `description` for triggering, then instructions), and as needed: `references/` (the **local capability files** loaded on demand), `assets/` (templates, checklists), `customize.toml` (the menu + customization surface), `*.csv` (decision tables).

### Customization without a runtime

`pace-customize` no longer exists as a skill. Each agent ships a `customize.toml` carrying its `[[agent.menu]]` and its `[surface]` (output language, verbosity, tonal nuance, elicitation depth, default preferred method). The override stack (skill default -> athlete override) is **resolved once, by the LLM, at the agent's activation** — read the files, merge per the structural rules, bind the result to the agent that then stays active for the whole flow. `[surface].language` is applied from the very first token and re-applied every turn because **the agent never goes away** — which is exactly why language can no longer drift. **No Python, no runtime**, consistent with the project's standing constraint. (The merge spec the agents follow is the body of the former `pace-customize`.)

### Role of the structured files

Coaching is full of rule-based tabular data. In CSV rather than prose, it becomes **anti-drift guardrails** and **eval checklists**:

- `periodization-rules.csv` -> `phase, allowed_intensity, forbidden, volume_modifier`
- `adjustment-decisions.csv` -> `signal, recommended_action, severity`
- `signals.csv` -> strong signals -> proposal (re-Discovery, rolling)
- `methods.csv` (elicitation) -> questioning techniques
- validation checklists (`.md`) -> Vision and Plan rubrics

Principle: **Markdown for reasoning and personas; CSV/JSON/YAML for anything enumerable, rule-based, or validatable.**

The strongest form of this guardrail is the **core-artefact contract made executable**: the shapes of `plan/weeks/*.json` and `plan/index.csv` are frozen as schema files — `extensions/week.schema.json` (JSON Schema) and `extensions/index.schema.json` (Table Schema, the standard descriptor for a CSV). `extensions/_artefact_schema.md` is the human-readable companion; the `*.schema.json` is authoritative on shape. This lets the Planner's writes be **shape-checked deterministically** (and makes a stable visual buildable on top of `weeks/*.json`) — no runtime needed: a host LLM (or a downstream app like pace-chat) validates against the schema.

---

## Knowledge layer

- **Invariant principles** — Markdown + YAML frontmatter (`id, category, applies_to, source, version`). Body injected as-is. (Reused from the PoC.)
- **Sport profiles** — JSON per sport (zones, metrics, periodization). Cycling first. A `_schema.md` defines the contract of a sport pack so others can be added without touching the trunk.

---

## Memory layer (versioned artefacts)

No database. Memory = files written in the athlete's repo, versioned by git:

```
vision/vision.md      <- narrative intent (amended, never rewritten)
plan/plan.md          <- the current hierarchical plan (+ plan/weeks/*.json)
athlete/profile.json  <- structured state + learned_behaviors (sole updater: the Analyst)
athlete/zones.json    <- derived intensity zones in concrete bounds (never hand-edited)
log/signals.md        <- the cross-session signals ledger (Analyst-only)
```

**Vision/profile precedence**: the Vision carries the *why*; `profile.json` carries the *data*. On a plannable fact, `profile.json` is authoritative for the Planner (details in `02_method.md`).

Git provides the audit trail and validation: every plan change is a **reviewable diff**. The Plan stays a hard constraint — any change beyond the immediate window is explicit and visible.

---

## Distribution: three tiers

```
Skills (git clone)  ->  Plugin (1-command install)  ->  Connector layer (read / storage / calendar)
   V0                       V1                            V1 (storage · calendar · Strava Phase 1) -> V2 (multi-host) -> V3 (Strava measured)
```

- **Skills** — `git clone`, zero runtime. Target: tech-savvy athletes and developers.
- **Plugin** — `plugin.json` + `marketplace.json` package the skills (+ slash commands + connector config). `/plugin marketplace add … && /plugin install …`. Also works in **Claude Desktop** via *Customize -> Browse plugins* (UI-friendly, provided by Anthropic, nothing to build).
- **Connector** — a **capability layer attached to the artefacts**, in **three classes**: `read` (external signal/data — e.g. Strava's **official remote MCP**, read-only, OAuth, subscribers-only, nothing to host), `storage` (where the artefacts live — local · GitHub · Notion · Google Drive), and `calendar` (deliver upcoming sessions — `plan/calendar.csv` · Google Calendar · Notion). A connector is detected at use time and **degrades gracefully** to a local default (manual entry / local filesystem / `plan/calendar.csv`), so PACE works fully without any of them. It is consumed *inside an agent's local capability files* (never as a separate decision-making skill); it is **never a fourth extension axis** (the axes stay sport / domain / method), **never a persona**, and **never called from the master** to make a decision — it only changes *where data is read from / written to*. Timeline: storage + calendar + Strava **Phase-1 qualitative** read land in **V1**; Strava's **measured** loop (planned-vs-actual KPIs, `strava_baseline`) is **V2**. Garmin and others later. See `extensions/connectors/_schema.md`.

---

## Portability (don't lock yourself in)

MCP is an open standard (created by Anthropic, adopted by OpenAI/Google/Microsoft, governed by a Linux foundation since late 2025).

- The **connector** (MCP server) works on Claude, ChatGPT, Gemini, Cursor.
- The **method** (Markdown) reads in any agentic host. The capability-as-local-file model is **more** portable than skill-to-skill chaining, not less — a local `Read` works identically under the Agent SDK, whereas chaining is even more fragile there. This de-risks pace-chat.
- Only the **"one-click" packaging** is Claude-specific (OpenAI has its Apps SDK).

**Decision**: Claude-native is the V0/V1 bet (the early target already has Claude Code). Agnosticism holds at the method + connector level; neutral packaging comes later.

---

## Guardrails against non-determinism

1. **Strict method** — explicit prohibitions ("the Daily coach never generates"). Verifiable because "modulate" is precisely defined: bounded scaling down or substitution with the fixed fallback catalog, never a new structure (see `02_method.md`, "Modulate vs generate").
2. **One voice, bound to a persistent agent** — the single-voice contract is now *enforced by the architecture*: the active agent never leaves mid-flow, so there is no handoff to narrate and no language to drift.
3. **Structured artefacts** — Vision and Plan have a template; we test their form.
4. **CSV decision tables** — Adjust reads a table, does not improvise.
5. **Artefact-level evals** — checklists (see `04_evaluation.md`).
6. **Git as validation** — every Plan mutation is an inspectable diff.

*Last updated: June 2026 (master-concierge + menu model, per ADR `06_architecture_pivot.md`)*
