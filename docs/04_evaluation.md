# 04 — Evaluation

> *Commit and pray is not a strategy. It's a symptom.*

An LLM's outputs are non-deterministic, all the more so because **the host (the `pace` master + the agent) orchestrates**. Without structured evaluation, there's no way to know whether a change to the method improves or degrades the result.

We no longer evaluate a coded orchestrator. **We evaluate the artefacts** (vision, plan, session), the **adherence to the method**, and the **master's routing decisions**.

---

## What we test

| Level | Question | Example check |
|---|---|---|
| **Routing** | Did the `pace` master propose the right agent? | "injury" -> proposes partial Discovery / rolling |
| **Artefact form** | Does the vision have the right sections? | the 7 template sections (checklist) |
| **Plan coherence** | Does the plan respect periodization? | conforms to `periodization-rules.csv` |
| **Method adherence** | Did Run mode regenerate a session? | ❌ forbidden — it must read the plan |
| **Adjustment decision** | Did Adjust follow the table? | conforms to `adjustment-decisions.csv` |
| **Memory coherence** | Are the `learned_behaviors` respected? | "responds badly to 2 hard days" -> never 2 hard days |

The CSV files make several of these checks **near-deterministic**: we compare the output to a table, not to a fuzzy judgment. The `.md` checklists serve as rubrics for the qualitative checks.

---

## The five loops (kept, readapted)

| Loop | Nature | Central question | From V0? |
|---|---|---|---|
| **Human-in-the-loop** | Technical | Does the system do what it should? | ✅ (maintainer) |
| **Athlete-in-the-loop** | Felt experience | Is it useful and fitting? | ✅ (test athlete) |
| **Expert-in-the-loop** | Expertise | Is it physiologically sound? | ✅ (KB + tables) |
| **Data-in-the-loop** | Ground truth | Does the data confirm the felt experience? | ❌ (-> V3, Strava) |
| **Scenario-in-the-loop** | Edge cases | Does it hold under pressure? | ✅ **top priority** |

> The loops can contradict each other — that's where it gets interesting. A session can be technically coherent, well received, yet physiologically questionable.

### Expert-in-the-loop — the most rewarding first

The expert validates the **knowledge** (`principles/*.md`, `cycling.json`) **and the CSV tables** (`periodization-rules.csv` above all, including the `race`/`recovery` rows and the bounds of `adjustment-decisions.csv`) *before* the personas are written. Fixing the base is cheaper than fixing the outputs. Target profiles: certified coaching trainers, TrainingPeaks coaches, sports-science labs. Pitch: "open-source tool, we're looking for an expert to validate the sporting relevance — no code, just the expertise."

---

## Scenario-in-the-loop — to write first

Before writing the personas, we define edge cases + the **expected properties** (not the exact output). They define what the method must do.

```
scenarios/
├── 01_overload_constraints.md   <- fatigue + taper + pain + 45min + heatwave -> rest, NO structured session
├── 02_memory_persistence.md     <- "responds badly to 2 hard days" in wk.1 -> respected in wk.4?
├── 03_profile_contradiction.md  <- "vegetarian" constraint -> no inconsistent recommendation
├── 04_taper_override.md         <- taper D-5, athlete wants 4h -> refuse/advise against, explaining
├── 05_degraded_input.md         <- no sensation provided -> asks the right questions, does not hallucinate
├── 06_routing.md                <- varied messages -> does the master propose the right mode?
└── 07_measured_debrief.md       <- (V3) planned-vs-actual on anonymised Strava fixture; checks: log reflects KPIs, strava_baseline updated, no invented session
```

---

## Tooling

LangGraph/LangSmith are out (no more coded orchestrator). Simple and fitting:

| Tool | Use | When |
|---|---|---|
| Markdown scenarios + manual grid | Check expected properties | From V0 |
| Output <-> CSV comparison | Deterministic checks (periodization, adjustment) | From V0 |
| `skill-creator` (built-in eval) | Test/iterate the skills, measure triggering | From V0 |
| Promptfoo | Compare several LLMs on the same scenarios | V1+ |
| LLM-as-Judge | Qualitative evaluation at scale | V1+ |
| CSV / spreadsheet grid | Tracking expert reviews | From V0 |

*Last updated: June 2026*
