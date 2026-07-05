# Scenario 16 — Running zones (pace-based sport pack)

**Scope:** v1.0.2 — running sport pack (`knowledge_base/sports/running.json`)

## Purpose

Validate that the running pack integrates cleanly across the full pipeline: zone derivation, coach briefing with concrete pace values, fallback catalog, and periodization-rules enforcement. No agent change — agents read the sport pack the same way they read cycling.json.

## State (fixture)

- **Profile:** `athlete/sample.json` — `sports: ["cycling", "running"]`, `fitness.running: { threshold_pace_sec_km: 270, max_hr: 178 }`, `current_phase: "build"`
- **Zones:** `athlete/sample-zones.json` — `by_discipline.running` pre-derived (pace + HR zones)
- **Plan:** session `2026-06-25-am` in the build week — `sport: "running"`, `type: "interval_run"`, `planned.target: { metric: "pace", zone_ref: "Z4-Z5", range: "262–275 s/km" }`

## Probes

### Probe A — Zone derivation

**Input:** Planner derives `zones.json.by_discipline.running` from `profile.json.fitness.running` + `running.json`.

**Expected properties:**

| # | Property | Type |
|---|----------|------|
| 1 | `by_discipline.running.pace_zones` contains 5 zones (Z1–Z5), each with `fast_sec_km` and `slow_sec_km` | hard/det |
| 2 | Z4 bounds = [262, 275] sec/km (= round(270 × [0.97, 1.02])) | hard/det |
| 3 | Z1 bounds = [311, 378] sec/km (= round(270 × [1.15, 1.40])) | hard/det |
| 4 | `by_discipline.running.hr_zones` present; Z5 bpm = [168, 178] (= round(178 × [0.94, 1.00])) | hard/det |
| 5 | `fitness_markers.threshold_pace_sec_km` in `zones.json` matches `profile.json` value (270) | hard/det |
| 6 | No `power_zones` block under `by_discipline.running` (wrong metric for this sport) | anti |

### Probe B — Coach briefing with concrete pace values

**Input:** athlete says "je suis prêt, c'est quoi la séance ?" for the planned `interval_run`.

**Expected properties:**

| # | Property | Type |
|---|----------|------|
| 7 | Coach cites concrete pace bounds in mm:ss/km (e.g. "4:22–4:35/km" for Z4) — never just "Z4" | hard |
| 8 | Coach explains *why* this session (build phase, VO2max stimulus, fits the week) | hard |
| 9 | Session read verbatim from plan, not regenerated | anti |
| 10 | Does not cite cycling power values (W) for a running session | anti |

### Probe C — Modulation on high_fatigue signal

**Input:** same session day, athlete reports `high_fatigue`.

**Expected properties:**

| # | Property | Type |
|---|----------|------|
| 11 | `adjustment-decisions.csv`: `high_fatigue` -> `reduce_intensity_or_rest` (high severity) | hard/det |
| 12 | Fallback session = `recovery_jog` (from `running.json.key_sessions`) — not `recovery_ride` | hard/det |
| 13 | Fallback: Z1 strict, 20-40 min, no pace pressure | hard |
| 14 | Does not compose a new structured running session | anti |

### Probe D — Periodization guardrail in base phase

**Input:** Planner builds a running week during `base` phase.

**Expected properties:**

| # | Property | Type |
|---|----------|------|
| 15 | No Z4/Z5 running session scheduled (forbidden in base per `periodization-rules.csv`) | anti/det |
| 16 | `interval_run` and `repetition_run` absent from the base week | anti/det |
| 17 | `tempo_run` (Z3) may appear — allowed in base | hard/det |

### Probe E — Degraded input (no threshold_pace marker)

**Input:** profile has `fitness.running: { max_hr: 178 }` only (no `threshold_pace_sec_km`).

**Expected properties:**

| # | Property | Type |
|---|----------|------|
| 18 | `by_discipline.running` contains `hr_zones` only — no `pace_zones` block | hard/det |
| 19 | Coach gives HR-based guidance (e.g. "below 121 bpm for Z1") — never invents a pace | hard |
| 20 | `zones.json.by_discipline.running.fitness_markers.threshold_pace_sec_km` absent (not null-padded) | hard/det |

## Deterministic checks (summary)

| Check | Pass condition |
|-------|---------------|
| Z4 pace bounds | fast_sec_km=262, slow_sec_km=275 |
| Z1 pace bounds | fast_sec_km=311, slow_sec_km=378 |
| HR Z5 bounds | min_bpm=168, max_bpm=178 |
| Fallback session id | `recovery_jog` (not `recovery_ride`) |
| Base phase forbidden | `interval_run`, `repetition_run` absent |
