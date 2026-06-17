# Training principle — schema (contract)

A **training principle** is cross-cutting training knowledge — a physiological law, a periodization rule, a recovery heuristic, a method's rationale — written as a Markdown file with YAML frontmatter. It is **knowledge only**: never a persona, never a workflow, never a runtime session. Personas **load a principle on demand** to explain the *why* behind a decision; the **CSV decision tables remain the deterministic guardrail** (a principle explains a rule, it never overrides one). The reference instances live next to this file (`periodization.md`, `recovery_basics.md`, …).

## Required frontmatter

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Unique id, matches the filename without extension (e.g. `periodization`). Stable — personas reference it. |
| `category` | enum | `principle` (a physiological/training law) **or** `method` (the *rationale* of a strategy — see the boundary rule below). |
| `applies_to` | array | Sports it applies to (`[cycling]`, `[cycling, running]`) or `[all]`. |
| `source` | string | Short attribution (author/work) for quick reference. |
| `references` | array | Full citations (book ISBN, paper DOI/URL) backing the claim. **At least one.** |
| `version` | integer | Bump on a substantive content change. |

## Body

Prose only — the principle stated plainly, then "why it works" / "hard rules" as the file needs. Keep it concise and **citable**: every quantitative claim should trace to a `references` entry (these are what the Sprint 6 expert reviews).

## Hard rules

- **Knowledge only.** No persona, no workflow logic, no agent. Adding a principle never adds an agent — a persona merely *reads* it.
- **Never overrides a guardrail.** A principle is the narrative *why* behind the CSV tables (`periodization-rules.csv`, `adjustment-decisions.csv`), not a competing source of truth. If a principle and a table disagree, the **table wins** and one of them is wrong -> reconcile it with a visible diff, don't let the prose drift.
- **`principle` vs `method` — the boundary.** A `category: method` file here is only the *narrative rationale* of a strategy (e.g. `polarized_training.md`: the 80/20 idea + why). A **full method** that also ships a fixed catalogue of session structures is heavier and graduates to a **Method pack** under [`extensions/methods/_schema.md`](../../extensions/methods/_schema.md) (`summary.md` + `session_structures.csv` + `periodization_bias`). Rule of thumb: prose-only rationale -> a principle here; prose **+ a session-structure CSV the Planner draws from** -> a method pack.
- **Wired, not orphaned.** A principle that should inform reasoning is referenced from the relevant persona's *Inputs* as load-on-demand (e.g. the Planner reads `periodization`/`polarized_training`/`progressive_overload`; the Run coach's `adjust` capability reads `recovery_basics`). An unreferenced principle is dormant knowledge, not a behaviour change.

## How to add one

1. Drop `knowledge_base/principles/<id>.md` with the required frontmatter + prose.
2. Add at least one real `references` citation (the V0 set uses Coggan, Seiler, Bompa, Friel, the ECSS/ACSM overtraining consensus, Kellmann).
3. If it should shape a persona's reasoning, add a one-line load-on-demand reference in that persona's *Inputs*. No code, no new agent.

## Validation

A principle file is valid if: all required frontmatter keys are present and well-typed, `category ∈ {principle, method}`, `applies_to` is non-empty, and `references` has at least one entry.

> **Contracts-first, not frozen-forever.** This contract may be refined during the Sprint 6 expert review (e.g. a new field, a tighter `category`) — keep any change diff-visible and the existing files lint-clean.
