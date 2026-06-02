# Domain pack — schema (contract)

Axis 2 of extension. A **domain** (nutrition, recovery, mental, strength…) is a *parallel advisor*: a persona/workflow that **reads** the Plan/Session and writes **its own** artefact. **It never touches the training Plan.** Frozen here even before implementation, so the interface is stable.

## A domain pack declares

| Field | Meaning |
| --- | --- |
| `domain_id` | Unique id (e.g. `nutrition`, `recovery`). |
| `version` | Pack version. |
| `persona` | The advisor's voice and role (one role, one voice — separate from coaching personas). |
| `reads` | Which artefacts it consumes - from `{ plan, session, profile, log }`. **Read-only.** |
| `writes` | Its **own** output artefact path (e.g. `nutrition/nutrition.md`). Never `plan/` or `vision/`. |
| `triggers` | When the advisor runs (e.g. weekly, on a long session, on request). |
| `references` | Sources backing the advice. |

## Hard rules

- **Never writes `plan/plan.md` or `vision/vision.md`.** Output goes only to the domain's own artefact.
- **Read-only on coaching artefacts.** It reacts to the plan; it does not shape it.
- One domain = one parallel persona/workflow + one output artefact. Adding a domain never modifies the trunk or the coaching personas.

## Example (illustrative, not implemented in V0)

```text
domain_id: nutrition
reads: [plan, session]
writes: nutrition/nutrition.md
triggers: [weekly, on_long_session]
```

The nutrition advisor reads weekly volume and the next long session, then writes fueling recommendations to `nutrition/nutrition.md` — without altering a single training session.
