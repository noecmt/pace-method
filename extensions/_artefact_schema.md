# Core artefacts — schema (the frozen contract)

The **core artefacts** are the athlete-repo files the agents communicate through — the contracts of the method (git *is* the database). Unlike the three extension axes (sport / domain / method), which are *packs*, these are the **shared data shapes** every agent reads and writes. This file **freezes** their structure: a `schema_version` lets any future change be a *detectable migration* rather than silent drift. Tagged with the repo at `v1.0.0`.

> **Why freeze these and not the prose?** Personas, capabilities, and memory churn freely; the artefact *shapes* must not, because every agent depends on them. Stability lives here, in versioned shapes — see `docs/internal/2026-06-16-point-fixe-stabilite-architecture.md`.

## Versioned artefacts

| Artefact | File | `schema_version` | Written by |
|---|---|---|---|
| Week (session lifecycle + week summary) | `plan/weeks/<week_id>.json` | `"1.0"` | Planner (`plan`/`actual:null`), Coach (`rationale`/`adjustment`), Analyst (`actual`/`debrief`/`summary`) |
| Athlete profile | `athlete/profile.json` | `"1.0"` | Discovery intake (creates once), Analyst (sole updater) |
| Derived zones | `athlete/zones.json` | `"1.0"` | Planner (first), Analyst (regenerates on a marker change) |

`vision/vision.md` and `plan/plan.md` are **narrative** artefacts (Markdown), not covered by a JSON `schema_version`; their contract is the validation checklist in `pace-validate`.

## Two identity axes: discipline vs programme

The single load-bearing distinction this contract pins down:

- **Programme = the athlete** (`profile.json`). One athlete, one season, one `current_phase`. The athlete declares **`sports`** (a list): `["cycling"]` for a mono-sport athlete, `["cycling","running","swimming"]` for a triathlete.
- **Discipline = the session** (`weeks/*.json`). Each session carries a **`sport`** — its discipline. A triathlete's week mixes disciplines; a *brick* (or any two-a-day) is simply two sessions sharing a `date`.

Everything sport-specific (fitness markers, zones) is therefore **keyed by discipline**, while everything programme-level (phase, block, adherence) stays a single sport-agnostic value.

## Week file `plan/weeks/<week_id>.json`

Top level: `schema_version`, `week_id`, `block`, `phase`, `load_type`, `volume_modifier`, `sessions[]`, `summary`.

### The session object — the single home for a session's whole lifecycle

| Field | When | Written by | Meaning |
|---|---|---|---|
| `id` | always | Planner | **`<date>-<slot>`**, unique within the `date`. The stable key (the `date` alone is **not** a key — a day may hold several sessions). |
| `date` | always | Planner | ISO date. |
| `slot` | always | Planner | `am` \| `pm` (free token; overflow → ordinal `-1`/`-2`). A single-session day defaults to `am`, so the id stays stable if a `pm` is added later. |
| `sport` | always | Planner | the **discipline** (`cycling`, `running`, `swimming`…). Drives which `zones.json` discipline the targets come from. |
| `type` | always | Planner | session type, from the sport pack's `key_sessions`. |
| `planned` | always | Planner | `{ duration_min, zones[], target, structure }` — see `target` below. |
| `rationale` | Run | Coach (`checkin`) | the brief — why *this* session today. |
| `status` | always | Planner→Analyst | `planned` \| `done` \| `adjusted` \| `skipped`. |
| `actual` | post-exec | Analyst | `{ duration_min_actual, distance_km, rpe, notes }` (all nullable). `null` while `planned`. |
| `debrief` | post-exec | Analyst | `{ read, verbatim[], notes[] }`. |
| `adjustment` | if modulated | Coach (`adjust`) | `{ signals[], rows[] }` — the `adjustment-decisions.csv` rows applied. |

Run-mode fields are **absent until they apply** (no empty placeholders at plan time). Past week files are **immutable history** — the Planner's `rolling` never overwrites them.

### `planned.target` — the metric-agnostic intensity target

The prescribed effort, **tagged with its metric** so the same shape serves every sport. The bounds string is **copied from `zones.json`** (auditable — never computed inline):

```json
"target": { "metric": "power", "zone_ref": "Z3", "range": "243–278 W" }
```

| Field | Meaning |
|---|---|
| `metric` | `power` \| `hr` \| `pace` — which measured quantity the `range` is in. |
| `zone_ref` | the dominant zone label (echo of `planned.zones`, for audit). |
| `range` | the concrete bounds string, copied verbatim from the discipline's zones in `zones.json` (`"243–278 W"`, `"154–164 bpm"`, `"1:55–2:05 /100m"`). |

The `planned.zones[]` labels remain. The plan prescribes **time + zones/target**, never distance.

### The week `summary` (derived — Analyst only)

A regenerate-not-patch aggregate (sibling of `sessions`). The Planner/`rolling` **never** write it; the master recites it verbatim and never recomputes it.

