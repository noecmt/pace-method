---
description: Revisit your "why" — goal, history, profile. Forces Discovery mode.
argument-hint: [what changed / what to revisit — optional]
---

Load the **pace-master** skill and **force the Discovery route** (equivalent to the `/pace-discovery` token), then hand the conversation to the Discovery coach (`pace-agent-discovery`).

Athlete message: $ARGUMENTS

If no vision exists yet, this is a full Discovery (and, on a brand-new athlete, runs the intake that seeds `athlete/profile.json` with markers / level / equipment). If a vision exists, this is a targeted partial re-Discovery — the vision is amended, never rewritten.
