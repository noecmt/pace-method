---
description: (Re)build your training plan from your vision. Forces Build mode.
argument-hint: [what to (re)plan — optional]
---

This command **forces the Build route**. Carry it out **in this one turn**, all in the same context — do not split it across turns:

1. **Read `src/pace/SKILL.md`** only to (a) apply the zero-state guard and (b) build the forwarded context bundle `{config, profile, zones, active_week}` from state (`pace.config.toml`, `athlete/profile.json`, `athlete/zones.json`, the active `plan/weeks/*.json`).
2. **Then immediately `Read src/pace-planner/SKILL.md` and `src/pace-planner/references/plan-write.md`** into this same context and **continue as the Planner**, running the full Build flow through to the Planner's single result message.

This is a **silent context operation, not a handoff**: emit no "routing / handing off / waiting for the Planner" text, and **do not end the turn** until the Planner's result message is produced. The Planner resolves `[surface].language` from the bundle's `config` and speaks it from its first token.

Athlete message: $ARGUMENTS

The Planner derives the plan from a validated `vision/vision.md`. If no vision exists yet, it bounces back to Discovery first. Every near-horizon session stays inside `periodization-rules.csv`, and its concrete targets come from the derived `athlete/zones.json` (built first, from the profile's fitness markers).
