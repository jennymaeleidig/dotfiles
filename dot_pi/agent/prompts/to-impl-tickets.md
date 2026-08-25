---
description: Break an effort spec into implementation tickets via ralph loop.
argument-hint: "<effort>"
---

> **Run:** one `ralph-runner` loop around this prompt, shown as the wrapping subgraph. Walk the diagram in node order, one step per node: `[[ ]]` — dispatch a `ralph-runner` subagent (foreground); `[ ]` — run inline; `{ }` — branch on the `yes`/`no` edge; `([ ])` — report back to the user. Nested loops are always subagents, never inline.

```mermaid
flowchart TD
    subgraph TI0["one ralph-runner loop: /to-impl-tickets"]
        TI1[["1. Dispatch ralph-runner: `ticket-creator` then `reviewer`"]] --> TI2(["2. Report back status to the user"])
    end
```

