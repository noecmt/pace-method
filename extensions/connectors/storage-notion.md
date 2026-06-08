# Notion — storage backend (instance)

`connector_id: notion` · `class: storage` · `degraded_fallback: local` · conforms to [`_schema.md`](_schema.md).

Artefacts live as **Notion pages** under one root page. Most accessible for non-dev athletes (mobile, no Git). Trade-off: the audit trail is Notion's page history, not git diffs.

## capability_probe (plain language)

Notion MCP tools are available (`notion-search`, `notion-fetch`, `notion-create-pages`, `notion-update-page`, `notion-create-database`). **Absent** -> degrade to `local`.
> Status (spike 2026-06-07): the Notion MCP toolset is **fully available** in this session once the workspace is connected.

## Artefact mapping

A root page **"PACE — <athlete>"** with children:
- `vision/vision.md` -> a **Vision** page (Notion-flavored markdown via `notion-create-pages` / `notion-update-page`).
- `plan/plan.md` -> a **Plan** page (the change log lives as a section inside the page).
- `log/` -> child pages per entry, **or** a **Log** database (`notion-create-database`): one row per check-in / adjust / debrief.
- `athlete/profile.json`, `athlete/zones.json` -> stored **verbatim in a fenced code block** on a dedicated **Profile** / **Zones** page. Keep them as exact JSON — do **not** scatter them into Notion properties — so the JSON contract stays parseable.

## Read / write tools

- Read: `notion-fetch` (by id/url) or `notion-search`.
- Create: `notion-create-pages` / `notion-create-database`.
- Amend: `notion-update-page` with `insert_content` / `update_content` (targeted). Use `replace_content` only with care — it warns before deleting child pages.

## amend-not-rewrite + visible diff

Use targeted `update_content` (not wholesale replace); keep the change-log section inside the page. The "diff" is **Notion's page history** (weaker than git, but versioned). The vision/profile contracts (amend-not-rewrite, sole-writer) still hold.

## hard_rules

- JSON artefacts stay **exact** (code block), never exploded into properties.
- Sole-writer rules unchanged; one Notion root per athlete.
- Never rewrite a page wholesale when a targeted amend suffices.
