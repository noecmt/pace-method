# Google Calendar — calendar instance

`connector_id: gcal` · `class: calendar` · `degraded_fallback: local-csv` · conforms to [`_schema.md`](_schema.md).

Sessions pushed as **calendar events** to the athlete's Google Calendar via the Google Calendar MCP.

## capability_probe (plain language)

A Google Calendar MCP tool is available in this session (`mcp__claude_ai_Google_Calendar__*`, after OAuth). Absent / unauthenticated -> degrade to `local-csv`.
> Status: only auth tools are exposed until the user authorizes (`mcp__claude_ai_Google_Calendar__authenticate` then `complete_authentication`). Confirm exact file-tool names on first connect.

## Config (from `pace.config.toml`)

```toml
[integrations]
gcal_calendar_id = "primary"   # or a specific calendar ID from the athlete's account
```

## Event format

| Field | Value |
|---|---|
| Title | `[PACE] {session_name}` |
| Start | `{date}T{preferred_time}` (athlete's preferred training time; default `07:00` local) |
| End | Start + `duration_min` |
| Description | Full session structure (workout steps, target zones, intent) |
| Calendar | `integrations.gcal_calendar_id` |

## Write / update rule

- **New session** -> create event.
- **Session adjusted** (the coach's `adjust` capability) -> update the existing event (description + duration); do **not** delete and recreate.
- **Session skipped** -> update title to `[PACE — skipped] {session_name}`; keep the event for the audit trail.

## hard_rules

- One event per planned session; no duplicate creates.
- Store the Google event ID alongside the session record in `log/` for future updates.
- Never read calendar events as training signals.
