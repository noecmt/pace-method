# 01 — Architecture

How PACE is built and distributed. Replaces the old architecture (Python app + LangGraph + SQLite), abandoned in favor of a **skills / plugin / connector** model native to the agentic ecosystem.

---

## The paradigm shift

| | Old model (abandoned) | New model |
|---|---|---|
| Nature | Python app with a runtime | Markdown method read by the host |
| Orchestration | LangGraph (code) | `pace-master` (orchestrator skill) on the host |
| Agents | Python classes (`BaseAgent`) | **Markdown personas** (skills) |
| Memory | SQLite + JSON | **Markdown/JSON files versioned by git** |
| LLM calls | LiteLLM in the code | The host handles the LLM |
| Installation | `git clone` + `uv sync` | `git clone` (skills) -> `/plugin install` |

**Accepted consequence**: we inherit the host's non-determinism (see "Guardrails"). That's the price of the BMAD model, accepted knowingly.

---

## The trunk: artefacts as contracts

Two ideas carry everything:

1. **Artefacts are the contracts.** Personas never talk to each other directly — they communicate via the Vision, the Plan, the Session, the Log. This is what makes everything pluggable: a sport, a domain, or a method attaches to an *artefact*, never to a persona's internals. (BMAD's handoff-by-artefact.)
2. **One conversation owner at a time.** At any moment, a single persona talks to the athlete. Workflows and other personas run "behind": they read/write artefacts without all speaking at once. Otherwise, agent soup and a dead UX.

```
                 pace-master (orchestrator)
                  detects the mode · proposes · loads
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   Discovery coach          Planner             Daily coach
        │ writes              │ writes              │ reads
        ▼                     ▼                     ▼
     Vision  ─────────->   Plan  ─────────->  Today's session
                                                     │
                              Analyst / debrief  ◄──┘  writes ► Log / profile

   PLUGGABLE AXES :  sport packs · domain packs · method packs
   (they attach to artefacts, never to personas)
```

---

## `pace-master` — the orchestrator

Default entry point. The athlete talks to it. It:

1. **reads the state** (does a Vision exist? a Plan? which mode?);
2. **detects the mode** (Discovery / Build / Run) from the message;
3. **routes**: automatically when obvious, otherwise **proposes** the right persona/workflow and lets the athlete choose;
4. **passes the context** (relevant artefacts + intent) and **loads** the target skill.

> BMAD-style example: "I have knee pain, I think we need to replan" -> `pace-master` proposes: *restart a partial Discovery* or *an immediate rolling* -> the athlete chooses -> `pace-master` loads the skill with the context.

Dual routing by design: **auto by default, slash commands to force** (`/pace-today`, `/pace-debrief`…). It's a deliberate CLI mode that integrates natively as a plugin.

---

## The three extension axes (never conflate them)

| Axis | What it changes | How it attaches |
|---|---|---|
| **Sport** (cycling -> running -> tri) | The *knowledge* (metrics, zones, periodization) | Pack under `knowledge_base/sports/`. Personas read it. **Not a new agent.** |
| **Domain** (nutrition, recovery) | A *parallel advisor* | Persona/workflow that *reads* Plan/Session and writes **its own artefact**. Never touches the Plan. |
| **Method** (polarized, double threshold) | A *planning strategy* | Pack (Markdown + CSV) that the Planner consumes. Optional: a `method-onboarding` workflow. |

**Golden rule**: a new sport is never a new agent; a new domain is a parallel agent; a new method is a pack. As long as that holds, adding anything does not touch the trunk.

---

## Skill structure (BMAD model)

Not a single `SKILL.md`: **several small, well-scoped skills**, mixing Markdown (reasoning) and structured files (enumerable, validatable). See the full inventory in `05_skill_map.md`. Overview:

```
src/
├── pace-master/            <- orchestrator
├── core-skills/            <- reusable: elicitation, validation, customization
└── coaching-skills/
    ├── 1-discovery/        <- persona + vision workflow
    ├── 2-build/            <- persona + plan / rolling workflows
    └── 3-run/              <- persona + checkin / adjust / debrief workflows
knowledge_base/             <- sport packs (axis 1)
extensions/                 <- domain & method pack contracts (axes 2 & 3)
```

