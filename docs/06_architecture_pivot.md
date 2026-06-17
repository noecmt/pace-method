# 06 — Architecture Pivot (ADR): from a skill-chain to a menu of voiced agents

**Status:** Accepted — 2026-06-15. Supersedes the multi-skill handoff model described in `01_architecture.md`, `02_method.md`, and `05_skill_map.md` (those three are to be rewritten to match this ADR; until then, **this document wins on any conflict**).

**Decision in one line:** PACE stops modelling every persona *and* every workflow as a separate skill that hands the conversation to the next skill. Instead, PACE becomes a **concierge master + a small menu of distinct-voice agents**, where each agent stays the single active voice for its whole flow and pulls in its steps by **reading local capability files** — never by invoking another skill mid-flow. This mirrors how BMAD actually works.

---

## 1. Context — what triggered this

V0 was built and tested. It works on paper but is unpleasant in practice. Four observed syndromes:

1. **Slow for trivial asks** — "what's my session today?" spins up a chain of skills before answering.
2. **Verbose intermediate steps** — too much machinery surfaces; each step feels heavy.
3. **Inter-agent handoff is unreliable** — routing from one skill to another "behind the scenes" does not behave as designed.
4. **Customization drifts** — surface settings, language above all, are not honoured consistently across the flow.

The working hypothesis going in was "maybe it's how we write the Markdown, or maybe juggling many `.md` files is just impossible." Investigation (reading the BMAD v6 source: `BMAD-METHOD`, `bmad-builder`, `bmad-module-template`) shows it is **neither**. It is a specific, fixable architecture mistake.

## 2. Root cause

PACE turned **13 skills** out of what should have been a handful, and invented a **"silent handoff between skills"** protocol that the host does not actually support.

The 13 current skills:

| Skill | Intended role |
|---|---|
| `pace-master` | master / orchestrator |
| `pace-customize` | core — apply surface overrides |
| `pace-elicitation` | core — questioning toolkit |
| `pace-validate` | core — artefact validation gate |
| `pace-agent-discovery` | persona — Discovery coach |
| `pace-vision` | workflow — write `vision.md` |
| `pace-agent-planner` | persona — Planner |
| `pace-plan` | workflow — write `plan.md` / weeks |
| `pace-rolling` | workflow — advance the horizon |
| `pace-agent-coach` | persona — Daily coach |
| `pace-checkin` | workflow — brief today's session |
| `pace-adjust` | workflow — modulate today's session |
| `pace-debrief` | persona/workflow — the Analyst |

The fatal design is in `pace-master/SKILL.md` and across the personas: routing means "**load the target skill into this same conversation and let it take over**", and personas chain into workflows the same way (`pace-agent-coach (-> pace-checkin / pace-adjust)`).

**That primitive does not exist.** Claude Code (and the Agent SDK) has no "transfer conversation ownership to another skill" operation. When a `SKILL.md` says "route to skill X", the model can only re-invoke the Skill tool — a **full re-activation**: re-read the SKILL.md, re-resolve config, re-load the context bundle. Stacking three re-activations to answer "what's my session today" *is* the slowness, *is* the verbosity, and the "silent pipeline / single voice" contract is exactly what breaks because there is no real ownership transfer to keep silent.

## 3. Evidence — how BMAD really does it

In BMAD v6 an **agent = one skill = one persona = one menu**. The menu lives in `customize.toml` as `[[agent.menu]]`, and each item has **exactly one of two** dispatch mechanisms:

| Mechanism | Real example | What it is |
|---|---|---|
| `prompt = "Read and follow {skill-root}/write-document.md"` | `bmad-agent-tech-writer/customize.toml` | A plain **`Read` of a local file into the same context**. No skill boundary crossed. This is a "capability". The default, used for almost everything. |
| `skill = "bmad-product-brief"` | `bmad-agent-analyst/customize.toml` | Invoke a **separate** skill — reserved for **heavy, shared** workflows reused by several agents. And even then the persona explicitly *"carries through and remains active"* (`bmad-agent-analyst/SKILL.md`). |

Two load-bearing facts:

- **BMAD never transfers voice/ownership from one skill to another.** Either the persona stays active and reads a local file, or it calls a heavy shared skill *as a tool* while remaining itself.
- **Customization is resolved once, at the persona's activation** (base -> team -> user TOML merge), bound to the persona that then stays active for the whole session, and re-applied as a message prefix every turn. Language cannot drift because the persona never goes away. The merge can be done by a Python resolver **or, on failure, by the LLM reading the three files directly** — BMAD ships that fallback, which means *no runtime is required*.

PACE over-decomposed (every micro-step a skill) **and** added a voice-transfer protocol on top. BMAD does the opposite of both.

## 4. Decision

### 4.1 The shape — master concierge + menu of voiced agents

```
pace:pace — MASTER (neutral voice, does NOT coach)
│
│  On entry, when ambiguous -> render a ChatGPT-style intent menu:
│     1. My session today
│     2. My goals / situation have changed
│     3. Debrief a session
│     4. (Re)build my plan
│     5. Talk freely
│
├─ CONCIERGE lane (answers directly, launches NO agent):
│     recite today's planned session · "where is my plan?" ·
│     "summarize my profile" · "which mode am I in?"
│
└─ ROUTE lane -> exactly ONE agent, which becomes the single voice of the flow:
   ├─ pace-discovery   voice: curious interviewer   (+ vision-write, elicitation as LOCAL files)
   ├─ pace-planner     voice: strategist            (+ plan-write, rolling      as LOCAL files)
   ├─ pace-coach       voice: present / grounded     (+ checkin, adjust          as LOCAL files)
   └─ pace-analyst     voice: neutral / analytical   (+ profile/signals logic    as LOCAL files)
```

