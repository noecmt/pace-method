---
description: (Re)build your training plan from your vision. Forces Build mode.
argument-hint: [what to (re)plan — optional]
---

Load the **pace-master** skill and **force the Build route** (equivalent to the `/pace-plan` token), then hand off to the Planner (`pace-agent-planner` -> `pace-plan-write`).

Athlete message: $ARGUMENTS

The Planner derives the plan from a validated `vision/vision.md`. If no vision exists yet, it bounces back to Discovery first. Every near-horizon session stays inside `periodization-rules.csv`, and its concrete targets come from the derived `athlete/zones.json` (built first, from the profile's fitness markers).
