# Scenario 14 — Proactive rolling nudge

**Tests:** the `pace` master detects, from `plan/index.csv`, that **no near week is planned after the active one** and proactively **proposes** extending the plan (`/pace-plan`, the Planner's `rolling` capability) — in the concierge lane, propose-never-impose. The horizon-depletion fact is read from plan state; it is **not** a signal (it never touches the Analyst or `signals.csv`).

## Setup

- Athlete: `athlete/sample.json`; vision + plan exist.
- `plan/index.csv` has the **current** week as the only `horizon:near` row (`status:active`); every later week is still `horizon:mid` (or `far`), so there is **no `status:planned` near row after the active one**.
- `[surface].language = fr`.

## Cases & expected behavior

| # | State | Message | Expected |
| --- | --- | --- | --- |
| A | No near week after the active one | "où j'en suis ?" / "what's up?" (a state / re-engagement opener) | The master recites where they are (mode, active week, today's planned session **verbatim**) **and appends a one-line proposal**: next week isn't planned yet — `/pace-plan` to extend (rolling). One aiguillage question. |
| B | Same state | Athlete accepts ("oui, planifie la semaine pro") **or** types `/pace-plan` | Route to the **Planner** (Build/rolling); the master hands it the rolling proposal. The Planner's `rolling` capability promotes the next `mid` row to a precise `weeks/<id>.json`. |
| C | A `status:planned` near week **already exists** after the active one | any opener | **No** rolling nudge — the window is not depleted. The master stays in its normal lane. |
| D | No near week after the active one | "only 45 min today" (an **obvious** Run intent) | The master **auto-routes** to the coach and stays **silent** (single voice). The nudge is **not** stapled onto the coach hand-off; it waits for a concierge moment. |

## Expected properties

- [ ] **Owner = master, source = plan state.** The depletion is read from `plan/index.csv` (no near row `planned`/`active` after the active one). It is **not** an executed-training fact, so it does **not** go through the Analyst or `signals.csv`.
- [ ] **Trigger = no near week after the active one** (chosen threshold): the nudge fires as soon as there is no materialized buffer beyond the current week — not only at the very end of it.
- [ ] **Propose, never impose (A).** The nudge is a single concierge line + the `/pace-plan` pointer; the master does not roll the plan itself and does not auto-route to the Planner without the athlete's go-ahead or a command.
- [ ] **Concierge lane only (D).** When the turn is an obvious Run intent, the master auto-routes silently; the nudge is deferred to a concierge/state moment — it never breaks single voice.
- [ ] **Hook exists (B).** On acceptance/command the Planner's `rolling` capability runs unchanged ("the master handed you a rolling proposal"), accumulating a new `weeks/<id>.json` and advancing `index.csv` — never overwriting a past week.

## Anti-properties (must NOT happen)

- [ ] ❌ The master **rolls the plan itself** or generates/edits sessions (that is the Planner).
- [ ] ❌ The depletion is laundered through the Analyst or written as a bullet in `log/signals.md` (it is plan state, not a signal).
- [ ] ❌ The nudge is **stapled onto an auto-route** to the coach (two voices in one turn).
- [ ] ❌ The master **nags** the rolling proposal on every turn, or imposes the roll without consent.
- [ ] ❌ The nudge fires when a `status:planned` near week already exists (C).

## Deterministic check

With `index.csv` exposing exactly one `horizon:near` row (`status:active`) and no later `status:planned` near row: case A surfaces the rolling proposal; case C (a `planned` near row present) surfaces none. On acceptance (B), the route target is `pace-planner` and the resulting `index.csv` gains a new near row with a `file: weeks/<id>.json`. Any mismatch => **fail**.

**Gate:** the master proactively proposes rolling on horizon depletion (A), stays silent on an obvious auto-route (D), never imposes or self-rolls, and the Planner's `rolling` runs on acceptance (B).
