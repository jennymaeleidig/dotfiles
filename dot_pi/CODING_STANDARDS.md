# CODING STANDARDS

Standards for the pi config domain (`dot_pi/`), split from the root
`CODING_STANDARDS.md` (Machine Configuration); read the one on your topic, both
for cross-cutting work. See `docs/agents/domain.md`.

Slash prompts and workflow scripts are retired — `dot_pi/agent/prompts/` and
`dot_pi/agent/workflows/` no longer exist (ADR 0011, amended). Agent files are
what remains.

## Agent file format

`dot_pi/agent/agents/*.md`. The _why_ lives in `writing-for-agents` — read it
first; this file pins the _what_.

**Body** — each `##` section is the step's instructions followed by a
**`Done when …`** acceptance criterion on its own line — checkable and
exhaustive, so the agent knows when it is genuinely done, not merely attempted.
`doc-updater.md` is the exemplar; `general.md`, `reviewer.md`,
`mermaid-diagrammer.md` the other worked examples.

**Description** — one or two sentences, no name prefix, deliverable first then
the trigger branches (one per branch). Cut identity the body carries:

> `Mermaid diagrams — one per task, syntax verified against context7, lint-clean via mermaid_lint.`

**Frontmatter** — keep `ext:pi-fff/grep` + `ext:pi-fff/find` on every searching
agent (pi-fff **overrides** the built-ins, not duplicates); `ext:context7/*`
pairs with the `context7-docs` skill; drop `display-name` when it equals `name`;
`deepseek-v4-flash` for logic; `thinking: high` only where rushing is risky
(`mermaid-diagrammer`, `reviewer`); `prompt_mode: replace`. Transcripts stay on:
never set `output_transcript: false` — the per-agent JSONL transcript is the
forensic trail for work the inspector cannot show, and the completion
notification prints its path.

**Leaves** — agent files carry no `allowed_subagents`: fan-out belongs to the
caller that dispatches them, not to the agent file. The `subagents` skill is
dropped from frontmatter wherever nothing spawns anymore; every other skill and
extension persists.

## Shared gotchas

- YAML keys are snake_case — `prompt_mode`, never `promptMode`.
- Skill paths are `~/.pi/agent/skills/<name>/SKILL.md` — never `~/.agents/skills/…`.
