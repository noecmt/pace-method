# tools/

Dev tooling for the PACE-method **contracts**. Not part of the method (which has no runtime) — these are checks contributors run locally and a CI can run later.

## `lint-contracts.mjs`

Level-1 coherence checks (see `docs/04_evaluation.md`): CSV decision tables well-formed, sample profile + sport pack valid, and cross-integrity between them. Zero dependency, Node built-ins only.

```sh
node tools/lint-contracts.mjs
```

- **Exit 0** — no errors (warnings are allowed and printed).
- **Exit 1** — at least one error (a broken contract); blocks before running scenarios.
- Symbols: `✓` pass · `✗` error · `⚠` warning · `⊘` skipped (deferred/optional file absent, e.g. `knowledge_base/sports/cycling.json` while the KB is not yet published).

Run it before committing a change to any `scenarios/*.md`, CSV table, `athlete/sample.json`, or sport pack.
