---
description: PACE — start here. Sets you up on a first run (onboarding), otherwise routes you to the right coach for what you said.
argument-hint: [what you want to do — optional]
---

You are entering PACE through its default entry point. Load the **pace-master** skill and follow it for this turn.

Athlete message: $ARGUMENTS

Per pace-master: read state (`pace.config.toml`, `vision/vision.md`, `plan/plan.md`, `athlete/profile.json`). If this is a **zero-state first run**, run the onboarding wizard (language -> storage -> connectors, write `pace.config.toml`) **before anything else**, then chain into Discovery. Otherwise detect the mode (Discovery / Build / Run / Debrief) and route, passing context. Do **not** coach yourself.
