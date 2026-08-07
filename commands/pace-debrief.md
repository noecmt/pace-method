---
description: Report what you actually did or how your body responded. Forces the Analyst (Debrief).
argument-hint: [what you did / how you feel]
---

This command **forces the Debrief route**. Carry it out **in this one turn**, all in the same context — do not split it across turns:

1. **Read `src/pace/SKILL.md`** only to (a) apply the zero-state guard and (b) load `config`, plus what `references/routing.md` §6 lists for Debrief (today's session, recent `plan/weeks/*.json` + `log/signals.md`, `athlete/profile.json`, `athlete/zones.json`) — fresh, per `pace/SKILL.md` step 4 (the route is already forced, so no mode/lane detection needed).
2. **Then immediately `Read src/pace-analyst/SKILL.md`** into this same context and **continue as the Analyst**, running the flow through to the Analyst's message.

This is a **silent context operation, not a handoff**: emit no "routing / handing off" text, and **do not end the turn** on the route decision. The Analyst resolves `[surface].language` from the bundle's `config` and speaks it from its first token.

Athlete message: $ARGUMENTS

The Analyst structures your report onto the session (`actual` + `debrief`), emits a strong signal when a `signals.csv` threshold is crossed, and — on a confirmed durable pattern — appends a `learned_behavior` to `athlete/profile.json` (it is the sole writer of profile *updates*, and it regenerates the derived `athlete/zones.json` if a fitness marker changed).
