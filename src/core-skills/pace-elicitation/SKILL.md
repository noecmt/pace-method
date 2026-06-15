---
name: pace-elicitation
user-invocable: false
description: >-
  Elicitation toolkit for PACE coaching personas (the Discovery coach above all, and any
  persona that must ask the athlete a question). Invoked BY another PACE skill — not a
  user-facing entry point — to pick the right questioning technique for the situation
  (vague answer, competing goals, contradiction with the profile, fuzzy goal, effort
  calibration, overwhelmed athlete…). It selects from a fixed catalogue (`methods.csv`)
  and keeps questions concise and targeted. It has no voice of its own and produces no
  artefact.
---

# pace-elicitation — questioning toolkit

A **core skill**, not a persona: it has **no voice and writes no artefact**. A persona (usually the Discovery coach) loads it to choose *how* to ask the next question. The calling persona keeps speaking in its own voice; this skill only supplies the technique.

## How to use it

1. Identify the **situation** in the conversation (the athlete gave a vague answer, named two competing goals, said something that conflicts with the profile, etc.).
2. Open [`methods.csv`](methods.csv) and match the situation against the **`when_to_use`** column.
3. Apply the matched technique's **`description`** as the shape of your next question.
4. Use at most **one or two** techniques per turn. Ask, then listen.

## `methods.csv` at a glance

| Situation | Technique |
|---|---|
| Start of discovery | `open_question` — let the athlete talk freely |
| Vague / ambiguous answer | `probe_on_ambiguity` |
| Multiple competing goals | `trade_off` — force a prioritisation |
| Answer conflicts with profile/vision | `reflect_back` — restate to surface the contradiction |
| Before judging feasibility | `constraint_elicitation` — what is non-negotiable |
| Goal is fuzzy/abstract | `scenario_projection` — project into race day |
| Subjective effort to quantify | `scale_anchoring` — anchor words to RPE |
| Building the `learned_behaviors` baseline | `what_works` — what has worked / failed |
| Athlete overwhelmed / over-broad | `one_thing` — the single most important thing now |
| End of discovery | `summarize_confirm` — confirm before writing the vision |

`methods.csv` is the source of truth; the table above is a reading aid.

## Rules

- **Concise and targeted.** One sharp question beats a paragraph. Never dump a long questionnaire on the athlete (this is the anti-property tested by `scenarios/05`).
- **Don't fabricate.** Ask about what you don't know; never assert a fact (fatigue, sleep, mood) the athlete didn't provide.
- **Overwhelmed -> `one_thing`.** When the athlete is over-broad or stressed, narrow rather than widen.
- **Match, don't improvise.** Pick a technique that fits the `when_to_use` situation; don't invent a new questioning style outside the catalogue.
- **No artefact, no voice.** You never write `vision.md`/`plan.md` and never adopt a persona — you hand the technique back to the calling persona.

## Output discipline

You produce **no user-facing text**: you hand a *technique shape* back to the calling persona, which asks the question in its own voice and in `[surface].language`. Never address the athlete directly or narrate your choice of technique (`docs/02_method.md`, "Single voice, silent pipeline").
