# Local CSV — calendar instance

`connector_id: local-csv` · `class: calendar` · always available · this IS the universal fallback · conforms to [`_schema.md`](_schema.md).

Artefact: **`plan/calendar.csv`** — a structured projection generated from `plan/weeks/*.json` (the source of truth for sessions). No external dependency; no MCP required. **Never edited by hand; never the source** — `weeks/*.json` is the source and `calendar.csv` is the generated view.

## Format

```csv
date,week,session_id,type,name,duration_min,primary_zone,structure,status
2026-06-10,W1,S001,endurance,Z2 Endurance,90,Z2,"3×20 min Z2 + warmup/cooldown",planned
2026-06-12,W1,S002,threshold,Threshold Blocks,75,Z4,"3×10 min Z4 @ 95 % FTP",planned
```

| Column | Values / semantics |
|---|---|
| `date` | ISO 8601 (`YYYY-MM-DD`), planned session date |
| `week` | Training week label (matches `plan.md` heading) |
| `session_id` | Reference to the session: `<week_id>/<date>` (maps into `plan/weeks/<week_id>.json`) |
| `type` | `endurance \| threshold \| vo2 \| sprint \| recovery \| rest` |
| `name` | Human-readable session name |
| `duration_min` | Planned duration in minutes |
| `primary_zone` | Dominant training zone (`Z1`–`Z5` or HR equivalent) |
| `structure` | Short description of the workout structure (free text) |
| `status` | `planned \| completed \| adjusted \| skipped` |

## hard_rules

- **Generated** by the planner's `plan-write` capability (initial push) and `rolling` capability (on window advance) from `plan/weeks/*.json` — no other writers.
- `status` updated by the coach's `checkin` capability / the Analyst (`pace-analyst`) (completed / skipped) and the coach's `adjust` capability (adjusted).
- Never read as a training signal; never modifies `plan/plan.md` or `plan/weeks/*.json`.
- On plan amendment (the planner's `rolling` capability): rows beyond the current window may be removed or updated; always **preserve completed rows**.
- When a real calendar backend (gcal / notion) is connected, `calendar.csv` is **skipped** — the projection is pushed directly to the backend; `weeks/*.json` remains the source regardless.
