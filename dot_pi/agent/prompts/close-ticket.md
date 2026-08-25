---
description: Validate and document an implemented ticket, then close it via ralph loop.
argument-hint: "<effort> <ticket>"
---

> **Run:** one `ralph-runner` loop around this prompt, shown as the wrapping subgraph. Walk the diagram in node order, one step per node: `[[ ]]` — dispatch a `ralph-runner` subagent (foreground); `[ ]` — run inline; `{ }` — branch on the `yes`/`no` edge; `([ ])` — report back to the user. Nested loops are always subagents, never inline.

```mermaid
flowchart TD
    subgraph CT0["one ralph-runner loop: /close-ticket"]
        CT1[["1. Dispatch ralph-runner: `code-reviewer` then `reviewer`"]] --> CT2[["2. Dispatch ralph-runner: `doc-updater` then `reviewer`"]]
        CT2 --> CT3[["3. Dispatch ralph-runner: `ticket-closer` then `reviewer`"]]
        CT3 --> CT4(["4. Report back status to the user"])
    end
```
