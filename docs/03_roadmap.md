# 03 — Roadmap

Version sequence for the skills / plugin / connector model, endurance scope. Each version validates **one** question. We only move to the next once the previous one is validated.

| Version | Form | Validated question |
|---|---|---|
| **V0** | Skills (git clone) | Does the plan-first method produce a coherent vision + plan, better than the reactive approach? ✓ |
| **V1** | Plugin (1-command install) | Frictionless adoption, including a UI-friendly one? ✓ |
| **V2** | Multi-host distribution | Can the method reach non-CLI users without forking the content? |
| **V3** | Strava measured loop | Does real data detect planned/actual drift and tighten recommendations? |
| **V4** | Garmin + rich UI + watch export | Does the before/during/after loop hold end to end without a terminal? |
| **V5** | Community & multi-sport | Can others contribute and extend autonomously? |

---

## V0 — Skills *(shipped)*

**Form**: a repo you `git clone`, read by Claude Code. No runtime. Scope: cycling only, sample profile. The 3 modes via the `pace` master. Memory = versioned files.

**What shipped**: the initial 13-skill chain; the structured guardrails (`periodization-rules.csv`, `adjustment-decisions.csv`, `signals.csv`, `methods.csv`); the cycling KB. Six validation scenarios passing: overload constraints, memory persistence, profile contradiction, taper override, degraded input, routing.

**Validated**: on the sample profile, a Discovery produces a structured vision, the Planner derives a coherent periodized plan (phase respected via `periodization-rules.csv`), and a Run check-in explains the session without regenerating it, modulating it via `adjustment-decisions.csv`. Visibly superior to a reactive chat on plan coherence.

---

## V1 — Plugin *(shipped — v1.0.0 + v1.0.1)*

**Form**: V0 repackaged as a plugin (1 command), working in Claude Code and Claude Desktop.

**v1.0.0** — Architecture pivot (ADR `06_architecture_pivot.md`): 13 skills → 7 (master concierge + 4 voiced agents + 2 shared tools); former workflow skills absorbed as local capability files (`references/*.md`); `customize.toml` per-agent resolved by the LLM, no Python runtime; schema freeze (`extensions/_artefact_schema.md`): week/session lifecycle, discipline-keyed fitness and zones, metric-agnostic `target`; silent pipeline (one skill boundary per flow: master → agent); curated 5-command surface (`/pace`, `/pace-discovery`, `/pace-plan`, `/pace-today`, `/pace-debrief`); derived `zones.json`; Discovery intake seeding `profile.json`; `pace.config.toml` as athlete-instance config.

**v1.0.1** — Method packs and override stack: local athlete-side packs win over plugin defaults (`knowledge_base/` resolved local-first); **running sport pack** (conforming to `_schema.md` — first proof of the "sport = knowledge only, no new agent" axiom); curated polarized method pack shipped with the plugin.

**Validated**: one-command install on a clean machine → working Discovery + plan + run, terminal and desktop. The running pack proves the three extension axes hold in practice.

**Known V1 limitations**: connector layer (storage / calendar) designed but not wired; no measured Strava data; method reaches technical users only (CLI / IDE required).

---

## V2 — Multi-host distribution *(next)*

`SKILL.md` is an open cross-agent standard. The method content is already portable — each host needs only a thin adapter/manifest, never a content fork. Single source = `src/*/SKILL.md`; adapters generated, never hand-maintained.

**Two host families, two levers**:

- **IDE-filesystem hosts (Cursor, VS Code / Copilot, Codex)**: they read/write local files — the "git is the database" invariant holds natively. Work = one thin adapter per host pointing at `src/` (Cursor rules, Copilot custom instructions, etc.). Low risk, immediate gain from the early technical audience already in an agentic IDE.
- **Web hosts (claude.ai, ChatGPT / Custom GPT)**: cannot write to a local repo. The unlock is the **storage connector already designed** (`extensions/connectors/storage.md`): artefacts live in a remote backend (GitHub / Notion / Drive). "Reach the web" ≈ wire the storage connector + a project that embeds the method and reads/writes via that backend. Also unlocks non-technical users.

**Additions**: `extensions/hosts/` (one subfolder per host = manifest + install guide); an adapter generator from `src/`; a compat matrix in the README (where PACE runs, with which storage backend); storage connector wired end to end; **pace-chat** (hosted chat UI for non-technical athletes: Claude Agent SDK backend, Supabase storage, Strava OAuth, calendar widget — PACE skills run unchanged; design: `docs/internal/chat-ui-architecture.md`).

**Validated question**: Can the method reach non-CLI users without forking the content? Proven when a non-technical athlete completes a full Discovery + plan + check-in via a web interface or non-CLI IDE, using the same `src/` skill content as a terminal user.

---

## V3 — Strava measured loop *(was V2)*

Since June 2026, Strava ships an **official remote MCP** (read-only, OAuth, subscribers-only) — nothing to build or host. PACE consumes it as a read-only signal provider via agents' capabilities. The connector layer and the Strava Phase-1 qualitative read are designed; V3 delivers the **measured Phase-2 loop** (planned-vs-actual on real data), gated behind a Phase-0 spike on the live MCP fields.

**Sprint phases** (internal ordering):

- **Phase 0 (gate)**: spike on the real MCP — enumerate tools, response shapes, whether time-in-zone is exposed, field stability. No CSV/JSON contract is frozen before this spike.
- **Phase 1**: capability detection + graceful fallback to manual entry; agents read activity summaries for qualitative context only — no schema change, no signal calibration.
- **Phase 2 (measured loop)**: `pace-analyst` wired to real data — planned-vs-actual at summary level (avg power vs target zone, duration, time-in-zone — never per-second); `strava_baseline` in `profile.json` (sole writer: the Analyst); signals routed to the right tables (today's modulation → `adjustment-decisions.csv`; multi-week trend → `signals.csv`; post-session execution → `learned_behavior`); `rolling` capability calibrated on real recent load. Non-subscribers fall back to manual entry.
- **Phase 3 (evaluation)**: scenario 07 (measured debrief on anonymised fixture); checks: log reflects summary KPIs, `strava_baseline` updated, no invented session.

**No-runtime constraint**: prefer pre-computed Strava fields (avg power, FC, fitness trend, readiness) over raw per-second streams; never dump streams into the context.

**Validated question**: Detection of a systematic planned/actual deviation and automatic tightening of recommendations.

---

## V4 — Garmin + rich UI + watch export

**Additions**: Garmin connector (HRV, power, sleep); `.fit` / `.zwo` export; interactive UI in the chat; long-term plan revision with validation.

**Validated question**: An athlete requests their session and finds it on their watch, without a terminal.

---

## V5 — Community & multi-sport *(modularity at scale)*

Running shipped in V1. V5 is the scale test: open contributions and additional sports.

**Additions**: expansion-pack marketplace; **triathlon** (multi-discipline, multi-zone sessions) and **swimming** as next sport packs; first domain packs (nutrition, recovery); first external contributors.

**Validated question**: A coach contributes a method (Markdown/CSV) and a developer a sport or a domain, without modifying the trunk. Modularity proven in practice — a new sport adds no agent, a domain attaches in parallel.

---

*Last updated: June 2026*
