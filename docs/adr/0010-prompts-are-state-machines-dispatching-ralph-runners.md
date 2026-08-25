# Slash prompts are mermaid state diagrams that dispatch ralph-runner subagents

A slash prompt (`/name` in `dot_pi/agent/prompts/`) is written as a small state machine, not a one-shot instruction. Its body is a single fenced Mermaid diagram — `flowchart TD`, drawn to the `mermaid-diagrammer` conventions — with explicit transitions, one terminal "report back to the user" state, and the whole machine enclosed in a single `subgraph` that names the prompt's one `ralph-runner` loop. `description` and `argument-hint` stay in the YAML frontmatter; the diagram is the whole machine. The only prose outside it is a fixed run preamble immediately above the diagram — boilerplate on how to execute, not steps:

> **Run:** one `ralph-runner` loop around this prompt, shown as the wrapping subgraph. Walk the diagram in node order, one step per node: `[[ ]]` — dispatch a `ralph-runner` subagent (foreground); `[ ]` — run inline; `{ }` — branch on the `yes`/`no` edge; `([ ])` — report back to the user. Nested loops are always subagents, never inline. Every diagram passes the `mermaid_lint` extension tool before it lands (the `mermaid-diagrammer` gate).

Each prompt also lives inside a larger state machine — the prompt lifecycle (wayfind → to-effort-spec → to-impl-tickets → implement → close) — where the prompt is a single state a human reaches at a set point. Inside a prompt, a state either dispatches a `ralph-runner` subagent (when it does substantive external work: read, write, branch, review) or runs inline (when it is pure orchestration: pick next ticket, branch on a result, report back). Nested loops are never run inline: the prompt's machine is run as one `ralph-runner` loop, and each substantive state is dispatched as its own `ralph-runner` subagent, foreground (blocking) in dependency order, background only for genuinely parallel fan-out.

## Node language

Four node shapes, one meaning per shape, shared with what `mermaid-diagrammer` emits:

- `id["label"]` — inline orchestration state; runs in the prompt loop.
- `id[["label"]]` — dispatch state; dispatches one `ralph-runner` subagent. The label names the subagents in order.
- `id{"label"}` — decision; its exit edges are labeled `yes` / `no`.
- `id(["label"])` — terminal "report back" state; the only exit from the machine.

Every diagram is wrapped in exactly one enclosing subgraph, `subgraph P["one ralph-runner loop: /name"]`, that names the prompt's single `ralph-runner` loop; all states sit inside it. Additional `subgraph`s are allowed only when they clarify structure. Step numbers prefix labels (`1.`, `2.`, …); labels with spaces or special characters are quoted; ASCII only.

## Execution

When an agent is handed a prompt, it runs the diagram, following the run preamble above it:

1. **One prompt = one ralph loop.** The enclosing subgraph is that loop; run everything inside it in a single `ralph-runner` loop so the run is verifiable and resumable. The user invokes the prompt at a single point of the prompt lifecycle; execute only this prompt's internal machine, not the lifecycle.
2. **Walk the states in arrow order.** Each node is one step, executed one at a time.
3. **Dispatch the work states.** On a `[[ ]]` node, delegate that step to a `ralph-runner` subagent (foreground, blocking) — the label names the subagents. Never run a work state inline in the orchestrator.
4. **Inline the orchestration states.** On a `[ ]` node — pick next ticket, compose a child prompt, branch — run it directly in the loop.
5. **Branch on decisions.** On a `{ }` node, take the labeled edge (`yes` / `no`).
6. **Always reach the terminal.** The `([ ])` report-back state is the only exit; every run ends by reporting status to the user.

Nested loops are always subagents: a ralph loop inside a ralph loop is a delegated `ralph-runner`, never inline. All substantive work is delegated this way.

Established practice already followed the machine shape, now as diagrams: `close-effort`/`close-ticket`/`implement-ticket`/`to-*`/`log-journey` are linear chains of dispatch states ending in one report state; `implement-effort` is a composed machine that cycles tickets through `implement-ticket` and `close-ticket` (a decision loops back to the frontier), then closes the effort. This ADR codifies that shape so future prompts are written the same way instead of as free-form one-shots.

`AGENTS.md` points at this ADR for anyone editing a prompt.

Considered options: prompts as free-form instructions (rejected — no verifiability or resumability, and no consistent delegation, so a half-run prompt leaves nothing checkable); prompts as prose numbered steps with the diagram only implied (replaced by this ADR — two sources of truth, so prose and transitions drift); dispatching nested loops inline (rejected — nested loops run in the parent context, clouding it and defeating the isolation `ralph-runner` exists for; the `subagents` skill requires delegation). Consequences: every prompt must end on a report state or it hands the human nothing; a work state that forgets to dispatch runs heavy work in the prompt-loop; modifying an existing prompt must preserve the diagram and node-shape language or it stops reading as a machine.
