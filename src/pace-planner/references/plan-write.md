# plan-write — the Plan capability

A **capability of the Planner** (`pace-planner`), not a separate skill: a local file the Planner reads into the same context. **Following it is not a handoff and not a voice change** — you are still the Planner. Its single responsibility is the plan artefacts (`plan/plan.md`, `plan/index.csv`, `plan/weeks/*.json`): render the strategy you decided into the template, emit the structured week files, enforce the deterministic rules, and gate it through validation. Never invent training structure the strategy did not specify; this file production has no voice.

## Inputs

- The **Planner's strategy** (far blocks, mid-week intents, near-window sessions).
- The template [`../assets/plan-template.md`](../assets/plan-template.md) — far / mid horizons + near pointer.
- The phase rules [`../assets/periodization-rules.csv`](../assets/periodization-rules.csv) — `phase,allowed_intensity,forbidden,volume_modifier`.
- The sport pack `knowledge_base/sports/<sport>.json` (canonical instance: `cycling.json`) — `key_sessions` (legal session types) **and the zone systems** used to derive concrete bounds: `intensity_zones` (power, `ftp_pct`) and `intensity_zones.hr_zones` (`max_hr_pct` / `lthr_pct`). Resolved via the override stack below.
- The method pack `knowledge_base/methods/<id>/` (`METHOD.md` + `session_structures.csv`) — read **only when** `pace.config.toml` declares `[method] pack = "<id>"`. Also resolved via the override stack below.
- The validator tool [`pace-validate`](../../pace-validate/) + its plan-checklist.
- `athlete/profile.json` (forwarded; test fixture `athlete/sample.json`) — for the constraint cross-check **and the fitness markers, keyed by discipline** under `fitness.<discipline>` (`ftp_watts`, `max_hr`, `lthr_bpm`, `threshold_pace_sec_km`, `css_sec_100m`); `sports[]` lists the disciplines you derive zones for.
- `athlete/zones.json` (fixture: `athlete/sample-zones.json`) — the **derived** zones artefact you generate (next); the near-horizon sessions reference its concrete bounds.

> If the master forwarded `{config, profile, zones, active_week}` as context, use those objects — do **not** re-read the files from disk.

## Pack resolution — override stack (local wins)

A plugin install is **read-only**, so an athlete's custom packs live in **their own repo**. Resolve **every** sport and method pack at **two locations**, in this order — the **local copy wins** on an `id` collision:

1. **`<athlete-repo>/knowledge_base/{sports,methods}/<id>`** — the athlete's local pack (written by the user / `pace-extend`). **Wins.**
2. **`<plugin-install>/knowledge_base/{sports,methods}/<id>`** — the curated base pack shipped with the method.

The athlete repo **mirrors the plugin's relative tree** (`knowledge_base/sports|methods/`), so resolution is the trivial rule *"same relative path, local wins"*. Any `knowledge_base/sports/<sport>.json` or `knowledge_base/methods/<id>/` path named elsewhere in this file denotes this **resolved result**, not a fixed install location.

**Consuming a method pack.** When `pace.config.toml` declares `[method] pack = "<id>"`, read its resolved `METHOD.md` + `session_structures.csv` **before** you plan. **Cite the pack explicitly** in your reasoning ("per the polarized method…") so conformance is auditable, and draw sessions from its `session_structures`. A method pack may **restrict** the intensity distribution per phase (`periodization_bias`); it may **never** authorise an intensity that `periodization-rules.csv` forbids for the phase — the deterministic phase-legality check (step 3) still governs.

## Connectors (capability-detected)

Persist and deliver through the connector layer — [`_schema.md`](../../../extensions/connectors/_schema.md) protocol: probe, use if present, **degrade cleanly** if absent (never block, never lose an artefact):

