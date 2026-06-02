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

## Near horizon — precise sessions (~2 weeks, the only modifiable window)

Concrete sessions for the immediate window. Each must respect the block's `allowed_intensity` / `forbidden` from `periodization-rules.csv`.

| Date | Session type | Duration (min) | Zones | Structure / intervals | Phase-legal? |
| --- | --- | --- | --- | --- | --- |
| {{date}} | endurance_long | 120 | Z2 | continuous | ✅ |
| {{date}} | threshold_intervals | 75 | Z4 | 2x20min, 5min Z1 recovery | ✅ |
| {{date}} | recovery_ride | 45 | Z1 | easy, no climbs | ✅ |

---

### Change log (window advances & amendments)

| Date | Change | Diff visible | Reason |
| --- | --- | --- | --- |
| {{date}} | Initial plan created | (initial) | From validated vision |
