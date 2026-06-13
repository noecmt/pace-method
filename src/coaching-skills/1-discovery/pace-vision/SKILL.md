---
name: pace-vision
user-invocable: false
description: >-
  The Vision workflow — writes and amends vision/vision.md, the narrative source of truth of
  the PACE method. Invoked BY the Discovery coach (pace-agent-discovery), not a user-facing
  entry point. It takes the material gathered in Discovery, fills the 7-section vision
  template, and validates the result against the vision-checklist via pace-validate before
  the artefact is accepted. The vision is AMENDED, never rewritten: every change is appended
  to the revision history with a date and a reason. It has no voice of its own.
---

# pace-vision — the Vision workflow

A **workflow**, not a persona: **no voice, no user-facing output.** Your single responsibility is the artefact `vision/vision.md`. The Discovery coach owns the conversation and the *why*; you turn the understanding it gathered into a well-formed, validated file. You write **only** when handed material — you never elicit from the athlete yourself.

## Inputs

- The **material gathered by the Discovery coach** (the six narrative sections' content).
- `athlete/profile.json` (test fixture: `athlete/sample.json`) — for the allocation rule below.
- The template [`assets/vision-template.md`](assets/vision-template.md) — 7 sections.
- The validator [`pace-validate`](../../../core-skills/pace-validate/) + its vision-checklist.

## Connectors (capability-detected)

The artefact is persisted through the **storage layer** — [`_schema.md`](../../../../extensions/connectors/_schema.md) protocol: probe the capability, use it if present, **degrade cleanly** if absent (PACE never loses an artefact):

- **Storage (write).** Write/amend `vision/vision.md` at its **logical path**; the backend (`pace-customize` `[connectors].storage`, default `local`) maps it to a file / GitHub commit / Notion page. The **amend-not-rewrite** and revision-history contracts hold identically across backends. If the configured backend is unavailable, **degrade to `local`** and say so — never silently drop the vision. See [`storage.md`](../../../../extensions/connectors/storage.md).

## Procedure

1. **Fill the template.** Map the gathered material into the 7 sections of `assets/vision-template.md`. Use the athlete's own words where you have them. Set `Created` / `Last amended` dates and write the initial revision-history row.
2. **Respect the allocation rule.** The vision carries the **why** (goal, meaning, relationship to effort, the *meaning* of a constraint). **Plannable quantitative facts** (FTP, phase, numeric constraints, `learned_behaviors`) live in `profile.json` — mirror them in prose if useful, but `profile.json` stays authoritative for the Planner.
3. **Amend, never rewrite.** If `vision/vision.md` already exists, do **not** regenerate it. Edit only the targeted section(s) and **append a revision-history row** (date · section amended · reason · by). The narrative is a versioned, auditable artefact (git is the trail).
4. **Validate before accepting.** Call `pace-validate` on the draft with the vision-checklist. Hard checks: all 7 sections present · main goal concrete (a *what* + a *by-when*) · ≥1 real constraint · no invented facts · revision history present · no internal contradiction with a stated constraint.
5. **Act on the report.** **VALID** -> the vision is accepted; hand the wrap-up back to the **Discovery coach**, who tells the athlete it's captured and they can move to Build (the Planner). **INVALID** -> return the failed hard checks to the Discovery coach to elicit/correct the gap. **Do not auto-fill** a missing section or quietly resolve a contradiction yourself.

## Output discipline

You emit **no user-facing text**. The filled/validated vision and the VALID/INVALID outcome are **internal objects** returned to the Discovery coach, who voices the wrap-up (or re-elicits on INVALID). Never print the template, the diff, or the validator report to the athlete (`docs/02_method.md`, "Single voice, silent pipeline").

## Prohibitions (do not cross)

- ❌ **Never invent content** to pass validation — no fabricated goal, constraint, or preference. A gap returns to Discovery; it is not filled by you.
- ❌ **Never rewrite the vision** wholesale — amend the relevant section and log it.
- ❌ **Never write `profile.json`** — that is the Analyst's sole file. You may read it.
- ❌ **No voice, no coaching.** You don't converse with the athlete; the Discovery coach does.
