# Calendar — session delivery connector (class)

`class: calendar` · `degraded_fallback: local-csv` · conforms to [`_schema.md`](_schema.md).

Pushes **upcoming planned sessions** from `plan/plan.md` to the athlete's scheduling tool. One-way: PACE -> calendar. The calendar is a **view** of the plan, never a source of truth — the plan wins on any conflict.

## Resolution rule (no runtime)

1. Read `[connectors].calendar` from `pace.config.toml` (default `"local"`).
2. Probe the capability. Present -> use it. Absent -> degrade down the chain: `gcal` -> `notion-calendar` -> `local-csv`.
3. On `local` / `local-csv`: write `plan/calendar.csv`.

## Writers

`pace-plan-write` (initial push), `pace-rolling` (rolling window), `pace-adjust` (single session update). No other skill touches the calendar connector.

## Hard rules

- **One-way: PACE -> calendar.** Never read the calendar as a training signal; that path goes through `pace-checkin` / `pace-agent-analyst`.
- **Reflects the plan, never shapes it.** An entry in the calendar has no authority over `plan/plan.md`.
- **Never generates a session.** The calendar entry copies what is already in the plan.
- PACE works fully without any calendar connector (`local-csv` is always available).

## Instances

| `connector_id` | Backend | capability_probe | When |
|---|---|---|---|
| `local-csv` | `plan/calendar.csv` on the local filesystem | always available | **default** |
| `gcal` | Google Calendar via its MCP | a Google Calendar MCP tool is available | most accessible for non-dev athletes |
| `notion-calendar` | a Notion sessions database | a Notion MCP tool is available | when Notion is already the storage backend |

Details: [`calendar-local.md`](calendar-local.md), [`calendar-gcal.md`](calendar-gcal.md), [`calendar-notion.md`](calendar-notion.md).
