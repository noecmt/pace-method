# vision-write — the Vision capability

A **capability of the Discovery coach** (`pace-discovery`), not a separate skill: a local file the coach reads into the same context. **Following it is not a handoff and not a voice change** — you are still the Discovery coach; this file just tells you how to turn the understanding you gathered into a well-formed, validated `vision/vision.md`. You write **only** when you have material (you gathered it conversationally above); the file production here has no voice and emits no user-facing text of its own.

## Inputs

- The **material you gathered** in the conversation (the six narrative sections' content).
- `athlete/profile.json` (forwarded in the context bundle, or test fixture `athlete/sample.json`) — for the allocation rule below.
- The template [`../assets/vision-template.md`](../assets/vision-template.md) — 7 sections.
- The validator tool [`pace-validate`](../../pace-validate/) + its vision-checklist.

## Connectors (capability-detected)

The artefact is persisted through the **storage layer** — [`_schema.md`](../../../extensions/connectors/_schema.md) protocol: probe the capability, use it if present, **degrade cleanly** if absent (PACE never loses an artefact):

- **Storage (write).** Write/amend `vision/vision.md` at its **logical path**; the backend (`pace.config.toml` `[connectors].storage`, default `local`) maps it to a file / GitHub commit / Notion page. The **amend-not-rewrite** and revision-history contracts hold identically across backends. If the configured backend is unavailable, **degrade to `local`** and say so — never silently drop the vision. See [`storage.md`](../../../extensions/connectors/storage.md).

## Procedure

1. **Fill the template.** Map the gathered material into the 7 sections of `../assets/vision-template.md`. Use the athlete's own words where you have them. Set `Created` / `Last amended` dates and write the initial revision-history row.
2. **Respect the allocation rule.** The vision carries the **why** (goal, meaning, relationship to effort, the *meaning* of a constraint). **Plannable quantitative facts** (FTP, phase, numeric constraints, `learned_behaviors`) live in `profile.json` — mirror them in prose if useful, but `profile.json` stays authoritative for the Planner.
3. **Amend, never rewrite.** If `vision/vision.md` already exists, do **not** regenerate it. Edit only the targeted section(s) and **append a revision-history row** (date · section amended · reason · by). The narrative is a versioned, auditable artefact (git is the trail).
4. **Validate before accepting.** Call the `pace-validate` tool on the draft with the vision-checklist. Hard checks: all 7 sections present · main goal concrete (a *what* + a *by-when*) · ≥1 real constraint · no invented facts · revision history present · no internal contradiction with a stated constraint.
5. **Act on the report.** **VALID** -> the vision is accepted; tell the athlete it's captured and they can move to Build (the Planner). **INVALID** -> go back and elicit/correct the failed hard checks yourself (you are the Discovery coach — there is no other persona to hand to). **Do not auto-fill** a missing section or quietly resolve a contradiction.

## Output discipline

This capability emits **no user-facing text of its own**. The filled/validated vision and the VALID/INVALID outcome are **internal results**; *you*, the Discovery coach, voice the wrap-up (or re-elicit on INVALID) in your own voice and in `[surface].language`. Never print the template, the diff, or the validator report to the athlete (`docs/02_method.md`, "Single voice").

## Prohibitions (do not cross)

- ❌ **Never invent content** to pass validation — no fabricated goal, constraint, or preference. A gap is re-elicited; it is not filled here.
- ❌ **Never rewrite the vision** wholesale — amend the relevant section and log it.
- ❌ **Never write `profile.json`** — that is the Analyst's sole file (the intake creates it once). You may read it.
- ❌ **No invented coaching content** — this capability only renders + validates what was gathered in the conversation.
