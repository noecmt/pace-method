# Scenario 15 — Custom method pack (polarized) + override stack

**Tests:** the **method** extension axis end-to-end. With `pace.config.toml` declaring `[method] pack = "polarized"`, the Planner consumes the curated pack (`knowledge_base/methods/polarized/`) — citing it, drawing sessions from its `session_structures.csv`, and shaping the ~80/20 distribution — **without ever authorising an intensity that `periodization-rules.csv` forbids for the phase**. A second sub-case checks the **override stack**: a local pack with the same `method_id` wins over the shipped baseline.

## Setup

- Athlete: `athlete/sample.json` (FTP 250 W). A valid Vision exists; the athlete is in a `build` block with a `base` block earlier in the season.
- Config: `pace.config.toml` declares `[method] pack = "polarized"`.
- Method pack: `knowledge_base/methods/polarized/` (`METHOD.md` + `session_structures.csv` + `pack.toml`, `periodization_bias` = ~80% Z1–Z2 / ~20% Z4–Z5, minimal Z3).
- Phase-legality contract: `src/pace-planner/assets/periodization-rules.csv` (base forbids `Z4,Z5`; build allows all; taper/race/recovery Z1–Z2 only).

## Input

> "/pace-plan"  (force Build — roll the next ~2-week window)

## Expected properties

- [ ] The Planner reads the pack **only because** `pace.config.toml` declares it, and **cites it explicitly** in its reasoning (e.g. "per the polarized method…") so conformance is auditable.
- [ ] Sessions in the detailed window are **drawn from `session_structures.csv`** for the relevant phase (e.g. `build_endurance`, `build_vo2max`/`build_threshold`, `build_recovery`) — not invented structures.
- [ ] The week reflects the **~80/20 distribution**: the bulk of time is Z1–Z2 endurance, the hard touch is a minority, Z3 ("no man's land") is minimised.
- [ ] **Phase legality governs the pack.** In a **base** week the polarized "hard ~20%" appears only as Z3 / sweet-spot (`base_sweetspot`) — **never Z4/Z5** (forbidden in base). The true Z4–Z5 hard sessions appear only in **build**.
- [ ] **Sub-case (override stack):** with a **local** pack at `<athlete-repo>/knowledge_base/methods/polarized/` (same `method_id`), the Planner resolves and cites the **local** pack's `session_structures.csv`, **not** the shipped baseline — "same relative path, local wins".

## Anti-properties (must NOT happen)

- [ ] ❌ Does **not** prescribe a Z4 or Z5 session in a **base** week (or any intensity in the phase's `forbidden` set) — the `periodization_bias` never overrides `periodization-rules.csv`.
- [ ] ❌ Does **not** read or apply the method pack when `pace.config.toml` declares no `[method] pack`.
- [ ] ❌ Does **not** compose sessions absent from the pack's `session_structures.csv` (no improvised structure).
- [ ] ❌ Does **not** let the shipped baseline shadow a local pack of the same `id` (override stack inverted => fail).

## Deterministic check

For each planned session in the detailed window: its `zones` ⊆ the active phase's `allowed_intensity` **and** its `zones` ∩ the phase's `forbidden` = ∅ (`periodization-rules.csv`); and its `session_id` exists in the **resolved** `session_structures.csv` for that phase. Any session whose zones intersect the phase's `forbidden` set (e.g. a Z5 session in a base week), or any `session_id` not present in the resolved pack, => **fail**. Override sub-case: when a local pack is present, the cited rows must trace to the **local** file.

**Gate:** the plan cites the active pack, draws sessions only from its (resolved, local-wins) `session_structures.csv`, respects the ~80/20 bias, and never prescribes a phase-forbidden intensity.
