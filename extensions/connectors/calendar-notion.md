# Notion Calendar — calendar instance

`connector_id: notion-calendar` · `class: calendar` · `degraded_fallback: local-csv` · conforms to [`_schema.md`](_schema.md).

Sessions pushed as rows in a **Notion sessions database** — most useful when Notion is already the storage backend (same workspace, one less connection). Multi-class: Notion can be both `storage` and `calendar` simultaneously via separate pages.

## capability_probe (plain language)

Notion MCP tools are available (`notion-create-database`, `notion-create-pages`, `notion-update-page`). Absent -> degrade to `local-csv`. Config key: `integrations.notion_calendar_db_id` in `pace.config.toml` (empty -> create the database on first use and record the ID).

## Database schema

| Property | Type | Semantics |
|---|---|---|
| Name | Title | Session name |
| Date | Date | Planned session date |
| Week | Text | Training week label |
| Type | Select | `endurance \| threshold \| vo2 \| sprint \| recovery \| rest` |
| Zone | Select | `Z1`–`Z5` |
| Duration (min) | Number | Planned duration |
| Structure | Text | Workout description |
| Status | Select | `planned \| completed \| adjusted \| skipped` |

## Write / update rule

Same as `calendar-gcal.md`: create on new session, update (not recreate) on adjust/skip. Use `notion-update-page` targeted on the row.

## hard_rules

- One database row per session; update on adjust/skip.
- JSON artefacts (`profile.json`, `zones.json`) are **never** scattered into Notion properties — those stay in `storage-notion.md` as verbatim code blocks.
- If Notion is also the storage backend, the sessions database lives as a **child** of the root PACE page.
- Never read rows as training signals.
