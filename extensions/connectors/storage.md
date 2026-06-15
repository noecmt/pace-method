# Storage — artefact backend connectors (instances)

`class: storage` · `writes: {vision, plan, profile, zones, log}` · `degraded_fallback: local` · conforms to [`_schema.md`](_schema.md).

Where the athlete artefacts physically live. Skills always refer to **logical artefact paths** (`vision/vision.md`, `plan/plan.md`, `athlete/profile.json`, `athlete/zones.json`, `log/`); the **storage layer** maps those to a backend. Default = **local filesystem**. **No runtime** — the mapping is an instruction the agent follows with its file / MCP tools.

## Instances

| `connector_id` | Backend | capability_probe | When |
|---|---|---|---|
| `local` | local filesystem (Claude Code CWD = athlete folder) | always available in Claude Code (CLI) | **default** |
| `github` | a GitHub repo via the GitHub MCP | a GitHub MCP tool is available | web/Cowork (no filesystem) — **preserves git-as-database** |
| `notion` | Notion pages / database via the Notion MCP | a Notion MCP tool is available | later (non-dev audience) |
| `gdrive` | files in Google Drive via its MCP | a Drive MCP tool is available | later |

## Resolution rule (no runtime)

1. Read the configured backend from `pace.config.toml` (`[connectors].storage`, default `local`).
2. **Probe** its capability. **Present** -> read/write artefacts there. **Absent** -> **degrade to `local`** (and say so); if there is no filesystem either (web with nothing configured), **tell the athlete to connect a backend** rather than silently losing data.
3. Map every **logical artefact path** to the backend (a file in the repo via GitHub MCP; a page in Notion; a local file). The **content and contracts are identical** across backends.

## hard_rules

- The backend changes **where**, never **what**: the **sole-writer** rules, **amend-not-rewrite**, and **visible-diff** semantics still hold (git/GitHub = diffs; Notion/Drive = their version history).
- **One backend at a time** for a given athlete — no split-brain across backends.
- **Never** write training artefacts into a **read** connector (e.g. never write to Strava).
- PACE works on **`local`** with zero connectors configured.

## Per-backend specifics

`local` is the trivial default (the agent's own file tools on the athlete folder — nothing to specify). Each **external** backend has its own instance file with the concrete artefact mapping + tools (mirroring `strava.md` on the read side):

- [`storage-github.md`](storage-github.md) — repo via GitHub MCP / `gh` (**preferred web** backend; git-as-database).
- [`storage-notion.md`](storage-notion.md) — Notion pages / database (**most accessible**, non-dev).
- [`storage-gdrive.md`](storage-gdrive.md) — raw files in Drive (**most shareable**; no real diff).
