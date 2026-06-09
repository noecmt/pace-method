---
description: Today's already-planned session — what it is, why, and how to run it. Forces Run mode.
argument-hint: [time you have / how you feel — optional]
---

Load the **pace-master** skill and **force the Run route** (equivalent to the `/pace-today` token), then hand off to the Daily coach (`pace-agent-coach`).

Athlete message: $ARGUMENTS

The Daily coach reads today's session from `plan/plan.md`, explains why **this** session today (with concrete bounds from `athlete/zones.json`, e.g. "Z4 = 227–262 W"), and modulates only within bounds on a signal you actually report. It **never** generates a session. Requires a plan — if none exists, it says so and falls back to Discovery/Build.
