# Calendar — session delivery connector (class)

`class: calendar` · `degraded_fallback: local-csv` · conforms to [`_schema.md`](_schema.md).

Pushes **upcoming planned sessions** from `plan/plan.md` to the athlete's scheduling tool. One-way: PACE -> calendar. The calendar is a **view** of the plan, never a source of truth — the plan wins on any conflict.

## Resolution rule (no runtime)

1. Read `[connectors].calendar` from `pace.config.toml` (default `"local"`).
2. Probe the capability. Present -> use it. Absent -> degrade down the chain: `gcal` -> `notion-calendar` -> `local-csv`.
3. On `local` / `local-csv`: write `plan/calendar.csv`.

## Writers

The planner's `plan-write` capability (initial push), the planner's `rolling` capability (rolling window), the coach's `adjust` capability (single session update), and the Analyst (session status -> `completed`/`skipped` post-execution). No other capability touches the calendar connector.

## Hard rules

- **One-way: PACE -> calendar.** Never read the calendar as a training signal; that path goes through the coach's `checkin` capability / the Analyst (`pace-analyst`).
- **Reflects the plan, never shapes it.** An entry in the calendar has no authority over `plan/plan.md`.
- **Never generates a *planned* session.** The calendar entry copies what is already in the plan. *Exception, status-only:* an `unplanned` session the Analyst recorded (an executed off-plan activity) may be reflected as a **`completed`** row in `plan/calendar.csv` (the local fallback); a status-only MCP calendar simply has no pre-existing event to update — a clean degradation, never a fabricated future event.
- PACE works fully without any calendar connector (`local-csv` is always available).

## Instances

| `connector_id` | Backend | capability_probe | When |
|---|---|---|---|
| `local-csv` | `plan/calendar.csv` on the local filesystem | always available | **default** |
| `gcal` | Google Calendar via its MCP | a Google Calendar MCP tool is available | most accessible for non-dev athletes |
| `notion-calendar` | a Notion sessions database | a Notion MCP tool is available | when Notion is already the storage backend |

Details: [`calendar-local.md`](calendar-local.md), [`calendar-gcal.md`](calendar-gcal.md), [`calendar-notion.md`](calendar-notion.md).
