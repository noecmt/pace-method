# Scenario 06 — Routing

**Tests:** `pace-master` detects the right mode and proposes the right persona/workflow;
auto-routes when obvious, proposes 1–3 options otherwise; honors slash commands and
`signals.csv`.

## Setup

- Athlete: `athlete/sample.json`. State varies per case (vision/plan present or not).

## Cases & expected routing

| # | State | Message | Expected route |
| --- | --- | --- | --- |
| G | **Zero-state**: no `pace.config.toml`, no vision, no plan, no profile | "Hi, I want to get fit for a sportive." | **Onboarding** (wizard -> write `pace.config.toml`) **before** Discovery |
| A | No vision, no plan (config exists) | "I want to start training seriously for a gran fondo in September." | **Discovery** (build the vision first) |
| B | Vision + plan exist | "Only got 45 min today." | **Run** (auto — obvious), -> Daily coach |
| C | Vision + plan exist | "I don't think my goal is realistic anymore." | **Propose** partial Discovery *or* rolling (athlete chooses) |
| D | Vision + plan exist | "I've basically skipped my sessions for the last 3 weeks." | **Route to the Analyst (`pace-agent-analyst`)** — `pace-master` does *not* self-diagnose the signal. *(two-step flow, see note below)* |
| E | Any | "/pace-plan" | **Force Build** (slash command overrides detection) |
| F | Vision exists, no plan | "What should I do?" | **Build** (a vision exists, the plan is the missing artefact) |

> **Case D is a two-step flow** (pure-orchestrator model). `pace-master` never turns prose into a signal id; the Analyst(`pace-agent-analyst`) is the sole transformer of prose -> a structured signal in `log/`. So D unfolds as: master classifies the message as an *executed-training fact* -> **routes to the Analyst** -> the Analyst emits `sessions_skipped` -> master reads that signal and maps it via `signals.csv: sessions_skipped (3_weeks) -> partial_discovery_or_rolling` -> **proposes**. Since `pace-agent-analyst` arrives in Sprint 4, the **Sprint-2 pass criterion for D is only the first step**: master routes to the Analyst without self-diagnosing. The downstream proposal is verified end-to-end at Sprint 4/5.

## Expected properties

- [ ] **Zero-state (G)** triggers **Onboarding before Discovery** — the wizard writes `pace.config.toml` (language + storage + connectors) first, then chains into Discovery. It does **not** jump straight to Discovery.
- [ ] Obvious cases (B, E) **auto-route** without a menu.
- [ ] Ambiguous/strong-signal cases (C, D) **propose 1–3 options** and let the athlete choose — never impose.
- [ ] Execution-fact reports route to the Analyst (D) — master does **not** self-label the signal. The eventual proposal matches `signals.csv` rows (verified end-to-end at Sprint 4/5).
- [ ] Slash commands force the route regardless of detection (E).
- [ ] The router **passes context** (relevant artefacts + intent) to the loaded skill.

## Anti-properties (must NOT happen)

- [ ] ❌ Starts coaching itself instead of routing.
- [ ] ❌ On a first run (zero-state), jumps straight to Discovery without onboarding (no `pace.config.toml` written).
- [ ] ❌ Imposes a re-Discovery on a strong signal instead of proposing it.
- [ ] ❌ Routes to Run when no plan exists (should go Discovery/Build).

## Deterministic check

For each case, the chosen route matches the table. For D, the Sprint-2 check is the route to the Analyst (no self-diagnosis); the signal->proposal mapping against `signals.csv` is checked once `pace-agent-analyst` exists (Sprint 4/5). Any mismatch => **fail** for that case.

**Gate:** all cases route as specified; proposals (not impositions) on ambiguity/signals.
