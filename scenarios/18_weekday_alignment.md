# Scenario 18 — Weekday alignment on a non-Monday span

**Tests:** a named weekday resolves to the **real calendar weekday** of a date, never to a position in the week's span · declared-unavailable days stay empty · session dates stay inside their week's span.

## Setup

- Athlete: `athlete/sample.json`. A valid plan exists, phase **build**.
- The plan started on a **Tuesday**, so `plan/index.csv` carries **Tue→Mon** spans while `week_id` keeps the ISO label of the `start` date (`plan-write.md`, "`week_id` & the start-day offset").
- Active near week: `week_id: 2026-W33`, `start: 2026-08-11` (a Tuesday), `end: 2026-08-17` (a Monday).

## Input

Build request (Planner), availability given in **named weekdays**:

> "Changement de programme, je ne peux pas rouler samedi et dimanche. Mes dispos : lundi 1h, mardi 2h, mercredi 3h, jeudi pas le temps, vendredi 1h."

## Expected properties

- [ ] Each named day resolves to the date **whose real calendar weekday is that day**, not to its index in the span. In a Tue→Mon span the only Monday is the **last** day:
  - lundi -> `2026-08-17` · mardi -> `2026-08-11` · mercredi -> `2026-08-12` · vendredi -> `2026-08-14`
- [ ] `jeudi` (`2026-08-13`), `samedi` (`2026-08-15`) and `dimanche` (`2026-08-16`) carry **zero** sessions.
- [ ] Every emitted session's `date` falls within `[start, end]` of its week's row in `index.csv`.
- [ ] `week_id` is the ISO week label of the row's `start` date.
- [ ] Volume matches the named day, not the slot: the 3h session is on **mercredi** (`2026-08-12`).

## Anti-properties (must NOT happen)

- [ ] ❌ Does **not** map "lundi" onto the first day of the span (`2026-08-11`, a Tuesday) — the +1-day shift this scenario exists to catch.
- [ ] ❌ Does **not** place any session on a declared-unavailable weekday.
- [ ] ❌ Does **not** silently renumber `week_id` or move `start`/`end` to force a Monday alignment — the athlete's real span is preserved.
- [ ] ❌ Does **not** rebuild weeks the athlete did not ask about (a correction amends; it does not regenerate the near window).

## Deterministic check

For every session in `weeks/2026-W33.json`: `weekday(date)` ∈ {Monday, Tuesday, Wednesday, Friday} **and** `start <= date <= end`. Any session whose weekday is Thursday, Saturday or Sunday => **fail**. Any session dated outside the span => **fail**.

**Gate:** the four sessions land on `2026-08-17`, `2026-08-11`, `2026-08-12`, `2026-08-14`; the other three dates are empty.
