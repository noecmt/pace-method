# Scenario 06 — Routing

**Tests:** the `pace` master detects the right mode and proposes the right agent;
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
| D | Vision + plan exist | "I've basically skipped my sessions for the last 3 weeks." | **Route to the Analyst (`pace-analyst`)** — the master does *not* self-diagnose the signal. *(two-step flow, see note below)* |
| E | Any | "/pace-plan" | **Force Build** (slash command overrides detection) |
| F | Vision exists, no plan | "What should I do?" | **Build** (a vision exists, the plan is the missing artefact) |

> **Case D is a two-step flow** (pure-orchestrator model). The master never turns prose into a signal id; the Analyst (`pace-analyst`) is the sole transformer of prose -> a structured signal in `log/signals.md`. So D unfolds as: master classifies the message as an *executed-training fact* -> **routes to the Analyst** -> the Analyst emits `sessions_skipped` -> master reads that signal and maps it via `signals.csv: sessions_skipped (3_weeks) -> partial_discovery_or_rolling` -> **proposes**. Both steps are verifiable end-to-end now that the Analyst exists: the master routes to the Analyst without self-diagnosing, and the downstream proposal matches the `signals.csv` row.

## Expected properties

- [ ] **Zero-state (G)** triggers **Onboarding before Discovery** — the wizard writes `pace.config.toml` (language + storage + connectors) first, then chains into Discovery. It does **not** jump straight to Discovery.
- [ ] Obvious cases (B, E) **auto-route** without a menu.
- [ ] Ambiguous/strong-signal cases (C, D) **propose 1–3 options** and let the athlete choose — never impose.
- [ ] Execution-fact reports route to the Analyst (D) — master does **not** self-label the signal. The eventual proposal matches `signals.csv` rows.
- [ ] Slash commands force the route regardless of detection (E).
- [ ] The router **passes context** (relevant artefacts + intent) to the launched agent.

## Anti-properties (must NOT happen)

- [ ] ❌ Starts coaching itself instead of routing.
- [ ] ❌ On a first run (zero-state), jumps straight to Discovery without onboarding (no `pace.config.toml` written).
- [ ] ❌ Imposes a re-Discovery on a strong signal instead of proposing it.
- [ ] ❌ Routes to Run when no plan exists (should go Discovery/Build).

## Deterministic check

For each case, the chosen route matches the table. For D, check both the route to the Analyst (no self-diagnosis) and the signal->proposal mapping against `signals.csv`. Any mismatch => **fail** for that case.

**Gate:** all cases route as specified; proposals (not impositions) on ambiguity/signals.
