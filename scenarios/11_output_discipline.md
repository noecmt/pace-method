# Scenario 11 — Output discipline: one clean message, no leaked machinery

**Tests:** the **Single voice** invariant (`docs/02_method.md`). A simple Run question must return **one** message, in the configured language, with **none** of the internal machinery (routing narration, surface resolution, the check-in capability's internal result) leaked to the athlete. This is the regression captured in the dry-run where "quelle est ma séance du jour ?" returned a page of English orchestration logs (master narration + a "CHECK-IN SUMMARY FOR DAILY COACH" block) before the coach ever spoke. In the master+menu model the master either recites the session itself (concierge) or crosses one boundary to the coach; either way only one message reaches the athlete.

## Setup

- `pace.config.toml` at the workspace root with `[surface].language = "fr"`.
- A valid `vision/vision.md` + `plan/plan.md` + `plan/index.csv` + `plan/weeks/<active>.json` (one `status:active` near week containing today's session) + `athlete/profile.json` + `athlete/zones.json` (fixtures: `athlete/sample.json` / `athlete/sample-zones.json`).

## Input

> "quelle est ma séance du jour ?"

(Run mode — the master either recites the planned session itself (concierge), or, if the athlete wants the *why*, auto-routes to the Daily coach. Either way: one message.)

## Expected properties

- [ ] **Exactly one** user-facing message is produced this turn — the Daily coach's — in **French**.
- [ ] It states today's planned session with **concrete bounds** from `zones.json` (real W/bpm/pace) and the *why this session today* rationale.
- [ ] The master acts **silently**: no "I'm the master", no "routing you to the Daily coach", no mode announcement, no file-read narration.
- [ ] Surface is **forwarded**: the coach does **not** emit a separate surface-resolution step ("Reading surface configuration…", "Resolved surface settings…").
- [ ] The coach's **first token** is already French (no English preamble that then switches).

## Anti-properties (must NOT happen)

- [ ] ❌ A "CHECK-IN SUMMARY", "For Daily Coach:", ASCII table, or any `checkin`-capability internal result is printed to the athlete.
- [ ] ❌ Any routing / loading / surface-resolution narration is shown ("Let me read your state", "Now following the checkin capability…", "Resolved surface settings: …").
- [ ] ❌ Any English text appears while `[surface].language = "fr"`.
- [ ] ❌ More than one assistant message / a multi-section "pipeline log" is shown for this one-line question.

## Deterministic check

The turn's visible output = **one** message (the master's recital, or the coach's), in French, containing ≥1 concrete bound from `zones.json`. Any of {a SUMMARY/table block, routing narration, a surface-resolution dump, English text} present in the visible output => **fail**.

**Gate:** a simple Run question yields one message in `[surface].language`; all machinery (routing, surface resolution, the checkin/adjust capability work) stays silent. Complements scenario 10 (language) — this one gates the *machinery leak*.
