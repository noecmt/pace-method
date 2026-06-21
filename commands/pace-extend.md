---
description: Extend the METHOD itself — track a new metric, add a sport, or adopt a training method.
argument-hint: [what to add — a metric / a sport / a method — optional]
---

Load the **pace-extend** skill directly and hand it the conversation. Unlike the coaching commands, this does **not** go through the `pace` master — `pace-extend` is the standalone, user-facing configurator for extending the method, not a Discovery/Build/Run route.

Athlete message: $ARGUMENTS

`pace-extend` first confirms you are extending the **method**, not logging a result or rethinking a goal (those are `/pace-debrief` and `/pace-discovery`). It then runs one of three modes — a **custom metric** (a scalar like HRV/sleep declared in `pace.config.toml`), a **sport pack**, or a **method pack** — writing only into your own repo (the plugin install is read-only; a local pack overrides a base pack of the same id). Sport/method packs are gated through `pace-validate` against their frozen `_schema.md`, and you activate the result declaratively.
