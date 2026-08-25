## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Prompt authoring

When authoring or editing a slash prompt in `dot_pi/agent/prompts/`, follow `docs/adr/0010-prompts-are-state-machines-dispatching-ralph-runners.md`: each prompt body is one Mermaid `flowchart TD` state diagram, nested in the effort lifecycle, dispatching substantive states to `ralph-runner` subagents.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.