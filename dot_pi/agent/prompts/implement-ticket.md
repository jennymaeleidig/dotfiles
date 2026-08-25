---
description: Implement one ticket against its acceptance criteria via ralph loop.
argument-hint: "<effort> <ticket>"
---

> **Run:** one `ralph-runner` loop around this prompt, shown as the wrapping subgraph. Walk the diagram in node order, one step per node: `[[ ]]` — dispatch a `ralph-runner` subagent (foreground); `[ ]` — run inline; `{ }` — branch on the `yes`/`no` edge; `([ ])` — report back to the user. Nested loops are always subagents, never inline.

```mermaid
flowchart TD
    subgraph IT0["one ralph-runner loop: /implement-ticket"]
        IT1[["1. Dispatch ralph-runner: `ticket-implementer` then `reviewer`"]] --> IT2(["2. Report back status to the user"])
    end
```
