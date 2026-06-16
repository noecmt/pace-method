# Read — signal/data provider connectors (class)

`class: read` · `degraded_fallback: manual` · conforms to [`_schema.md`](_schema.md).

Read connectors fetch **completed session data and readiness signals** from external sport platforms. Consumed by the coach's `checkin` capability, the Analyst (`pace-analyst`), and the planner's `rolling` capability. When absent, these fall back to **manual entry** (ask the athlete for the relevant figures).

## Resolution rule (no runtime) — **capability-first**

The consuming skill:
1. **Probes the capability first**: is a read MCP/API tool present in this session (a tool whose name/description indicates the platform's activities / streams / fitness trends)? **Present -> use it by default** for **Phase-1 qualitative** enrichment — the athlete connected it, so they want it used. No need to wait for an explicit ask.
2. The `pace.config.toml` flag (e.g. `strava`) is an **explicit opt-out**, not a pre-requisite: `strava = false` (or `false` for that connector) **suppresses** the probe; absent or `true` leaves the default on. ("Skill" here means the consuming agent's capability — `checkin` / `rolling` — or the Analyst.)
3. **Phase-2 measured use stays spike-gated** regardless of the above (see `strava.md`): the capability-first default only enables the Phase-1 *qualitative* read.
4. Never blocks on missing data; if the tool is absent (or opted out), **degrade cleanly to manual entry** — never fabricate a metric (scenario 05).

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