```json
"summary": {
  "status": "in_progress",
  "sessions": { "total": 6, "done": 3, "adjusted": 1, "skipped": 1, "pending": 1 },
  "adherence": 0.8,
  "duration_min": { "planned": 580, "actual": 325 },
  "distance_km": { "cycling": 137, "swimming": 1.8 },
  "intensity_split_min": { "Z1-Z2": 205, "Z3": 120, "Z4-Z5": 0 },
  "by_sport": {
    "cycling": { "sessions": 5, "duration_min": 285, "distance_km": 137 },
    "swimming": { "sessions": 1, "duration_min": 40, "distance_km": 1.8 }
  },
  "read": "…",
  "generated_by": "pace-analyst", "generated_at": "2026-06-14"
}
```

- **Sport-agnostic totals** (sum cleanly across disciplines): `sessions` (counts by status), `adherence` `(done+adjusted)/(done+adjusted+skipped)`, `duration_min` `{planned, actual}`, `intensity_split_min` (executed minutes by the dominant planned zone's band — the zone *numbers* exist in every pack, so the bands hold), `status`, `read` (≤2 sentences, neutral).
- **`distance_km`** is **keyed by sport** (actual only) — a cross-discipline distance sum is meaningless (2 km swim + 100 km bike ≠ 102). A mono-sport week is just a one-key object `{ "cycling": 137 }`.
- **`by_sport`** is present **only when the week has >1 sport**; absent otherwise (the totals + one-key `distance_km` already say everything). Per sport: `sessions` = count of that discipline's sessions; `duration_min` / `distance_km` = **actual** (executed).

### `custom` — the opt-in extension field (additive, no version bump)

`planned`, `actual`, and `debrief` may each carry an **optional** `custom` object: a flat map of extra, athlete-declared metrics the core shapes don't name (e.g. `hrv_ms`, `sleep_h`, `bodyweight_kg`).

```json
"actual": { "duration_min_actual": 90, "distance_km": 42, "rpe": 5, "notes": null,
            "custom": { "hrv_ms": 68, "sleep_h": 7.5 } }
```

- **Always optional, never required.** A session without `custom` is fully valid. The field is **purely additive** — it changes no existing field and does **not** bump `schema_version`: every artefact stays `schema_version: "1.0"` and shape-compatible. A reader that ignores `custom` reads a valid 1.0 file.
- **Flat scalars only.** Keys are `snake_case`; values are scalars (number / string / bool) — no nested objects, no arrays.
- **Gated by declaration.** A `custom` key is honored **only when it is declared** in `pace.config.toml [custom_metrics]` (which positions — `planned`/`actual`/`debrief` — it may appear on, and its type). The Analyst writes/reads only declared keys; `pace-validate` flags an undeclared or mistyped key. Undeclared keys are ignored, never invented.

> **Nutrition / recovery / any *domain* does NOT ride on `custom`.** A domain (nutrition, recovery, …) is a **parallel advisor agent that writes its own artefact** — never a key on the training session (the three extension axes, `CLAUDE.md`). `custom` is for a *scalar the athlete tracks alongside* a session; anything that needs prose, rules, or its own history is a **domain pack**, not a `custom` key.

## Profile `athlete/profile.json`

Top level: `schema_version`, `athlete_id`, **`sports`** (array), `level`, **`current_phase`** (programme-level, sport-agnostic — *not* inside a discipline), **`fitness`** (keyed by discipline), `constraints[]`, `preferred_methods[]`, `equipment[]`, `rpe_calibration`, `learned_behaviors[]`.

```json
"fitness": {
  "cycling": { "fitness_marker": "ftp", "ftp_watts": 250, "ftp_updated": "2026-04-15", "max_hr": 185, "lthr_bpm": null }
}
```

Each `fitness.<discipline>` holds that discipline's markers (incl. `max_hr`/`lthr_bpm`, which may differ by sport). A triathlete has one entry per declared sport. **Created once** by the Discovery intake; thereafter the **Analyst is the sole updater** — and writes a marker into the **correct discipline**.

## Derived zones `athlete/zones.json`

Top level: `schema_version`, `generated_by`, `generated_at`, **`by_discipline`** (map). Each discipline mirrors the old single-sport shape:

```json
"by_discipline": {
  "cycling": { "fitness_markers": {…}, "hr_reference": "max_hr", "power_zones": […], "hr_zones": […] }
}
```

- **Derived, never hand-edited.** Regenerated **whole** (never patched) from `profile.json.fitness.<d>` + the sport pack percentages.
- **Invariant (per discipline):** `by_discipline.<d>.fitness_markers` must equal `profile.json.fitness.<d>` markers — `pace-validate` enforces this for every declared discipline.
- A marker that is absent → its zone system is **omitted** for that discipline (not invented). A discipline with no markers yet → no entry.

## Rules (all core artefacts)

- **`schema_version` is mandatory** at the top of every week/profile/zones file. Bump it only via a visible git diff with a migration note; same-version files must stay shape-compatible.
- **One writer per moment.** Profile: intake creates, Analyst updates. Zones: Planner first, Analyst on marker change. Summary: Analyst only. No agent writes outside its lane.
- **Derived artefacts are regenerated, never patched** (`zones.json`, `summary`).
- **Distance is never planned** (time + zones/target is the plan's currency); it appears only in `actual` and, aggregated by sport, in `summary`.
- **`custom` is additive and gated.** The optional `planned`/`actual`/`debrief.custom` map never bumps `schema_version`; only keys declared in `pace.config.toml [custom_metrics]` are honored (flat snake_case scalars). Domains never ride on `custom` — they own their own artefact.
