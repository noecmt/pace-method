# Connector — schema (capability contract)

A **connector** lets PACE **read from** or **write to** an external system via an **MCP** (or any host capability) — **with no runtime**: detection and use are **instructions the host agent follows**, not code. A connector is a **capability attached to an artefact**. It is **NOT a fourth extension axis** (the three axes stay **sport / domain / method**, which shape *what the method knows and does*); a connector only changes **where data is read from / written to**. It is **never a persona**, **never called from the `pace` master to make a decision**, and **never generates a session** (the Run prohibition is absolute).

## Three classes

| Class | Role | Consumed by | Degraded fallback (capability absent) |
|---|---|---|---|
| `read` | external **signal/data provider** (read-only) | the coach's `checkin`, the Analyst, the planner's `rolling` | **manual entry** (ask the athlete / use `log/`) |
| `storage` | **backend for the athlete artefacts** | every capability that persists an artefact | **local filesystem** (Claude Code) |
| `calendar` | **session delivery** — push upcoming sessions to athlete's scheduling tool | the planner's `plan-write`/`rolling`, the coach's `adjust` | **`plan/calendar.csv`** (local filesystem) |

## Multi-class connectors

A connector **may implement multiple classes**. Notion can be both `storage` (artefact backend) and `calendar` (sessions database) simultaneously. Intervals.icu, once implemented, would be both `read` (past sessions / HRV) and `calendar` (push structured workouts). Each class is declared in its own instance file; the connector_id may be shared across files (e.g. `storage-notion.md` and `calendar-notion.md` are separate, but both use the same Notion MCP connection).

## A connector declares

| Field | Meaning |
|---|---|
| `connector_id` | unique id (`strava`, `github`, `notion`, `gdrive`). |
| `class` | `read` \| `storage` \| `calendar`. |
| `capability_probe` | **how the agent detects it, in plain language**: "is an MCP tool for `<service>` available in this session?" No code — the agent inspects its own available tools. |
| `reads` / `writes` | what it touches: external data (read); artefacts from `{vision, plan, profile, zones, log}` (storage). |
| `degraded_fallback` | what to do when the capability is **absent**: `manual` (read) or `local` (storage). PACE must work **fully** without any connector. |
| `hard_rules` | the invariants it must never break. |
| `privacy` | what may be persisted vs. what must not. |

## The capability-detection protocol (no runtime)

On a turn that *could* use a connector, the agent:
1. **Probes** — checks whether the relevant MCP tool is available in the session.
2. **If present** -> uses it, strictly within the connector's `hard_rules`.
3. **If absent** -> **degrades cleanly** to the fallback (manual entry / local filesystem) and **says so**. Never block, never invent the data.

All of the above is **text the agent follows** — there is no detection code, no process.

## Hard rules (every connector)

- A connector **attaches to an artefact**, never to a persona's internals; adding one modifies **no persona**.
- **Never from the `pace` master** — the orchestrator routes; connectors are used *inside* the consuming agents' capabilities (read) or by the storage layer (write).
- **Never generates a session** — read data may *inform* context/modulation within the existing rules, never *create* a plan or session.
- **PACE works without it** — graceful degradation is mandatory, not optional.

## Instances

- Read: [`read.md`](read.md) (active: `strava`; future: Garmin, Intervals.icu, Nolio).
- Storage: [`storage.md`](storage.md) (`local`, `github`, `notion`, `gdrive`).
- Calendar: [`calendar.md`](calendar.md) (`local-csv`, `gcal`, `notion-calendar`).

## Athlete preferences

User-specific integration config (backend URLs, calendar IDs) lives in **`pace.config.toml`** at the root of the athlete's artefact repo. Template: `pace.config.template.toml` (repo root). This file overrides the pack defaults in each agent's `customize.toml` and is **never** written by a coaching agent — only the `pace` master's onboarding wizard writes it (see `docs/07_customize_merge.md`).
