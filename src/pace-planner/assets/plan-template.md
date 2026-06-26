# Plan — {{athlete_name}}

> Hierarchical, rolling-horizon plan. **Hard constraint:** nothing beyond the immediate ~2-week window is modified without an explicit, visible git diff. The plan must conform to `periodization-rules.csv` for every phase it uses. Derived from `vision/vision.md` + `athlete/profile.json` + the sport pack.

_Created: {{date}} · Sport: {{sport_id}} · Fitness marker: {{ftp_or_marker}} · Source vision: vision.md@{{commit}}_

---

## Far horizon — season blocks (stable)

High-level periodization. Intents only, no sessions. Each block names its phase (must be a row in `periodization-rules.csv`).

| Block | Phase | Approx. dates | Weeks | Focus / intent |
| --- | --- | --- | --- | --- |
| 1 | base | {{start}}–{{end}} | {{n}} | Aerobic base, Z2 volume |
| 2 | build | {{start}}–{{end}} | {{n}} | Goal-specific intensity |
| 3 | taper | {{start}}–{{end}} | {{n}} | Shed fatigue, hold sharpness |
| 4 | race | {{date}} | — | Goal event |
| 5 | recovery | {{start}}–{{end}} | {{n}} | Transition / rest |

## Mid horizon — approximate weeks (intents, no sessions)

For the current and next block: per-week intent and load shape (load vs recovery week, target volume modifier from the phase). **No precise sessions here.**

| Week | Block / phase | Intent | Load type | Volume modifier |
| --- | --- | --- | --- | --- |
| W{{n}} | build | Introduce threshold | load | 1.0 |
| W{{n+1}} | build | Consolidate | recovery | 0.7 |

## Near horizon — active week (precise sessions)

Precise sessions live in `plan/weeks/<week_id>.json`, routed by `plan/index.csv`.

To access today's session(s): read `plan/index.csv` -> find the row where `status = active` and `horizon = near` -> load `plan/weeks/<week_id>.json` -> find the session(s) whose `date` is today (a day may hold more than one, distinguished by `slot`; each is keyed by `id = <date>-<slot>`).

`plan/index.csv` covers the full season (all three horizons). Far and mid rows are approximate and have no `file`; near rows carry a `file` path and a concrete status:

```csv
week_id,horizon,start,end,block,phase,intent,load_type,volume_modifier,status,file
{{far_week_id}},far,{{start}},{{end}},{{block}},{{phase}},{{intent}},,,scheduled,
{{mid_week_id}},mid,{{start}},{{end}},{{block}},{{phase}},{{intent}},{{load_type}},{{volume_modifier}},scheduled,
{{near_week_id}},near,{{start}},{{end}},{{block}},{{phase}},{{intent}},{{load_type}},{{volume_modifier}},active,weeks/{{near_week_id}}.json
```

A filled example index (full season, all three horizons) lives in `assets/index-example.csv`.

Each `plan/weeks/<week_id>.json` carries the precise sessions for that week, including the concrete zone bounds copied from `athlete/zones.json`.

---

### Change log (window advances & amendments)

| Date | Change | Diff visible | Reason |
| --- | --- | --- | --- |
| {{date}} | Initial plan created | (initial) | From validated vision |