- **Storage (write).** Write/amend `plan/plan.md`, `plan/index.csv`, and `plan/weeks/*.json` **and the derived `athlete/zones.json`** at their **logical paths**; the backend (`pace.config.toml` `[connectors].storage`, default `local`) maps each to a file / GitHub commit / Notion page. The **window-discipline**, **amend-not-rewrite**, and **visible change-log** contracts hold identically across backends. Backend unavailable -> **degrade to `local`** and say so; never silently drop the plan or the zones. See [`storage.md`](../../../extensions/connectors/storage.md).
- **Calendar (push).** On accept (and on each amend), mirror the **near-window** sessions from `plan/weeks/<active>.json` to the calendar connector — `plan-write` is the **initial push**. The calendar is a one-way **view** of the plan (it reflects the plan, never shapes it). Connector absent -> write `plan/calendar.csv` (generated projection from `weeks/*.json`). See [`calendar.md`](../../../extensions/connectors/calendar.md).

## Procedure

1. **Fill plan.md from the template.** Far horizon = season blocks (phase + approx dates + intent, no sessions). Mid horizon = approximate weeks (intent + load type + `volume_modifier`, **no precise sessions**). Near horizon = a pointer to `plan/index.csv` + `plan/weeks/` (no inline table). Record `Sport`, `fitness marker`, and the **source vision reference/commit**.

