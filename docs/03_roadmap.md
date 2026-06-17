# 03 — Roadmap

Version sequence for the skills / plugin / connector model, endurance scope. Each version validates **one** question. We only move to the next once the previous one is validated.

| Version | Form | Validated question |
|---|---|---|
| **V0** | Skills (git clone) | Does the plan-first method produce a coherent vision + plan, better than the reactive approach? |
| **V1** | Plugin (1-command install) | Frictionless adoption, including a UI-friendly one? |
| **V2** | Strava integration (official MCP) | Does real data close the loop? |
| **V3** | Garmin + rich UI + watch export | Does the before/during/after loop hold end to end? |
| **V4** | Community + multi-sport endurance | Can others contribute and extend autonomously? |

---

## V0 — Skills *(PoC, in progress)*

**Form**: a repo you `git clone`, read by Claude Code. No runtime.
**Scope**: cycling only, sample profile. The 3 modes via the `pace` master. Memory = versioned files.

> Since v1.0.0 the skill set is the **7-skill master+menu tree** (ADR `06_architecture_pivot.md`): master `pace` + the voiced agents `pace-discovery` / `pace-planner` / `pace-coach` / `pace-analyst` + the shared tools `pace-elicitation` / `pace-validate`; former workflows are now **capability files** of their owning agent. The historical milestone notes below are kept for the record, with names mapped to the new tree.

**Skills delivered** (see `05_skill_map.md`, minimal V0 scope): `pace` (master) · `pace-elicitation` · `pace-validate` · `pace-discovery` (+ the `vision-write` capability) · `pace-planner` (+ `plan-write`) · `pace-coach` (+ `checkin` + `adjust`) · `pace-analyst` (minimal declarative version: writes a `learned_behavior` to `profile.json` — required by scenario 02). Plus the structured files (`periodization-rules.csv`, `adjustment-decisions.csv`, `signals.csv`, checklists) and the cycling KB.

**Out of scope** (deferred, not abandoned): packaged plugin + the connector layer -> **V1**; external **measured** data and the **measured** debrief (planned/actual on data) -> **V2**; auto rolling -> the `rolling` capability in **V1**; Python -> never.

**Known V0 limitation**: without the `rolling` capability (V1), the near window (~2 wks of precise sessions) can run dry. In V0 we operate inside the window; when it is exhausted, the master proposes a (manual) rolling rather than letting Run improvise a session.

**Success criterion**: on the sample profile, a Discovery produces a structured vision, the Planner derives a coherent periodized plan from it (phase respected via `periodization-rules.csv`), and a Run check-in explains the session **without regenerating it**, modulating it via `adjustment-decisions.csv`. Visibly superior to a reactive chat on plan coherence.

---

## V1 — Plugin

**Form**: V0 skills packaged as a plugin (1 command), working in Claude Code **and** Claude Desktop.

**Additions**: `plugin.json` + `marketplace.json`; slash commands; the `rolling` capability, per-agent `customize.toml` (merge spec `docs/07_customize_merge.md`); extension contracts (`_schema.md`); the **connector capability layer** (`extensions/connectors/` — `read` / `storage` / `calendar` classes + instances: storage on local / GitHub / Notion / Drive, calendar on `plan/calendar.csv` / Google / Notion, and the Strava **Phase-1 qualitative** read), all capability-detected and degrading gracefully to local; non-dev install guide. (`pace-analyst` already exists in minimal V0; its **measured** version arrives in V2.)

**v0.4.0 (within V1)** — credibility + first impression: the **derived zones artefact** `athlete/zones.json` (concrete watts/bpm/pace bounds, so the Run coach holds the athlete to real numbers) + the **Discovery intake** that seeds the fitness markers / level / equipment into `profile.json`; a **zero-state onboarding wizard** and a **single language source** (`pace.config.toml`); a **curated 5-command surface** (`/pace`, `/pace-discovery`, `/pace-plan`, `/pace-today`, `/pace-debrief`) over the internal skills (hidden from `/` via `user-invocable: false`).

**Criterion**: on a clean machine, one-command install -> working Discovery + plan + run, terminal and desktop.

---

## V2 — Strava integration *(via Strava's official MCP)*

Since June 2026, Strava ships an **official remote MCP** (read-only, OAuth, subscribers-only) — so there is **nothing to build or host**. PACE consumes it as a read-only signal provider, via the agents' capabilities (never a new extension axis, never from the `pace` master directly). The **connector layer and the Strava Phase-1 *qualitative* read shipped in V1**; V2 is the **measured Phase-2 loop** (planned-vs-actual on real data), gated behind a Phase-0 spike of the live MCP fields.

**Additions**: capability detection + **manual-entry fallback** (PACE works without Strava); `pace-analyst` wired to real data (planned-vs-actual at the **summary** level — avg power vs target zone, duration, time-in-zone — never per-second); a `strava_baseline` in `profile.json` (sole writer: the Analyst); Strava signals routed to the **right tables** (today's modulation -> `adjustment-decisions.csv`; multi-week trend -> `signals.csv`; post-session execution -> `pace-analyst`); the `rolling` capability calibrated on real recent load. Note: community self-hosting is **no longer free** (paid API + anti-intermediary restrictions) -> non-subscribers fall back to manual entry.

**Criterion**: detection of a systematic planned/actual deviation and adjustment of the recommendations. Strava's official MCP removes the connector's install friction — no infra to build.

---

## V3 — Garmin, rich UI, watch export

**Additions**: Garmin connector (HRV, power, sleep); `.fit`/`.zwo` export; interactive UI in the chat; long-term plan revision with validation.

**Criterion**: an athlete requests their session and finds it on their watch, without a terminal.

---

## V4 — Community & multi-sport *(modularity test)*

**Additions**: expansion-pack marketplace; **running** first (a new sport pack conforming to `_schema.md`); first domain packs (nutrition, recovery); first contributors.

**Criterion**: a coach contributes a method (Markdown/CSV) and a developer a sport or a domain, **without modifying the trunk**. Modularity is proven in practice — a new sport adds no agent, a domain attaches in parallel.

*Last updated: June 2026*
