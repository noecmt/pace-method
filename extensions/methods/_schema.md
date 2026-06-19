# Method pack — schema (contract)

Axis 3 of extension. A **method** (polarized, double-threshold, block periodization…) is a *planning strategy* the **Planner consumes**. It is a pack (Markdown + CSV of session structures), never a new agent. Frozen here even before implementation, so the interface is stable.

## A method pack declares

| Field | Meaning |
| --- | --- |
| `method_id` | Unique id (e.g. `polarized`, `double_threshold`). |
| `version` | Pack version. |
| `METHOD.md` | The strategy in prose: principle, intensity distribution, who it suits, contraindications. (The Planner's `plan-write` capability reads this file by name.) |
| `session_structures` | CSV of the canonical session structures the strategy uses: `session_id, phase, zones, structure, purpose`. The Planner draws sessions from here. |
| `periodization_bias` | How it shapes blocks (e.g. intensity distribution per phase) — must remain compatible with `periodization-rules.csv`. |
| `references` | Sources backing the strategy. |

## Hard rules

- **Consumed by the Planner only.** A method changes *how the plan is built*, not who builds it. No new persona.
- **Must conform to `periodization-rules.csv`.** A method may be more restrictive, never illegal for a phase (no forbidden intensity).
- **Session structures, not invented runtime sessions.** The catalog is fixed in the pack; the Run coach still never generates.
- Optional: a `method-onboarding` workflow (explain -> short trial -> Analyst measures -> adopt/discard).

## Resolution (override stack)

A plugin install is **read-only**, so a method pack resolves at **two locations**, the **local copy winning** on an `id` collision:

1. **`<athlete-repo>/knowledge_base/methods/<id>/`** — the athlete's local pack (written by the user / `pace-extend`). **Wins.**
2. **`<plugin-install>/knowledge_base/methods/<id>/`** — the curated base pack shipped with the method.

The athlete repo **mirrors the plugin's relative tree**, so the rule is simply *"same relative path, local wins"*. **Both sides obey this same contract** — a local pack must satisfy these fields and hard rules exactly as a base pack does. The plugin's `extensions/` (contracts) is **not** mirrored locally.

## Example (illustrative, not implemented in V0)

```text
method_id: polarized
session_structures.csv: id,phase,zones,structure,purpose
periodization_bias: ~80% Z1-Z2 / ~20% Z4-Z5, minimal Z3
```