2. **Derive `athlete/zones.json` first — before any precise session.** A precise session needs concrete bounds (watts/bpm/pace), so materialize the derived zones artefact from `profile.json.fitness` + the sport pack's zone percentages. You are its **first writer** (`generated_by: pace-planner`). The file is **keyed by discipline**: set a top-level `schema_version: "1.0"` + a `by_discipline` map, and **build one entry per declared `sport` in `profile.sports[]`** that has markers. Within each `by_discipline.<sport>`, for each marker **actually present** in `profile.json.fitness.<sport>`, build the matching zone array (the sport pack is `knowledge_base/sports/<sport>.json`):
   - **Power** (cycling, `ftp_watts`): `min_watts = floor(ftp × pct_min)`, `max_watts = floor(ftp × pct_max)` from `intensity_zones.zones` `ftp_pct`. (FTP 250 -> Z4 = 227–262 W.)
   - **HR** (`max_hr` or `lthr_bpm`): use `lthr_bpm` if present (more precise), else `max_hr`; `min_bpm/max_bpm = floor(ref × pct)` from `hr_zones` `lthr_pct`/`max_hr_pct`. Set `hr_reference` to the marker used.
   - **Pace** (running `threshold_pace_sec_km`, swimming `css_sec_100m`): `round(marker × pct)` per the sport pack's pace zones.
   Copy the markers used into that discipline's `fitness_markers`, set its `hr_reference`; set the file's `generated_at`. **A zone system whose marker is absent is omitted entirely** (field absent — never `null`, never an invented value), and a declared discipline with no markers yet gets **no `by_discipline` entry**; the near sessions then express targets in the coarser system that *does* exist, or qualitatively (degraded — `scenarios/05`). If `zones.json` already exists and the markers are unchanged, reuse it. The file must conform to [`zones.schema.json`](../../../extensions/zones.schema.json) — follow the [write checklist](../../../extensions/_artefact_schema.md#emitting-a-core-artefact--the-write-checklist) before emitting.

3. **Make every near-horizon session phase-legal (deterministic).** For each session, check its zones against its block's row in `periodization-rules.csv`: only `allowed_intensity`, none of `forbidden`. Express each session's target as the **concrete bound from `zones.json`** — read it from `by_discipline.<session.sport>` (e.g. "Z4 = 227–262 W"), not just a zone label. Set near-window volume to reflect the phase `volume_modifier` (e.g. taper ≈ 0.5, race ≈ 0.4). Draw session types from the sport pack's `key_sessions`.

4. **Write `plan/index.csv` — all three horizons, one row per week.**
   ```
   week_id,horizon,start,end,block,phase,load_type,volume_modifier,status,file
   ```
   - Far rows: `horizon:far`, approximate dates, empty `file`, `status:scheduled`.
   - Mid rows: `horizon:mid`, approximate dates, intent-level fields, empty `file`, `status:scheduled`.
   - Near rows: `horizon:near`, precise dates, `file: weeks/<week_id>.json`, `status: active` (current window) or `planned` (next window). **Exactly one near row may be `active` at any time.**

   The CSV must conform to [`index.schema.json`](../../../extensions/index.schema.json) (column order, enums, the `near`-only `file` rule) — follow the [write checklist](../../../extensions/_artefact_schema.md#emitting-a-core-artefact--the-write-checklist) before emitting.

5. **Write `plan/weeks/<week_id>.json` for each near-horizon week.** The session object is the **single home for the whole session lifecycle**: you write only the *plan* fields (`id`, `date`, `slot`, `sport`, `type`, `planned`, `status:"planned"`, `actual:null`); the **Run-mode fields are filled later in-place, in this same file** — never a separate `log/` file. Schema (plan-time shape):
   ```json
   {
     "schema_version": "1.0",
     "week_id": "2026-W24",
     "block": 1, "phase": "base",
     "load_type": "load", "volume_modifier": 1.0,
     "sessions": [
       {
         "id": "2026-06-09-am", "date": "2026-06-09", "slot": "am", "sport": "cycling",
         "type": "recovery_ride",
         "planned": {
           "duration_min": 75, "zones": ["Z1"],
           "target": { "metric": "power", "zone_ref": "Z1", "range": "< 140 W" },
           "structure": "easy, no climbs"
         },
         "status": "planned",
         "actual": null
       }
     ]
   }
   ```
   - **`id` = `<date>-<slot>`**, unique within the `date`. A day may hold **several sessions** (a two-a-day, a triathlon brick): emit one object per session, same `date`, distinct `slot` (`am`/`pm`; overflow → ordinal `-1`/`-2`). A single-session day defaults to `slot:"am"`. A warm-up is **not** a session — fold it into `planned.structure`.
   - **`sport`** is the session's **discipline** — it selects which `by_discipline.<sport>` block in `zones.json` the targets come from.
   - **`planned.target`** = `{ metric, zone_ref, range }`: `metric ∈ power | hr | pace` (per the sport pack's `primary_metric`), `range` = the **concrete bounds copied from `zones.json`** (auditable, robust to future marker changes), `zone_ref` = the dominant zone label. The `zones[]` labels stay.
   - `status ∈ planned | done | adjusted | skipped`. `actual` = null until the Analyst fills it.

   **Run-mode fields (you do NOT write them — documented here so the schema is one contract):** the Daily-coach pipeline adds, *on the same session object*, `rationale` (the brief — the coach's `checkin` capability), `adjustment` (the coach's `adjust` capability, only if modulated), and `actual` + `debrief` (the Analyst, after execution). They are **absent until they apply** — never emit empty placeholders at plan time. At the **week level**, the Analyst also maintains a derived `summary` block (sibling of `sessions`: counts, adherence, durations, `intensity_split_min`, a neutral `read`) — **you do not write it either**; it is absent at plan time and filled only after sessions execute. The week file's shape contract is [`week.schema.json`](../../../extensions/week.schema.json) — **follow the [write checklist](../../../extensions/_artefact_schema.md#emitting-a-core-artefact--the-write-checklist) before emitting** (required keys, `schema_version:"1.0"`, `id == <date>-<slot>`, run-mode fields omitted at plan time). A fully-worked week covering every state (`planned` / `done`+debrief / `adjusted` / `skipped`) **and its `summary`** is in [`../assets/week-example.json`](../assets/week-example.json) — the canonical worked example for any agent creating or reading a week.

6. **Enforce window discipline.** Precise sessions exist **only** in `plan/weeks/*.json` (near horizon). Nothing beyond the ~2-week window may carry zones/intervals. Any change beyond the window must be an explicit, logged entry in the plan's change log (a visible git diff) — never a silent edit.

7. **Cross-check the profile constraints.** No session may violate a hard constraint or a `learned_behavior` (no two consecutive hard days for `no_back_to_back_hard`; no low-cadence high-torque work for `left_knee`; long ride on Sundays only; within `weekly_hours`).

8. **Validate before accepting.** Call the `pace-validate` tool with the plan-checklist.

9. **Act on the report.** **VALID** -> push near-window sessions from `weeks/<active>.json` to the calendar connector; the plan is accepted and ready for Run. **INVALID** -> return the failing hard checks (citing the offending session/block and the violated CSV row) to the Planner's reasoning (you). **Do not auto-fix** a forbidden session.

## Amending an existing plan

If the plan artefacts exist, **advance the window** — don't regenerate the season:
- Add the new `plan/weeks/<week_id>.json` file. **Never overwrite a past week's file** — weeks accumulate and form the session history.
- Update `plan/index.csv`: set the completed week to `status:done`; set the new week to `status:planned` or `status:active`.
- Edit `plan/plan.md` far/mid narrative only if the strategy explicitly changed — then append a change-log row (date · change · diff-visible · reason).
- After amending, **refresh the calendar view** for the changed window (preserve completed rows) via the calendar connector.

## Migrating a legacy plan (pre-v0.5.0)

A plan written before v0.5.0 keeps its precise near-window sessions as **inline Markdown tables** in `plan/plan.md`, with **no `plan/index.csv`** and **no `plan/weeks/*.json`**. When you detect that shape (inline near tables present **and** `plan/index.csv` absent), perform a **one-time migration** — in a **visible diff**, never a silent overwrite:

1. **Emit one `plan/weeks/<week_id>.json` per detailed week** (with `schema_version:"1.0"`). Parse each inline week table into the week schema above: every session becomes `{id, date, slot, sport, type, planned{…}, status, actual:null}` (`id = <date>-<slot>`, `slot:"am"` for a single-session day, `sport` = the discipline), with `planned.target` carrying the **concrete bounds resolved from `athlete/zones.json`** `by_discipline.<sport>` (the table's zone labels -> real watts/bpm/pace, tagged by `metric`). A session the legacy plan recorded as completed keeps `status:"done"`; the rest are `status:"planned"`.
2. **Emit `plan/index.csv`** — one row per week across all three horizons (schema in step 4 above). Set **exactly one** near row to `status:active`, chosen by **today ∈ [`start`,`end`]**. The other near row is `planned`; far/mid rows keep `status:scheduled` with an empty `file`.
3. **Reduce `plan/plan.md` to far + mid + a pointer.** Replace the inline near tables with the near-horizon pointer to `index.csv`/`weeks/`; leave the far/mid narrative intact. **Append a change-log row** (date · "migrated legacy near tables to `weeks/*.json` + `index.csv`" · diff-visible · reason).
4. **Conform + validate.** Each migrated session must stay phase-legal against `periodization-rules.csv`; gate the whole result through `pace-validate`. If a legacy session is already illegal for its phase, **surface it** (back to the Planner's reasoning) rather than silently "fix" it.

**`week_id` & the start-day offset.** Use the **ISO week label** of the week's `start` date as `week_id` (e.g. `2026-W24`); keep the athlete's **real span** in `start`/`end` (a plan that starts on a Tuesday keeps Tue->Mon spans). The active week is whichever row satisfies **today ∈ [`start`,`end`]**, so the +1-day offset needs no recalibration. This migration runs **once**; thereafter the window advances via the `rolling` capability (accumulate, never overwrite).

## Output discipline

This capability emits **no user-facing text of its own**. The written artefacts, the VALID/INVALID outcome, and the wrap-up content (plan built/amended, the near-window sessions impacted, the next step) are **internal results**; *you*, the Planner, voice the single result message in `[surface].language`. Never print the template, the `index.csv`/week JSON, or the validator report to the athlete (`docs/02_method.md`, "Single voice").

## Prohibitions (do not cross)

- ❌ **Never write a session that violates `periodization-rules.csv`** (wrong/forbidden intensity for the phase, or volume off the phase modifier).
- ❌ **Never put precise sessions outside the near window**, and never edit beyond it without a visible change-log entry.
- ❌ **Never compose a session type absent from the sport pack's `key_sessions`.**
- ❌ **Never auto-fill or auto-fix** to pass validation — a failure returns to the Planner's reasoning.
- ❌ **Never invent a fitness marker** to fill `zones.json`. A marker absent from `profile.json` means its zone system is **omitted** from `zones.json` (no default, no guess) and the sessions degrade to a coarser system (`scenarios/05`).
- ❌ **Never overwrite a past week's JSON file** — weeks accumulate; history is never erased.
- ❌ **Never write `profile.json`.** You render and gate the plan artefacts and write the derived `zones.json` only.
