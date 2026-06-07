---
name: pace-customize
description: >-
  The customization core skill — reads a skill's customize.toml and applies SURFACE overrides (output language, verbosity, a persona's tonal nuance, Discovery elicitation depth, default preferred method) to PACE personas and workflows. Invoked BY a persona/workflow as it loads (or by pace-master), never a user-facing entry point. It resolves the override precedence (skill default -> athlete override) and applies ONLY surface traits. It NEVER overrides a role, a prohibition, the periodization guardrails, the artefact contracts, plan-first, or the modulate-vs-generate boundary — those are fixed. No runtime: it is Markdown instructions a host LLM follows, not a script.
---

# pace-customize — surface customization

A **core skill**, not a persona: **no voice, writes no artefact.** It is the one place that answers "how do I apply this athlete's surface preferences to a skill?" the same way every time. A persona/workflow loads you as it starts; you read the relevant `customize.toml`, keep only the allowed surface keys, and apply them. **No runtime** — BMAD resolves customization with a Python script; PACE does not. You are instructions the host follows directly.

## The hard line: surface only

`customize.toml` may adjust **how** a skill sounds and how deep it probes — **never what it is or what it may do.**

**May be overridden (surface allow-list):**
- `language` — output language (e.g. `en`, `fr`).
- `verbosity` — `terse | normal | rich`.
- `voice_tone` — a *nuance* to a persona's **fixed** voice (e.g. "warmer", "more concise"); never a new role.
- `elicitation_depth` — `light | normal | deep` (Discovery only).
- `preferred_method` — default method (e.g. `polarized`); `profile.json` still wins on plannable facts.

**Never overridden (fixed — ignore any key that tries):**
- roles & strict persona separation; the **prohibitions** in any `SKILL.md`; the `periodization-rules.csv` guardrails; the artefact contracts (sole writers, amend-not-rewrite); **plan-first**; the **modulate-vs-generate** boundary; the deterministic CSV checks.

## Precedence

Read **this skill's [`customize.toml`](customize.toml)** as the global default, then **the target skill's own `customize.toml`**, then **an athlete-level override** if the athlete provides one. Later wins — **but only within the surface allow-list**. Anything outside it is dropped.

## Inputs

- the target skill's `customize.toml` (e.g. [`../../coaching-skills/3-run/pace-agent-coach/customize.toml`](../../coaching-skills/3-run/pace-agent-coach/customize.toml)).
- this skill's [`customize.toml`](customize.toml) — the global defaults / canonical schema.
- the athlete-level override, if present.

## Procedure

1. **Load** the global defaults (this skill's `customize.toml`), then the target skill's `customize.toml`, then any athlete override.
2. **Filter to the allow-list.** Keep only `language`, `verbosity`, `voice_tone`, `elicitation_depth`, `preferred_method`. Silently drop anything else.
3. **Apply** the kept keys to the loading skill's **surface** — language/verbosity/tone nuance, Discovery depth, default method — without altering its role or any prohibition.
4. **Refuse-by-ignoring.** If a key would relax a fixed rule (a guardrail, a prohibition, a contract), **ignore that key** and proceed; optionally note it once.

## Prohibitions (do not cross)

- ❌ **Never relax** a prohibition, a periodization guardrail, an artefact contract, plan-first, or the modulate-vs-generate boundary.
- ❌ **Never change a persona's role** or grant it another persona's ownership (e.g. let anyone but the Analyst write `profile.json`).
- ❌ **Never introduce a runtime/script** — customization is Markdown-applied only.

## Future (Stage C — MCP layer)

This skill is also the intended **single configuration point** for the connector/storage capability layer: which storage backend holds the athlete artefacts (local filesystem / GitHub MCP / Notion), and whether the Strava MCP is connected. That contract is designed with the MCP layer (read + write), using the same `customize.toml` plus the plugin's native `userConfig`; it is **not** specified here yet.
