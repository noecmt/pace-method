# Scenario 06 — Routing

**Tests:** `pace-master` detects the right mode and proposes the right persona/workflow;
auto-routes when obvious, proposes 1–3 options otherwise; honors slash commands and
`signals.csv`.

## Setup

- Athlete: `athlete/sample.json`. State varies per case (vision/plan present or not).

## Cases & expected routing

| # | State | Message | Expected route |
| --- | --- | --- | --- |
| A | No vision, no plan | "I want to start training seriously for a gran fondo in September." | **Discovery** (build the vision first) |
| B | Vision + plan exist | "Only got 45 min today." | **Run** (auto — obvious), -> Daily coach |
| C | Vision + plan exist | "I don't think my goal is realistic anymore." | **Propose** partial Discovery *or* rolling (athlete chooses) |
| D | Vision + plan exist | "I've basically skipped my sessions for the last 3 weeks." | `signals.csv: sessions_skipped (3_weeks) -> partial_discovery_or_rolling` — **propose** |
| E | Any | "/pace-plan" | **Force Build** (slash command overrides detection) |
| F | Vision exists, no plan | "What should I do?" | **Build** (a vision exists, the plan is the missing artefact) |

## Expected properties

- [ ] Obvious cases (B, E) **auto-route** without a menu.
- [ ] Ambiguous/strong-signal cases (C, D) **propose 1–3 options** and let the athlete choose — never impose.
- [ ] Strong-signal proposals match `signals.csv` rows (D).
- [ ] Slash commands force the route regardless of detection (E).
- [ ] The router **passes context** (relevant artefacts + intent) to the loaded skill.

## Anti-properties (must NOT happen)

- [ ] ❌ Starts coaching itself instead of routing.
- [ ] ❌ Imposes a re-Discovery on a strong signal instead of proposing it.
- [ ] ❌ Routes to Run when no plan exists (should go Discovery/Build).

## Deterministic check

For each case, the chosen route matches the table; strong-signal proposals match `signals.csv`. Any mismatch => **fail** for that case.

**Gate:** all cases route as specified; proposals (not impositions) on ambiguity/signals.
