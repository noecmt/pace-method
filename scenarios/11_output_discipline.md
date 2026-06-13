# Scenario 11 — Output discipline: one clean message, no leaked machinery

**Tests:** the **Single voice, silent pipeline** invariant (`docs/02_method.md`). A simple Run question must return **one** message, in the configured language, with **none** of the internal pipeline (routing narration, surface resolution, the check-in handoff) leaked to the athlete. This is the regression captured in the dry-run where "quelle est ma séance du jour ?" returned a page of English orchestration logs (pace-master narration + a "CHECK-IN SUMMARY FOR DAILY COACH" block) before the coach ever spoke.

## Setup

- `pace.config.toml` at the workspace root with `[surface].language = "fr"`.
- A valid `vision/vision.md` + `plan/plan.md` + `plan/index.csv` + `plan/weeks/<active>.json` (one `status:active` near week containing today's session) + `athlete/profile.json` + `athlete/zones.json` (fixtures: `athlete/sample.json` / `athlete/sample-zones.json`).

## Input

> "quelle est ma séance du jour ?"

(Run mode, obvious — `pace-master` auto-routes to the Daily coach.)

## Expected properties

- [ ] **Exactly one** user-facing message is produced this turn — the Daily coach's — in **French**.
- [ ] It states today's planned session with **concrete bounds** from `zones.json` (real W/bpm/pace) and the *why this session today* rationale.
- [ ] `pace-master` auto-routes **silently**: no "I'm pace-master", no "routing you to the Daily coach", no mode announcement, no file-read narration.
- [ ] Surface is **forwarded**: the coach does **not** emit a separate `pace-customize` step ("Reading surface configuration…", "Resolved surface settings…").
- [ ] The coach's **first token** is already French (no English preamble that then switches).

## Anti-properties (must NOT happen)

- [ ] ❌ A "CHECK-IN SUMMARY", "For Daily Coach:", ASCII table, or any `pace-checkin` internal handoff is printed to the athlete.
- [ ] ❌ Any routing / loading / surface-resolution narration is shown ("Let me read your state", "Now loading pace-checkin…", "Resolved surface settings: …").
- [ ] ❌ Any English text appears while `[surface].language = "fr"`.
- [ ] ❌ More than one assistant message / a multi-section "pipeline log" is shown for this one-line question.

## Deterministic check

The turn's visible output = **one** coach message, in French, containing ≥1 concrete bound from `zones.json`. Any of {a SUMMARY/table block, routing narration, a `pace-customize` resolution dump, English text} present in the visible output => **fail**.

**Gate:** a simple Run question yields one persona message in `[surface].language`; the entire pipeline (routing, surface, check-in handoff) stays silent. Complements scenario 10 (language) — this one gates the *machinery leak*.
