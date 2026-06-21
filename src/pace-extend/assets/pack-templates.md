# Pack templates — pointers (do not duplicate)

The sport- and method-pack templates are **owned by `knowledge_base/`**, not copied here — the override stack means a new pack is created by copying the canonical template into the **athlete repo**, so the single source of truth must stay in `knowledge_base/`. The `extend-sport` / `extend-method` capabilities copy these:

- **Sport pack** — copy [`knowledge_base/sports/_template.json`](../../../knowledge_base/sports/_template.json) to `<athlete-repo>/knowledge_base/sports/<sport_id>.json`. Contract: `knowledge_base/sports/_schema.md`. Worked example: `knowledge_base/sports/cycling.json`.
- **Method pack** — copy the folder [`knowledge_base/methods/_template/`](../../../knowledge_base/methods/_template/) (`pack.toml`, `METHOD.md`, `session_structures.csv`) to `<athlete-repo>/knowledge_base/methods/<method_id>/`. Contract: `extensions/methods/_schema.md`. Worked example: `knowledge_base/methods/polarized/`.

A pack authored in the athlete repo **overrides** a base pack of the same `id` (same relative path, local wins). Both sides obey the same `_schema.md`; `pace-validate` gates the result either way.

The only template this skill owns is [`custom-metrics-snippet.toml`](custom-metrics-snippet.toml) — the `[custom_metrics.<key>]` shape for `extend-custom` (custom metrics live in `pace.config.toml`, which has no `knowledge_base/` template).
