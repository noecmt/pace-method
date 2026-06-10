# Strava — read connector (instance)

`connector_id: strava` · `class: read` · `degraded_fallback: manual` · conforms to [`_schema.md`](_schema.md).

A **read-only signal/data provider** via Strava's **official MCP** (remote, OAuth, subscribers-only). Consumed by `pace-checkin`, `pace-agent-analyst`, `pace-rolling`. **Never** a persona, **never** called from `pace-master`, **never** generates a session, **never** written to (Strava is read-only).

## capability_probe (plain language)

A Strava MCP tool is available in this session (a tool whose name/description indicates Strava activities / streams / fitness trends / readiness). **Absent** (non-subscriber, not connected) -> **manual entry**: ask the athlete for the few figures needed, or rely on the `log/`. PACE works without Strava.

## Phased scope

- **Phase 0 — spike (gate).** Before any *structured* use, enumerate the real MCP: tool list, response shapes, what *readiness* actually is, whether *time-in-zone* is exposed, field-name stability. **Freeze no CSV/JSON threshold before this spike.**
- **Phase 1 — qualitative enrichment (active, safe pre-spike).** Read **summaries** of recent activities for **context only** ("your last 3 rides look like…"). **No** structured signal, **no** schema change, **no** plan calibration. Cycling only.
- **Phase 2 — measured loop (spike-gated).** `strava_baseline` in `profile.json` (**sole writer = the Analyst / `pace-agent-analyst`**); planned-vs-actual at **summary** level (avg power vs target zone, duration, time-in-zone — **never** per-second); signals routed to the **right table** (today -> `adjustment-decisions.csv`; multi-week -> `signals.csv`; post-execution -> `learned_behavior` / `log/`). CSV rows added **only after** the spike.

## hard_rules

- **Summaries, not raw streams.** Prefer fields Strava already computes (fitness trends, readiness, avg/normalized power, time-in-zone). Pull raw per-second streams only for a **narrow, targeted** question; **never** dump per-second data into context (drift + tokens).
- **Right table for the right signal** (Phase 2): same-day -> `adjustment-decisions.csv`; multi-week trend -> `signals.csv`; post-session execution -> `pace-agent-analyst` (`learned_behavior` / log).
- **Cross-sport filter** — read only the active discipline (V0/V1 = cycling).
- **Never** generate or suggest an unplanned session from the data; it informs context/modulation within the existing rules only.

## privacy

Persist **KPIs** (summary metrics), **not** raw GPS traces. Access is account-scoped and revocable on Strava's side. PACE writes to its **git artefacts**, never to Strava.
