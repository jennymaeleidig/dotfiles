---
name: subagents
description: Delegate bounded tasks to subagents rather than doing them in-context. Use before spawning a background agent, parallel sub-agents, or a blocking sub-agent — including from inside a subagent.
---

# Subagents — delegate, don't cloud

Run bounded tasks via `Agent({ subagent_type, prompt, description, run_in_background })`, not in-context. This applies at any level: a subagent may itself delegate.

- **Foreground** (`run_in_background` omitted/false): blocks, returns the result inline.
- **Background** (`run_in_background: true`): returns an id, notifies on completion; collect via `get_subagent_result` or the group-join notification.

Agent types (defined in `~/.pi/agent/agents/*.md`).

Skill wording → call:
- "background agent" → `Agent({ run_in_background: true })`, then `get_subagent_result`.
- "parallel sub-agents" → two or more background `Agent` calls, then join results.
- "sub-agent" (blocking) → a foreground `Agent` call