Routing keeps the two existing lanes (they were correct; only the *mechanism* was broken): **sure -> launch directly; unsure -> propose 1–3.** The master may also answer the trivial case itself.

### 4.2 The one rule that fixes everything

> **A skill boundary is crossed at most once per flow: master -> agent. After that, the active agent stays the single voice and pulls in its steps by reading local files — it never invokes another skill mid-flow.**

Heavy, genuinely shared utilities (`pace-elicitation`, `pace-validate`) remain separate skills, but are called **as tools** while the agent keeps its voice — exactly the BMAD `skill =` case.

### 4.3 Customization without a runtime

`pace-customize` is **dissolved as a skill**. Customization becomes each agent's `customize.toml`, **resolved once at activation by the LLM** (read base -> user overrides, merge per the structural rules), bound to the agent for the whole flow. `[surface].language` is applied from the first word and carried every turn because the agent never leaves. **No Python, no runtime** — consistent with the project's standing constraint.

### 4.4 Skill count: 13 -> 7

| New skill | Type | Absorbs (was a separate skill) |
|---|---|---|
| `pace` (master) | master | `pace-master` |
| `pace-discovery` | agent (voice) | `pace-agent-discovery` + `pace-vision` (now a local capability file) |
| `pace-planner` | agent (voice) | `pace-agent-planner` + `pace-plan` + `pace-rolling` (local files) |
| `pace-coach` | agent (voice) | `pace-agent-coach` + `pace-checkin` + `pace-adjust` (local files) |
| `pace-analyst` | agent (voice) | `pace-debrief` |
| `pace-elicitation` | shared tool | unchanged (called as a tool, persona keeps voice) |
| `pace-validate` | shared tool | unchanged (called as a tool, persona keeps voice) |
| — | dissolved | `pace-customize` -> `customize.toml` + LLM merge |

**5 agents + 2 shared tools = 7 skills**, down from 13.

## 5. How this answers each syndrome

| Syndrome | Fix |
|---|---|
| Slow for trivial asks | Master recites the session itself (0 agents); a real flow is 1 activation, not 3. |
| Verbose intermediate steps | 1 activation ritual per flow instead of 13; no "voiceless workflow renders an internal object" indirection. |
| Handoff unreliable | Eliminated: no skill->skill chaining mid-flow. The only boundary is master->agent. |
| Customization / language drift | Resolved once at agent activation and held by the persistent persona; no re-resolution at each hop. |

## 6. What does NOT change (method invariants)

This is an *architecture* change, not a *method* change. All of these survive intact and still apply to every agent:

- **Artefacts are the contracts** (`vision.md`, `plan.md`, `profile.json`, `log/signals.md`) — personas communicate only through them.
- **Plan-first**, and **the Run coach NEVER generates a session** (modulate = scale-within-bounds or substitute a fallback; never compose).
- **Strict persona separation, one voice at a time** — actually *strengthened*: voice is now bound to a persistent agent, not negotiated across handoffs. The master is the lone exception (neutral concierge, never coaches; reciting the planned session is a factual read, not a training judgment — the moment "why / how hard / is it safe / modulate" is needed, it escalates to `pace-coach`).
- **The three extension axes stay distinct** — Sport = knowledge pack; Domain = parallel advisor with its own artefact; **Method (a coach's training philosophy) = a pack** (Markdown + CSV: `periodization-rules.csv`, `methods.csv`) the Planner consumes, injected via `customize.toml` + knowledge files, **never** by editing a persona.
- **Markdown vs. structured data** split and the CSV guardrails are unchanged.

## 7. BMAD posture

- **Runtime:** PACE stays **100% standalone** — no dependency on a BMAD install, no Python, no `uv`. We *borrow the patterns* (agent + menu, `customize.toml` merged by the LLM, capabilities = local files), not the runtime.
- **Build-time:** we **use the `bmad-builder` skills as a one-shot authoring tool** (`bmad-agent-builder` to (re)build each voiced agent to its prompt-quality canon, `bmad-workflow-builder` for the shared tools, `bmad-module-builder` to scaffold the module + a help registry), then ship without them.
- **Distribution:** unchanged — PACE is already a Claude Code plugin via `.claude-plugin/marketplace.json`, the same rail BMAD uses. License stays open (MIT), aligned with BMAD.
- **pace-chat / Agent SDK:** this model is *more* portable, not less — local-file capability loads work identically under the SDK, whereas skill->skill chaining is even more fragile there. The redesign de-risks pace-chat.

## 8. Consequences / next steps

1. Rewrite `01_architecture.md`, `02_method.md`, `05_skill_map.md` to this model (the master+menu, the 7-skill tree, capabilities-as-local-files, customize.toml mechanism). Until then this ADR is authoritative.
2. Re-scaffold `src/` to the 7-skill tree; move former workflow skills into their owning agent as local capability files (e.g. `pace-coach/references/checkin.md`, `…/adjust.md`).
3. Add each agent's `customize.toml` with `[[agent.menu]]` and `[surface]`; delete `pace-customize` as a skill (keep its rules as the merge spec the agents follow).
4. Re-validate against the six V0 scenarios (`04_evaluation.md`) — the scenarios are unchanged; they must still pass.

## 9. Decided micro-points

- `pace-elicitation` and `pace-validate` stay as **shared skills called as tools**, not duplicated local files — they are genuinely reused and heavy, the legitimate BMAD `skill =` case.
- The master's welcome menu is the BMAD `[[agent.menu]]` rendered for a non-technical user (pace-chat), plus a "talk freely" escape hatch that drops into detection.
