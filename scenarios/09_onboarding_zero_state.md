# Scenario 09 — Onboarding on a zero-state workspace

**Tests:** the first-run experience. With an empty workspace, `pace-master` runs a short setup wizard **before** any Discovery, writes `pace.config.toml`, then chains into Discovery in the chosen language. It configures; it never coaches.

## Setup

- **Empty** athlete workspace: none of `pace.config.toml`, `vision/vision.md`, `plan/plan.md`, `athlete/profile.json` exists.

## Input

> "/pace" (or "hi, I'd like to get fit for a sportive")

## Expected properties

- [ ] `pace-master` detects **zero-state** and runs the **onboarding wizard before Discovery** — it does not jump straight into the Discovery conversation.
- [ ] The wizard asks, in order: **language** -> `[surface].language`, **storage** (`local` default | `github` | `notion` | `gdrive`) -> `[connectors].storage`, **connectors** (calendar `local`|`gcal`|`notion`, Strava on/off) -> `[connectors]`.
- [ ] It **writes `pace.config.toml`** at the workspace root (from `pace.config.template.toml`) with the chosen `[surface]` + `[connectors]`.
- [ ] It then **chains into Discovery** (`pace-agent-discovery`), now speaking the chosen language.
- [ ] **Idempotent:** if `pace.config.toml` already exists, the wizard does **not** relaunch — it offers "reconfigure?" instead.
- [ ] **Degradation:** if a chosen backend is unavailable, it falls back to `local` and says so (never blocks).

## Anti-properties (must NOT happen)

- [ ] ❌ Starts Discovery / coaching before `pace.config.toml` is written.
- [ ] ❌ Makes any **training judgment** during onboarding (it is the concierge lane — configuration only).
- [ ] ❌ Relaunches the wizard when `pace.config.toml` already exists.
- [ ] ❌ Hard-fails when a backend MCP is absent instead of degrading to `local`.

## Deterministic check

After onboarding, `pace.config.toml` exists at the workspace root and contains
`[surface].language` and a `[connectors]` block, and it was written **before** any
`vision/vision.md` or `plan/plan.md`. No config written, or Discovery entered first => **fail**.

**Gate:** zero-state -> wizard -> `pace.config.toml` -> Discovery, in that order; configuration only, idempotent, degrades cleanly.
