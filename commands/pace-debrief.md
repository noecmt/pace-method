---
description: Report what you actually did or how your body responded. Forces the Analyst (Debrief).
argument-hint: [what you did / how you feel]
---

Load the **pace** master skill and **force the Debrief route** (equivalent to the `/pace-debrief` token), then hand off to the Analyst (`pace-analyst`).

Athlete message: $ARGUMENTS

The Analyst structures your report onto the session (`actual` + `debrief`), emits a strong signal when a `signals.csv` threshold is crossed, and — on a confirmed durable pattern — appends a `learned_behavior` to `athlete/profile.json` (it is the sole writer of profile *updates*, and it regenerates the derived `athlete/zones.json` if a fitness marker changed).
