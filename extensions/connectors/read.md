# Read — signal/data provider connectors (class)

`class: read` · `degraded_fallback: manual` · conforms to [`_schema.md`](_schema.md).

Read connectors fetch **completed session data and readiness signals** from external sport platforms. Consumed by the coach's `checkin` capability, the Analyst (`pace-analyst`), and the planner's `rolling` capability. When absent, these fall back to **manual entry** (ask the athlete for the relevant figures).

## Resolution rule (no runtime)

The consuming skill:
1. Checks whether the athlete has enabled a read connector in `pace.config.toml` (e.g. `strava = true`).
2. Probes the capability (MCP or API tool available?). Both true -> reads it. Either absent -> manual. ("Skill" here means the consuming agent's capability — `checkin` / `rolling` — or the Analyst.)
3. Never blocks on missing data; always degrades cleanly.

## Active instances

| `connector_id` | Platform | Status |
|---|---|---|
| `strava` | Strava (official MCP, OAuth) | Active — see [`strava.md`](strava.md) |

## Future instances — terrain prêt, aucun fichier instance pour l'instant

To add a new read connector: follow the pattern in `strava.md`, create `<platform>.md`, register it in this table, and add a flag in `customize.toml` + `pace.config.template.toml`.

Run a **Phase 0 spike** first (enumerate real API fields, confirm readiness / time-in-zone exposure, check MCP availability) before writing any CSV thresholds or structured schemas.

Candidates:
- **Garmin Connect** — large base; rich HRV / Body Battery / sleep signals. No MCP yet; API available. Multi-class candidate (read + calendar via workout push to devices).
- **Intervals.icu** — free, API-open, popular with self-coached athletes; CTL/ATL/HRV; structured workout push to devices. Multi-class (read + calendar).
- **Nolio** — research needed: platform identification, API availability, MCP status.
