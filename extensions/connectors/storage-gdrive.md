# Google Drive — storage backend (instance)

`connector_id: gdrive` · `class: storage` · `degraded_fallback: local` · conforms to [`_schema.md`](_schema.md).

Artefacts live as **raw files in a Drive folder**. Most shareable (family / coach), least structured: **no real diff**.

## capability_probe (plain language)

A Google Drive MCP tool is available **after OAuth** (`mcp__claude_ai_Google_Drive__authenticate` then `complete_authentication`). **Absent / unauthenticated** -> degrade to `local`.
> Status (spike 2026-06-07): only the **auth** tools are exposed until the user authorizes; the file tools appear post-OAuth. **Confirm the exact file-tool names on first connect** (a mini-spike, like Strava Phase 0).

## Artefact mapping

A folder **"PACE — <athlete>/"** holding the artefacts as **raw files** — `vision.md`, `plan.md`, `profile.json`, `zones.json` — plus a `log/` subfolder. Raw markdown / JSON keeps the content exact.

## amend-not-rewrite + visible diff

Drive keeps **version history** per file (no real diff). Keep the in-file change-log sections as the human-readable trail. The vision/profile contracts still hold.

## hard_rules

- **Raw files only** (exact markdown / JSON); one folder per athlete.
- Sole-writer rules unchanged.
- Weakest audit trail — **prefer `github`** when the athlete can use git.
