# Strava — read connector (instance)

`connector_id: strava` · `class: read` · `degraded_fallback: manual` · conforms to [`_schema.md`](_schema.md).

A **read-only signal/data provider** via Strava's **official MCP** (remote, OAuth, subscribers-only). Consumed by the coach's `checkin` capability, the Analyst (`pace-analyst`), and the planner's `rolling` capability. **Never** a persona, **never** called from the `pace` master, **never** generates a session, **never** written to (Strava is read-only).

## capability_probe (plain language)

A Strava MCP tool is available in this session (a tool whose name/description indicates Strava activities / streams / fitness trends / readiness). **Present -> use it by default** for the **Phase-1 qualitative** read (below): the athlete connected Strava, so the consumer reads the executed activity summary on its own, without waiting for an explicit ask. The `strava` flag in `pace.config.toml` is an **explicit opt-out** (`strava = false` suppresses the probe), not a pre-requisite. **Absent** (non-subscriber, not connected, or opted out) -> **manual entry**: ask the athlete for the few figures needed, or rely on the `log/`; never fabricate a metric (scenario 05). PACE works without Strava.

## Phased scope

- **Phase 0 — spike (gate).** Before any *structured* use, enumerate the real MCP: tool list, response shapes, what *readiness* actually is, whether *time-in-zone* is exposed, field-name stability. **Freeze no CSV/JSON threshold before this spike.**
- **Phase 1 — qualitative enrichment (active, safe pre-spike, on by default when the tool is present).** Read **summaries** of recent / the just-reported activity for **context only** ("your last 3 rides look like…"; grounding a debrief in the actual ride). **No** structured signal, **no** schema change, **no** plan calibration, **no** write to `profile.json`. Cycling only.
- **Phase 2 — measured loop (spike-gated).** `strava_baseline` in `profile.json` (**sole writer = the Analyst / `pace-analyst`**); planned-vs-actual at **summary** level (avg power vs target zone, duration, time-in-zone — **never** per-second); signals routed to the **right table** (today -> `adjustment-decisions.csv`; multi-week -> `signals.csv`; post-execution -> `learned_behavior` / `log/`). CSV rows added **only after** the spike.

## hard_rules

- **Summaries, not raw streams.** Prefer fields Strava already computes (fitness trends, readiness, avg/normalized power, time-in-zone). Pull raw per-second streams only for a **narrow, targeted** question; **never** dump per-second data into context (drift + tokens).
- **Right table for the right signal** (Phase 2): same-day -> `adjustment-decisions.csv`; multi-week trend -> `signals.csv`; post-session execution -> the Analyst (`pace-analyst`) (`learned_behavior` / log).
- **Cross-sport filter** — read only the active discipline (V0/V1 = cycling).
- **Never** generate or suggest an unplanned session from the data; it informs context/modulation within the existing rules only.

## privacy

Persist **KPIs** (summary metrics), **not** raw GPS traces. Access is account-scoped and revocable on Strava's side. PACE writes to its **git artefacts**, never to Strava.
