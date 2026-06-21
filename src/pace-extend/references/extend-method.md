# extend-method — author a method pack in the athlete repo

A **capability of pace-extend**, not a separate skill: a local file you read into the same context. **Following it is not a handoff and not a voice change** — you are still pace-extend. Its single responsibility is to author a **new method pack** as `<athlete-repo>/knowledge_base/methods/<method_id>/` (three files), conforming to the frozen method-pack schema and **legal against `periodization-rules.csv`**, then gate it through `pace-validate`. This file production has no voice.

## A method pack is a planning strategy the Planner consumes

A method is **axis 3** of extension: a *planning strategy* (polarized, pyramidal, double-threshold, block) the **Planner consumes** — never a new agent. It shapes *how the plan is built*, not *who builds it*. The shipped base pack is `polarized`; this capability lets the athlete author another in their own repo.

## Inputs

- The template folder [`knowledge_base/methods/_template/`](../../../knowledge_base/methods/_template/) — `pack.toml`, `METHOD.md`, `session_structures.csv`; copy it whole.
- The curated worked example `knowledge_base/methods/polarized/` — diff against it for a complete, legal pack.
- The contract `extensions/methods/_schema.md` — the frozen fields and hard rules.
- The phase rules `src/pace-planner/assets/periodization-rules.csv` — `phase,allowed_intensity,forbidden,volume_modifier`. **Every session structure must be legal against this.**
- `pace-elicitation` (as a tool); the `pace-validate` tool.

## Procedure

1. **Fix the `method_id`** — a lowercase identifier matching the folder (`pyramidal`, `double_threshold`). The pack is `<athlete-repo>/knowledge_base/methods/<method_id>/`. A collision with `polarized` (or another base id) means the **local pack overrides** the base (same relative path, local wins) — confirm intent.
2. **Copy `_template/`** to that local path (all three files).
3. **Write the three files** (via `pace-elicitation` for the strategy details), conforming to `extensions/methods/_schema.md`:
   - **`pack.toml`** — `method_id`, `version`, `periodization_bias` (a **descriptive** string of the intensity distribution per phase — e.g. "~80/20 polarized", "pyramidal"), `references[]`. **Do not** add `overrides_periodization` — it does not exist in the contract.
   - **`METHOD.md`** — the strategy in prose: principle, intensity distribution, who it suits, contraindications. (The Planner's `plan-write` reads this file **by name**.)
   - **`session_structures.csv`** — **exact columns** `session_id,phase,zones,structure,purpose`. The canonical session structures the Planner draws from.
4. **Enforce phase-legality — the load-bearing rule.** `periodization_bias` is **descriptive, never prescriptive**: a method may **restrict** a phase's distribution, but may **never** authorise an intensity `periodization-rules.csv` forbids for that phase. Check **every** `session_structures.csv` row: its `zones` ⊆ the phase's `allowed_intensity` and ∩ `forbidden` = ∅. (E.g. `base` forbids `Z4,Z5`, so the "hard" portion of an 80/20 method in base reduces to Z3/limited sweet-spot; real Z4–Z5 lives in `build`. Taper/race/recovery = Z1–Z2 only.) An illegal row is **rejected**, not "fixed silently".
5. **Validate.** Call `pace-validate` on the pack against `extensions/methods/_schema.md`; keep `session_structures.csv` lint-clean. On INVALID, return the offending row + the violated phase rule and re-elicit — **never auto-fill**.

   > Linter note: `tools/lint-contracts.mjs` does **not** inspect `knowledge_base/methods/`. Method conformance here is the by-hand `pace-validate` check against `_schema.md` + the phase-legality check above.
6. **Tell them how to activate it.** Activation is **declarative and separate**: the athlete adds
   ```toml
   [method]
   pack = "<method_id>"
   ```
   to `pace.config.toml`. State that exact line. The Planner then reads the pack's `METHOD.md` + `session_structures` at plan time (resolved via the override stack) and **cites it** in its reasoning.

## Output discipline

Emit **no user-facing text of its own**. The files written, the VALID/INVALID outcome, and the activation line are **internal results**; *you*, pace-extend, voice the single result message in `[surface].language`. Never print the pack files or the validator report to the athlete.

## Prohibitions (do not cross)

- ❌ **Never author a session structure illegal for its phase** (a `zones` value in the phase's `forbidden` set). The Planner's deterministic phase-legality check governs; a method may restrict, never legalise.
- ❌ **Never add `overrides_periodization`** or any field absent from `extensions/methods/_schema.md`.
- ❌ **Never invent session structures** beyond what the strategy actually specifies.
- ❌ **Never write into the plugin install** — the pack lands in `<athlete-repo>/knowledge_base/methods/`.
- ❌ **Never write `pace.config.toml`'s `[method]` declaration for them** — authoring and activation are separate; you give the line, the athlete activates.
- ❌ **Never skip validation or auto-fill** to pass it.
