---
description: Validate and document an implemented effort, then close it via ralph loop.
argument-hint: "<effort>"
---

> **Run:** one `ralph-runner` loop around this prompt, shown as the wrapping subgraph. Walk the diagram in node order, one step per node: `[[ ]]` — dispatch a `ralph-runner` subagent (foreground); `[ ]` — run inline; `{ }` — branch on the `yes`/`no` edge; `([ ])` — report back to the user. Nested loops are always subagents, never inline.

```mermaid
flowchart TD
    subgraph CE0["one ralph-runner loop: /close-effort"]
        CE1[["1. Dispatch ralph-runner: `code-reviewer` then `reviewer`"]] --> CE2[["2. Dispatch ralph-runner: `doc-updater` then `reviewer`"]]
        CE2 --> CE3[["3. Dispatch ralph-runner: `effort-closer` then `reviewer`"]]
        CE3 --> CE4(["4. Report back status to the user"])
    end
```
