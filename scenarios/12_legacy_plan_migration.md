# Scenario 12 — Legacy plan.md migrates to index.csv + weeks/*.json

**Tests:** the **one-time legacy migration** in the planner's `plan-write` capability. A pre-v0.5.0 athlete repo whose `plan/plan.md` holds inline near-horizon week tables (no `index.csv`, no `weeks/*.json`) must, on the next Build, be converted to the structured format in a **visible diff** — never grepped/improvised at read time, never silently overwritten.

## Setup

- A workspace with a **legacy** `plan/plan.md`: far + mid narrative **plus** two inline near-horizon week tables (e.g. "Semaine 1 (Jun 9–15)", "Semaine 2 (Jun 16–22)"), each listing dated sessions with zone labels.
- **No** `plan/index.csv` and **no** `plan/weeks/` directory.
- `athlete/profile.json` + `athlete/zones.json` present (fixtures `athlete/sample.json` / `athlete/sample-zones.json`) so concrete bounds can be resolved.
- `pace.config.toml` with `[surface].language = "fr"`.

## Input

> "/pace-plan"   (forces Build; the Planner's `plan-write` capability detects the legacy shape)

(Adversarial sub-case: while the legacy plan still exists, "quelle est ma séance du jour ?" must **not** grep `plan.md` — the coach's `checkin` capability reports the missing `index.csv` and routes to Build.)

## Expected properties

- [ ] `plan/index.csv` is created — one row per week across far/mid/near; **exactly one** near row `status:active`, selected by **today ∈ [start,end]**.
- [ ] One `plan/weeks/<week_id>.json` is created **per detailed legacy week**, each session `{date, type, planned{…concrete bounds from zones.json…}, status, actual:null}`.
- [ ] `plan/plan.md` is **reduced** to far + mid + the near-horizon pointer; a **change-log row** records the migration (date · reason · diff-visible).
- [ ] `week_id` = ISO week label of the week's `start` date; `start`/`end` keep the athlete's real (e.g. Tue->Mon) span.
- [ ] Every migrated session is **phase-legal** against `periodization-rules.csv`; the result passes `pace-validate`.
- [ ] The Build wrap-up is delivered by the **Planner** in **French** (one message) — the `plan-write` capability prints nothing itself.

## Anti-properties (must NOT happen)

- [ ] ❌ The coach's `checkin` capability greps / parses `plan.md` to answer a Run question while `index.csv` is absent (the old "Searched for 2 patterns" fallback).
- [ ] ❌ A past/completed week is silently overwritten or lost (history must be preserved; migration is a visible diff).
- [ ] ❌ A legacy session illegal for its phase is silently "fixed" rather than surfaced to the Planner.
- [ ] ❌ An invented fitness marker / zone is used to fill `planned` (absent marker => coarser system or qualitative, never fabricated).

## Deterministic check

After "/pace-plan": `plan/index.csv` exists with exactly one `status:active` near row whose `[start,end]` contains today; `plan/weeks/` contains one JSON per legacy detailed week; `plan.md` no longer carries inline near tables; `pace-validate` => VALID. Any of {no index.csv, >1 active week, an overwritten past week, an unvalidated/illegal session} => **fail**.

**Gate:** a legacy `plan.md` upgrades to `index.csv` + `weeks/*.json` on the next Build, in a visible diff, validated, with no silent loss — and Run never improvises from Markdown in the meantime.
