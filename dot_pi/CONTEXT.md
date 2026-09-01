# Agent tooling

## Language

### Delegation

**Delegation**:
The orchestrator handing a bounded task to a subagent instead of doing it in-context, to keep the main context clean.
_Avoid_: handoff

**Subagent**:
A pi session the orchestrator spawns to run a bounded task in isolation — its own tools, model, and system prompt — returning a result. Spawned with pi-subagents' `Agent` tool.
_Avoid_: sub-agent, worker, background agent, child session

**Orchestrator**:
The main pi session that detects when to delegate and spawns subagents, then consumes their results.
_Avoid_: main agent, parent, host

**Leaf agent**:
A subagent that must not spawn further subagents (no `allowed_subagents`). The `vision` subagent is a leaf.
_Avoid_: terminal agent, sink agent

**Bubble up**:
How a subagent surfaces a point the orchestrator or user must decide — an open question, a confirmation, an undecided seam — by ending its result with a `## Questions for the user` section. Bubbled-up questions are delivered artifacts, not open gaps: they don't block the subagent's completion, and the orchestrator relays them onward rather than answering or dropping them. They are ephemeral: they live only in the returned result — never written to a spec, task file, ticket, or map.
_Avoid_: escalate, report back, ask the user

### Agent files

**Agent file**:
A subagent definition under `dot_pi/agent/agents/*.md` — frontmatter (tools, model, `prompt_mode`), then a body whose every step ends on a `Done when` criterion. Loaded by type, spawned via the `Agent` tool.
_Avoid_: agent, subagent def, tool file

### Prompts

**Prompt template**:
A dotfile that expands a slash-invoked prompt in pi — a reusable Markdown snippet typed as `/name`. Replaces opencode's "command" concept.
_Avoid_: command, slash command, custom command

### Seeds

**Seed**:
A self-contained file — reads cold, no upward references, cited by runtime path — staged under `dot_pi/agent/seed/` and materialized by chezmoi apply to `~/.pi/agent/seed/`. Borrowed from [mattpocock/skills](https://github.com/mattpocock/skills), whose installer copies editable, self-contained bundles into target repos.
_Avoid_: template, staging, boilerplate

### Packages

**Pi Package**:
A pi package — a distributable bundle of extension, skill, prompt template, or theme, declared in the pi app config and materialized by pi into runtime state on startup. Distinct from a Tool (installed by a toolchain manager) and an External source (pulled into Source state by Apply).
_Avoid_: plugin, add-on
