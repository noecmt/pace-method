# extend-custom — declare a custom scalar metric

A **capability of pace-extend**, not a separate skill: a local file you read into the same context. **Following it is not a handoff and not a voice change** — you are still pace-extend. Its single responsibility is to declare a new **custom scalar metric** so it may be tracked alongside a session, by writing a `[custom_metrics.<key>]` sub-table into the athlete's `pace.config.toml`. This file production has no voice.

## What a custom metric is — and is not

`custom` is a **single flat scalar** you want recorded next to a session — morning HRV, sleep hours, bodyweight, RPE. It rides on a session's `planned` / `actual` / `debrief` as a `snake_case` key with a scalar value (number | string | bool). It is **purely additive**: declaring one never bumps the artefact `schema_version` (stays `"1.0"`), and a reader that ignores it still reads a valid 1.0 file. See `extensions/_artefact_schema.md`.

**NOT a custom metric — redirect instead:**
- **A whole domain** (nutrition, recovery, strength). A domain is a *parallel advisor* with its **own artefact**, never a key on the training session. Do not flatten "track my nutrition" into a `custom` field — tell the athlete that is a domain pack (a separate, future advisor), not a metric.
- **A reported value** ("my HRV was 48 today"). That is a *debrief* — `/pace-debrief` (the Analyst). You declare the *capacity to track* `hrv_ms`; the Analyst writes the *value* on the session.

## Inputs

- The athlete's `pace.config.toml` (athlete repo root; test workspace: repo root) — you append to its `[custom_metrics]` section.
- The snippet [`../assets/custom-metrics-snippet.toml`](../assets/custom-metrics-snippet.toml) — the exact shape to write.
- `pace-elicitation` (as a tool) — to gather the four fields below.

## Procedure

1. **Elicit four fields**, one or two questions per turn (via `pace-elicitation`):
   - **key** — a `snake_case` identifier, unit-suffixed where it helps (`hrv_ms`, `sleep_h`, `bodyweight_kg`). Must be a flat scalar concept, not an object or list.
   - **on** — which positions it may appear on: any of `planned` | `actual` | `debrief` (a morning measurement is usually `["actual"]`; a target is `["planned"]`).
   - **type** — `number` | `string` | `bool`.
   - **label** — a human label for display (`"Morning HRV (ms)"`).
2. **Guard the scalar rule.** Reject (and explain) anything that is not a flat scalar, or that is really a domain. Keys stay `snake_case`; no nested tables under the metric beyond the `on`/`type`/`label` triplet.
3. **Write the declaration.** Append a `[custom_metrics.<key>]` sub-table to `pace.config.toml`, modelled on the snippet:
   ```toml
   [custom_metrics.hrv_ms]
   on    = ["actual"]
   type  = "number"
   label = "Morning HRV (ms)"
   ```
   If `[custom_metrics]` already holds the key, **amend in place** (don't duplicate); confirm the change.
4. **Confirm activation.** A custom metric **self-activates** — the declaration *is* the activation. Tell the athlete it is now trackable on the declared positions, and that the **Analyst** will read/write its value at debrief (only declared keys are honoured; an undeclared `custom` key is ignored and flagged by `pace-validate`).

## Output discipline

Emit **no user-facing text of its own**. The written TOML and the confirmation content are **internal results**; *you*, pace-extend, voice the single result message in `[surface].language`. Never print the TOML block to the athlete.

## Prohibitions (do not cross)

- ❌ **Never write a value** onto a session — you declare the *key*, the Analyst writes values.
- ❌ **Never accept a non-scalar or a domain** as a custom metric — redirect a domain; reject an object/list.
- ❌ **Never bump `schema_version`** — `custom` is additive; the artefact stays `"1.0"`.
- ❌ **Never touch any file but `pace.config.toml`** in this mode.