Each skill = a folder with `SKILL.md` (frontmatter `name` + a "pushy" `description` for triggering, then instructions), and as needed: `references/` (loaded on demand), `assets/` (templates, checklists), `customize.toml` (customization surface), `*.csv` (decision tables).

### Role of the structured files

Coaching is full of rule-based tabular data. In CSV rather than prose, it becomes **anti-drift guardrails** and **eval checklists**:

- `periodization-rules.csv` -> `phase, allowed_intensity, forbidden, volume_modifier`
- `adjustment-decisions.csv` -> `signal, recommended_action, severity`
- `signals.csv` -> strong signals -> proposal (re-Discovery, rolling)
- `methods.csv` (elicitation) -> questioning techniques
- validation checklists (`.md`) -> Vision and Plan rubrics

Principle: **Markdown for reasoning and personas; CSV/JSON/YAML for anything enumerable, rule-based, or validatable.**

---

## Knowledge layer

- **Invariant principles** — Markdown + YAML frontmatter (`id, category, applies_to, source, version`). Body injected as-is. (Reused from the PoC.)
- **Sport profiles** — JSON per sport (zones, metrics, periodization). Cycling first. A `_schema.md` defines the contract of a sport pack so others can be added without touching the trunk.

---

## Memory layer (versioned artefacts)

No database. Memory = files written in the athlete's repo, versioned by git:

```
vision/vision.md      <- narrative intent (amended, never rewritten)
plan/plan.md          <- the current hierarchical plan
athlete/profile.json  <- structured state + learned_behaviors (sole writer: the Analyst)
log/                   <- sessions, check-ins, debriefs
```

**Vision/profile precedence**: the Vision carries the *why*; `profile.json` carries the *data*. On a plannable fact, `profile.json` is authoritative for the Planner (details in `02_method.md`).

Git provides the audit trail and validation: every plan change is a **reviewable diff**. The Plan stays a hard constraint — any change beyond the immediate window is explicit and visible.

---

## Distribution: three tiers

```
Skills (git clone)  ->  Plugin (1-command install)  ->  Hosted connector (service)
   V0                       V1                            V2+
```

- **Skills** — `git clone`, zero runtime. Target: tech-savvy athletes and developers.
- **Plugin** — `plugin.json` + `marketplace.json` package the skills (+ slash commands + connector config). `/plugin marketplace add … && /plugin install …`. Also works in **Claude Desktop** via *Customize -> Browse plugins* (UI-friendly, provided by Anthropic, nothing to build).
- **Hosted connector** — a hosted Strava/Garmin MCP server -> "Connect" in one click. An optional service. Can render UI in the chat (maps, charts).

---

## Portability (don't lock yourself in)

MCP is an open standard (created by Anthropic, adopted by OpenAI/Google/Microsoft, governed by a Linux foundation since late 2025).

- The **connector** (MCP server) works on Claude, ChatGPT, Gemini, Cursor.
- The **method** (Markdown) reads in any agentic host.
- Only the **"one-click" packaging** is Claude-specific (OpenAI has its Apps SDK).

**Decision**: Claude-native is the V0/V1 bet (the early target already has Claude Code). Agnosticism holds at the method + connector level; neutral packaging comes later.

---

## Guardrails against non-determinism

1. **Strict method** — explicit prohibitions ("the Daily coach never generates"). Verifiable because "modulate" is precisely defined: bounded scaling down or substitution with the fixed fallback catalog, never a new structure (see `02_method.md`, "Modulate vs generate").
2. **Structured artefacts** — Vision and Plan have a template; we test their form.
3. **CSV decision tables** — Adjust reads a table, does not improvise.
4. **Artefact-level evals** — checklists (see `04_evaluation.md`).
5. **Git as validation** — every Plan mutation is an inspectable diff.

*Last updated: May 2026*
