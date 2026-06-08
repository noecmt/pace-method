# GitHub — storage backend (instance)

`connector_id: github` · `class: storage` · `degraded_fallback: local` · conforms to [`_schema.md`](_schema.md).

Artefacts live in a **GitHub repo** (the athlete's own). This is the **preferred web backend** because it keeps PACE's *git-as-database* ideal: every artefact change is a **commit** = a real diff and an audit trail.

## capability_probe (plain language)

A GitHub capability is available: a **GitHub MCP tool** (web/Cowork), or the **`gh` CLI** / local git (Claude Code on a cloned repo). **Absent** -> degrade to `local`.
> Status (spike 2026-06-07): no GitHub MCP is exposed in this session. On Claude Code, local git + `gh` cover it; on the **web** surface a GitHub MCP must be connected. Confirm the exact MCP tool names on first connect.

## Setup (athlete onboarding)

The athlete **forks the `pace-athlete-template` repo** (an empty artefact skeleton: `vision/`, `plan/`, `athlete/`, `log/`) and connects it. `pace-customize` records `[connectors].storage = "github"` + the repo identity.

## Artefact mapping

Logical path = path **in the repo**.
- **Read** a logical artefact -> read that file from the repo (MCP get-contents / `gh api` / git).
- **Write/amend** -> create-or-update the file **as a commit**; the commit message carries the change-log *reason* (date · change · reason).
- The **content and contracts are identical** to `local`: the same `vision.md`, `plan.md`, `profile.json`, `zones.json`, `log/` files.

## amend-not-rewrite + visible diff

Native: each write is a commit -> `git diff` / the PR view **is** the audit trail. The in-file change-log rows still apply (belt and suspenders).

## hard_rules

- One repo per athlete; the **sole-writer** rules are unchanged (only the Analyst commits `profile.json`).
- Commits carry the reason; **never force-push** history away.
- This is a **write** backend — never confuse it with a read connector (never write training artefacts into Strava).
