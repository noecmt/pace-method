# Scenario 10 — Language persists across all personas

**Tests:** the single language source. With `pace.config.toml` `[surface].language = "fr"`, **every** persona answers in French — the regression where one agent's language was not respected by the others is gone. `profile.json.language` is ignored.

## Setup

- `pace.config.toml` at the workspace root with `[surface].language = "fr"`.
- A valid `vision/vision.md` + `plan/plan.md` + `athlete/profile.json` (fixture `athlete/sample.json`) so all modes can be exercised.
- (Adversarial sub-case: `athlete/profile.json` still carries a stale `"language": "en"` — it must be **ignored**; `fr` from `pace.config.toml` wins.)

## Input

A short interaction that touches several personas, e.g.:

> 1. "/pace-today" (Run — Daily coach)
> 2. "/pace-plan" (Build — Planner)
> 3. "/pace-discovery" (Discovery coach)
> 4. "j'ai sauté mes deux dernières séances" (Debrief — Analyst)

## Expected properties

- [ ] **Every** persona reached (Discovery coach, Planner, Daily coach, Analyst) responds in **French**.
- [ ] Each persona **loads `pace-customize` first** and applies `[surface].language` **before its first words** — no English preamble that then "switches" to French.
- [ ] The language source is **`pace.config.toml` only**; `profile.json.language` is **ignored** (adversarial sub-case: `en` in the profile does not override `fr`).

## Anti-properties (must NOT happen)

- [ ] ❌ Any persona answers in English while `pace.config.toml` says `fr`.
- [ ] ❌ A persona reverts to the `en` pack default after another persona spoke French.
- [ ] ❌ `profile.json.language` overrides `pace.config.toml` (wrong precedence).

## Deterministic check

With `pace.config.toml` `[surface].language = "fr"`, no persona output is in English.
Any persona turn produced in English => **fail** for that persona.

**Gate:** one language source (`pace.config.toml`), loaded first by every persona; all personas hold the chosen language; `profile.json.language` ignored.
