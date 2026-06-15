# Scenario 08 — Intake seeds the profile

**Tests:** the Discovery intake. On a brand-new athlete, the Discovery coach captures the **fitness markers, current level, and equipment**, and writes the **initial** `athlete/profile.json` from them — without inventing a value, and without the Analyst being the creator.

## Setup

- **No** `athlete/profile.json` and **no** `vision/vision.md` (clean athlete workspace).
- The athlete starts a Discovery conversation (e.g. via `/pace-discovery`, or routed there by the `pace` master).

## Input

A new cyclist describes themselves over the conversation, e.g.:

> "I'm a cyclist. My FTP is around 250 W and my max heart rate is 185. I train about 10 h a week, mostly endurance, and I've got a power meter and an indoor trainer."

(Variant — unknown marker: "I don't actually know my FTP" -> the coach proposes a test or a recent-performance estimate, and leaves the field absent until then.)

## Expected properties

- [ ] The coach runs the intake **conversationally** — one or two targeted questions per turn (via `marker_elicitation` / `equipment_check` in `methods.csv`), **not** a form.
- [ ] It captures the three intake families: **markers** (`ftp_watts`, `max_hr`), **current level** (weekly load / volume, recent history), and **equipment** (incl. whether an **indoor trainer** is available).
- [ ] It writes the **initial** `athlete/profile.json` with those fields under `fitness`, `level`/`training_volume`, and `equipment` — seeded **only** from what the athlete actually said.
- [ ] The captured markers are what the Planner will later turn into `athlete/zones.json` (intake -> markers -> derived zones).
- [ ] **Variant:** an unknown marker is left **absent** from `profile.json` (not `null`-with-a-guess, not invented); the coach offers a test instead.

## Anti-properties (must NOT happen)

- [ ] ❌ The **Analyst (`pace-analyst`) creates** `profile.json` — creation belongs to the intake; the Analyst only *updates* it afterwards.
- [ ] ❌ The coach **invents** a marker the athlete didn't give (e.g. fills `max_hr` with a guessed number).
- [ ] ❌ The intake is dumped as a long questionnaire.
- [ ] ❌ The intake data is written into `vision/vision.md` (markers/level/equipment are plannable -> `profile.json`, not the narrative Vision).

## Deterministic check

Every value present in the newly created `profile.json` must be traceable to the athlete's
input. A field populated with a value the athlete never gave => **fail**. `profile.json`
created by any persona other than the Discovery intake => **fail**.

**Gate:** intake captures markers + level + equipment; `profile.json` is seeded by the intake (not the Analyst); nothing invented; unknown markers left absent.
