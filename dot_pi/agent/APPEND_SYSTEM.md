# Tool routing

## Subagents — delegate, don't cloud

Run bounded tasks via `Agent({ subagent_type, prompt, description, run_in_background })`, not in-context:

- **Foreground** (`run_in_background` omitted/false): blocks, returns the result inline.
- **Background** (`run_in_background: true`): returns an id, notifies on completion; collect via `get_subagent_result` or the group-join notification.

Agent types (defined in `~/.pi/agent/agents/*.md`):

- `researcher` — background; investigates against primary sources, writes a findings file. (wayfinder research tickets)
- `validate` — foreground, inherits context; compares artifacts vs criteria, returns a verdict table.
- `explore` — foreground; fast read-only code search — find files by pattern, grep symbols, answer "where is X defined".
- `general` — foreground; the fallback subtype. Multi-step tasks and searches where the first few tries may miss.
- `vision` — foreground leaf; reads images, returns one JSON object.

Skill wording → call:

- "background agent" → `Agent({ run_in_background: true })`, then `get_subagent_result`.
- "parallel sub-agents" → two or more background `Agent` calls, then join results.
- "sub-agent" (blocking) → a foreground `Agent` call.
