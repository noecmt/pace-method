# 07 — Customize merge spec (no runtime)

The rules every PACE agent follows to resolve its `customize.toml` **once, at activation**, by the LLM — no Python, no runtime. This is the spec the former `pace-customize` skill carried; it is now **documentation the agents follow**, not a skill (see `06_architecture_pivot.md` §4.3). Each voiced agent applies it to itself as it loads; because the agent then stays the single voice for the whole flow, the resolved surface — above all the language — **cannot drift**.

---

## The hard line: surface only

`customize.toml` may adjust **how** an agent sounds and how deep it probes — **never what it is or what it may do.**

**May be overridden (surface allow-list):**
- `language` — output language (e.g. `en`, `fr`). **Single source: `pace.config.toml` `[surface].language`** (see *Language has a single source*).
- `verbosity` — `terse | normal | rich`.
- `voice_tone` — a *nuance* to an agent's **fixed** voice (e.g. "warmer", "more concise"); never a new role.
- `elicitation_depth` — `light | normal | deep` (Discovery only).
- `preferred_method` — default method (e.g. `polarized`); `profile.json` still wins on plannable facts.

**Never overridden (fixed — ignore any key that tries):**
- roles & strict agent separation; the **prohibitions** in any `SKILL.md`; the `periodization-rules.csv` guardrails; the artefact contracts (sole writers, amend-not-rewrite); **plan-first**; the **modulate-vs-generate** boundary; the deterministic CSV checks.

## Precedence

Resolve in this order, later wins **but only within the surface allow-list**: a **global default** (the values documented here) < **the agent's own `customize.toml`** < **the athlete instance config `pace.config.toml`** (at the athlete repo root — the highest-precedence override). Anything outside the allow-list is dropped.

**Surface is resolved once, then held.** The `pace` master reads `pace.config.toml` in its state pass and **forwards `[surface]`** in the context bundle; the launched agent **consumes the forwarded surface** and applies it — above all the **language** — to its very first words, then stays active for the whole flow. An agent reads `pace.config.toml` `[surface]` **itself** only when it was entered directly (no bundle) or during zero-state onboarding (the initial `pace.config.toml` write). Either way `[surface]` is resolved **before the first word**: an agent that speaks before resolving it is a bug (the old "language not respected" regression).

## Language has a single source

`pace.config.toml` `[surface].language` is the **one authoritative source** of output language. The only writer of it is the **onboarding wizard** (run by the `pace` master). To change the language, reconfigure — do not edit it elsewhere. **`profile.json.language` is deprecated and ignored** — it is *not* a language source. (This removes the contradiction that caused the regression: `profile.json` said `fr` while the pack default said `en`, so each persona re-read the default and reverted to English. Now there is exactly one source, and the persistent agent never re-resolves it mid-flow.)

## Procedure (the agent applies to itself)

1. **Load** the global defaults (below), then the agent's own `customize.toml`, then any athlete override from `pace.config.toml`.
2. **Filter to the allow-list.** Keep only `language`, `verbosity`, `voice_tone`, `elicitation_depth`, `preferred_method`. Silently drop anything else.
3. **Apply** the kept keys to the agent's **surface** — language/verbosity/tone nuance, Discovery depth, default method — without altering its role or any prohibition.
4. **Refuse-by-ignoring.** If a key would relax a fixed rule (a guardrail, a prohibition, a contract), **ignore that key** and proceed; optionally note it once.

## Global surface defaults

```toml
[surface]
language = "en"        # SINGLE SOURCE = pace.config.toml [surface].language; profile.json.language is deprecated/ignored
verbosity = "normal"   # terse | normal | rich

[discovery]
elicitation_depth = "normal"   # light | normal | deep (Discovery coach only)

[planning]
preferred_method = ""  # default method, e.g. "polarized"; empty = derive from profile.json
```

## Connector configuration (not a surface trait)

Connectors are **not** surface traits — they are the MCP capability layer (read + write), recorded in the `[connectors]` block of `pace.config.toml` by the `pace` master's onboarding wizard (the **sole recorder**):

- `storage` — `local` (default) | `github` | `notion` | `gdrive` — where artefacts live (see `extensions/connectors/storage.md`).
- `calendar` — `local` (default) | `gcal` | `notion` — where upcoming sessions are delivered; `local` writes `plan/calendar.csv` (see `extensions/connectors/calendar.md`).
- `strava` — `true|false` — use the Strava MCP read connector **when available** (see `extensions/connectors/strava.md`).

The master only **records** this config. The agents' **capabilities** consume it at use time — read in the coach's `checkin`, the Analyst, and the Planner's `rolling`; calendar in the Planner's `plan-write`/`rolling` and the coach's `adjust`; storage in every persisting capability — each running the capability-detection + graceful-degradation protocol of `extensions/connectors/_schema.md` (MCP absent -> manual entry / local filesystem / `plan/calendar.csv`). No runtime. A connector never becomes a persona, is never called from the master to decide, and never generates a session.

## customize.toml structure (each agent)

Each agent's `customize.toml` carries (a) an optional `[surface]` (the overridable keys above, commented out unless the athlete sets them), and — wired in the command-surface step — (b) its `[[agent.menu]]` items, each dispatching to **a capability** via `prompt = "Read and follow {skill-root}/references/<x>.md"` or to **a shared tool** via `skill = "pace-validate"`. The menu is the BMAD `[[agent.menu]]` rendered for the host (and for pace-chat, as the intent menu with a "talk freely" escape hatch).

**The master's routing menu items use `prompt`, not `skill`.** Routing from the master to a voiced agent is a **silent Read-and-continue** (`references/routing.md` §0): the item's `prompt` instructs the master to `Read` the target agent's `SKILL.md` (+ its capability file) into the same turn and continue *as* that agent — there is no runtime that "invokes" the agent as a separate skill (`06_architecture_pivot.md` §2). `skill =` therefore stays reserved for genuine **shared tools** (`pace-validate`, `pace-elicitation`), which an agent calls while keeping its voice.

*Last updated: June 2026 (master-concierge + menu model, per ADR `06_architecture_pivot.md`)*
