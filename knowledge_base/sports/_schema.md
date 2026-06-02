# Sport pack — schema (contract)

A sport pack is a single JSON file `knowledge_base/sports/<sport_id>.json`. It carries **knowledge only** — never a persona, never a workflow. Personas read it; adding a sport never adds an agent. The reference instance is [`cycling.json`](cycling.json).

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `sport_id` | string | Unique id, matches the filename (e.g. `cycling`, `running`). |
| `version` | string | Pack version (semver-ish, e.g. `"1.0"`). |
| `primary_metric` | string | The metric the sport is driven by (e.g. `power_watts`, `pace_min_per_km`). |
| `fitness_marker` | string | The single benchmark used for zones (e.g. `ftp`, `threshold_pace`). |
| `intensity_zones` | object | `{ system: string, zones: [...] }`. Each zone: `{ id, name, <marker>_pct: [lo, hi] }`. Zones are contiguous and ordered. |
| `key_sessions` | object | Map of `session_id -> { purpose, typical_duration_min: [lo, hi], intensity }`. **Must include at least one active-recovery session** (the modulate fallback catalog draws from here — see `02_method.md`). |
| `periodization` | array | Allowed periodization strategies for this sport (e.g. `["polarized","pyramidal","linear"]`). |

## Recommended fields

| Field | Type | Meaning |
| --- | --- | --- |
| `references` | array | Sources backing the zones/sessions (books, articles). |

## Rules

- **Knowledge only.** No prose persona, no workflow logic.
- **Zones must be contiguous** over the marker range and ordered by `id`.
- `key_sessions` ids are referenced by `periodization-rules.csv` semantics and by the
  `adjustment-decisions.csv` fallback actions (e.g. `recovery_ride`); keep them stable.
- A new sport = add this JSON, nothing else. Personas/workflows are identical across sports.

## Validation

A pack is valid if all required fields are present and well-typed, zones are contiguous, and at least one active-recovery `key_session` exists. `cycling.json` is the canonical example to diff against.
