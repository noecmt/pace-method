# Method pack — schema (contract)

Axis 3 of extension. A **method** (polarized, double-threshold, block periodization…) is a *planning strategy* the **Planner consumes**. It is a pack (Markdown + CSV of session structures), never a new agent. Frozen here even before implementation, so the interface is stable.

## A method pack declares

| Field | Meaning |
| --- | --- |
| `method_id` | Unique id (e.g. `polarized`, `double_threshold`). |
| `version` | Pack version. |
| `summary.md` | The strategy in prose: principle, intensity distribution, who it suits, contraindications. |
| `session_structures` | CSV of the canonical session structures the strategy uses: `session_id, phase, zones, structure, purpose`. The Planner draws sessions from here. |
| `periodization_bias` | How it shapes blocks (e.g. intensity distribution per phase) — must remain compatible with `periodization-rules.csv`. |
| `references` | Sources backing the strategy. |

## Hard rules

- **Consumed by the Planner only.** A method changes *how the plan is built*, not who builds it. No new persona.
- **Must conform to `periodization-rules.csv`.** A method may be more restrictive, never illegal for a phase (no forbidden intensity).
- **Session structures, not invented runtime sessions.** The catalog is fixed in the pack; the Run coach still never generates.
- Optional: a `method-onboarding` workflow (explain -> short trial -> Analyst measures -> adopt/discard).

## Example (illustrative, not implemented in V0)

```text
method_id: polarized
session_structures.csv: id,phase,zones,structure,purpose
periodization_bias: ~80% Z1-Z2 / ~20% Z4-Z5, minimal Z3
```
