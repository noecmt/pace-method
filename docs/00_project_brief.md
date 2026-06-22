# 00 — Project Brief

## TL;DR

PACE is an **open-source method for AI-driven endurance coaching**, distributed as a set of *skills* (then a *plugin*) for agentic hosts. It enforces a **plan-first** logic: understand the athlete, build a coherent plan, then adjust execution day by day. A master concierge (`pace`) routes to a small menu of specialized voiced agents. It rides the Claude / MCP ecosystem rather than reimplementing a proprietary engine.

---

## Problem

Two worlds, a gap in the middle.

**Commercial apps** are proprietary black boxes: generated plans, no openness, no inspectable method, no enrichment by the user.

**Reactive DIY setups** — plugging Strava/Garmin into an LLM via MCP — fetch recent data and recommend a session on demand. Useful, almost frictionless, but structurally unable to plan: no vision, no plan, no periodization. Everyone reinvents their own plumbing in their corner, with no shared method.

**The gap: there is no open, structured, plan-first *method* for AI sports coaching — the equivalent of what BMAD brought to software development.**

---

## Scope: endurance sports

PACE's trunk holds because cycling / running / triathlon / swimming share the same model: a threshold metric, intensity zones, load-based periodization. Team sports or pure strength break that model. PACE therefore targets **endurance**, with an architecture that *does not forbid* other sports but does not claim to solve them. Aiming at "all sports" would produce an abstraction so generic it would help no one.

---

## Product vision: the plan-first chain

1. **Discovery** — an in-depth conversation led by a dedicated persona. Produces a **vision file** (Markdown), the source of truth.
2. **Plan** — from the vision, a hierarchical plan: season blocks, typical weeks, precise sessions over the near window.
3. **Rolling** — each week the window moves forward; the near term is detailed, the mid term approximate, the blocks stable.
4. **Daily adjustment** — today's session already exists in the plan. The system reads it, explains it, modulates it based on the day's state.
5. **Closed loop** — real data informs adjustments and, when needed, triggers a new Discovery.

### Why it wins against the reactive approach

Someone who clones PACE gets a **structured periodized plan** — a coherent artefact that knows where it stands in the season. A reactive chat cannot produce that. That is the only ground where PACE is *structurally* better, and that is where the fight is — not on convenience.

---

## Positioning: "the BMAD of coaching"

BMAD won as a **minimal open-source methodology**, adoptable with Markdown and a few conventions, tool-agnostic, with agent-personas, an orchestrator, and artefact-based handoffs. PACE applies the same recipe to endurance.

| | Commercial apps | Reactive DIY setups | **PACE-method** |
|---|---|---|---|
| Open-source | ❌ | ✅ (cobbled together) | ✅ |
| Inspectable / forkable method | ❌ | ❌ | ✅ |
| Plan-first (vs reactive) | Partial | ❌ | ✅ |
| Structured artefacts (vision, plan) | ❌ | ❌ | ✅ |
| Enrichable by a non-dev coach | ❌ | ❌ | ✅ (Markdown/CSV) |
| Rides the existing ecosystem (MCP) | ❌ | ✅ | ✅ |

---

## Distribution

The method (skills) and its plugin packaging are **open-source and free**. The method content is host-agnostic (`SKILL.md` is an open cross-agent standard); each host needs only a thin adapter, never a content fork. The roadmap extends from CLI/IDE hosts (V1, shipped) to multi-host distribution — IDE-filesystem hosts (Cursor, VS Code/Copilot, Codex) and web hosts via the storage connector — and a hosted chat UI (pace-chat) for non-technical athletes (V2). Real training data via Strava's official MCP arrives in V3. See the full sequence in `03_roadmap.md`.

---

## Who it's for

- **Endurance athletes** who want a structured, inspectable plan rather than a black box.
- **Coaches** who enrich the knowledge (Markdown/CSV) without coding.
- **Developers** who extend the method (personas, sport/domain/method packs).

---

## Founding principles

- **Plan-first** — the plan always precedes the session; the day's state modulates, it does not dictate.
- **Method before engine** — the product is the method + the artefacts, not a runtime.
- **Strict separation** — each persona has a unique role and voice; none generates what another owns.
- **Three distinct extension axes** — sport (knowledge), domain (parallel advisor), method (planning strategy). Never conflate them.
- **Open and forkable** — Markdown for reasoning, CSV/JSON/YAML for the enumerable and the validatable.
- **Ride the ecosystem** — rely on the agentic host and MCP rather than reinventing.
- **Portable by design** — Claude-native as the early bet, not as a permanent lock-in.

---

## Status

**V1 shipped (v1.0.1).** The method is packaged as a plugin: master + menu architecture (7 skills), schema-frozen artefacts, running sport pack, polarized method pack, override stack. V2 next: multi-host distribution (IDE adapters + web via storage connector + pace-chat). Open-source; validate before building.

*Last updated: June 2026*
