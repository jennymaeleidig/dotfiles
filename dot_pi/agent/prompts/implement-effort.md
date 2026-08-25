---
description: Implement an entire effort across its tickets via ralph loop.
argument-hint: "<effort>"
---

> **Run:** one `ralph-runner` loop around this prompt, shown as the wrapping subgraph. Walk the diagram in node order, one step per node: `[[ ]]` — dispatch a `ralph-runner` subagent (foreground); `[ ]` — run inline; `{ }` — branch on the `yes`/`no` edge; `([ ])` — report back to the user. Nested loops are always subagents, never inline.

```mermaid
flowchart TD
    subgraph IE0["one ralph-runner loop: /implement-effort"]
        IE1["1. Pick ticket from the frontier"] --> IE2[["2. /implement-ticket"]]
        IE2 --> IE3[["3. /close-ticket"]]
        IE3 --> IE4{"4. More tickets on the frontier?"}
        IE4 -- "yes" --> IE1
        IE4 -- "no" --> IE5[["5. /close-effort"]]
        IE5 --> IE6(["6. Report back status to the user"])
    end
```
