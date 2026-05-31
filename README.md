# PACE-method

**An open-source, plan-first coaching method for endurance sports, distributed as AI agent skills.**

![Status](https://img.shields.io/badge/status-V0%20design-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Language](https://img.shields.io/badge/language-Markdown-blue)

PACE is a **method, not an app**. No runtime, no build, no code to run. It distributes
endurance coaching as a set of Markdown **skills** for agentic hosts (Claude Code, Claude
Desktop), in the spirit of what BMAD brought to software development.

It imposes a **plan-first** logic: understand the athlete → build a coherent season plan →
modulate execution day by day. Personas never talk to each other directly; they
communicate only through versioned artefacts (`vision`, `plan`, `profile`, `log`) — git is
the database and the audit trail.

## Status — V0 (design phase)

The design is frozen and documented. The skills themselves are **not yet implemented** —
this repo currently ships the **design documentation** only. Implementation follows a
strict "contracts first" order (scenarios + decision tables before any persona).

## Read first

The design docs are the source of truth. Start here:

1. [`docs/00_project_brief.md`](docs/00_project_brief.md) — vision, problem, positioning.
2. [`docs/01_architecture.md`](docs/01_architecture.md) — the skills/plugin/connector model and the three extension axes.
3. [`docs/02_method.md`](docs/02_method.md) — the orchestrator, the three modes, personas, workflows, artefacts.
4. [`docs/03_roadmap.md`](docs/03_roadmap.md) · [`docs/04_evaluation.md`](docs/04_evaluation.md) · [`docs/05_skill_map.md`](docs/05_skill_map.md).

## Scope

Endurance sports, **cycling first** (then running / triathlon / swimming). The three modes —
Discovery → Build → Run — produce a narrative vision, a periodized plan, and a daily
execution loop that explains and modulates the planned session without ever regenerating it.

## License

MIT License. See [LICENSE](LICENSE).
