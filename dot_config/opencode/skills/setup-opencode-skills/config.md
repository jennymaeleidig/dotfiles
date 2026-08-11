# setup-opencode-skills registry

Edit this file to change what `setup-opencode-skills` installs — the skill will execute this list as-is. One-place edit when your needs change.

## npx sources

Run one `add` per source with the listed skill names:

```bash
npx --yes skills@latest add mattpocock/skills --skill ask-matt code-review codebase-design diagnosing-bugs domain-modeling grill-me grill-with-docs grilling handoff implement improve-codebase-architecture prototype research resolving-merge-conflicts setup-matt-pocock-skills tdd teach to-questionnaire to-spec to-tickets triage wait-what wayfinder wizard writing-for-agents --agent opencode --copy -y

npx --yes skills@latest add https://github.com/petergyang/no-ai-slop --skill no-ai-slop --agent opencode --copy -y
```

### mattpocock/skills — default set

`ask-matt`, `code-review`, `codebase-design`, `diagnosing-bugs`, `domain-modeling`, `grill-me`, `grill-with-docs`, `grilling`, `handoff`, `implement`, `improve-codebase-architecture`, `prototype`, `research`, `resolving-merge-conflicts`, `setup-matt-pocock-skills`, `tdd`, `teach`, `to-questionnaire`, `to-spec`, `to-tickets`, `triage`, `wait-what`, `wayfinder`, `wizard`, `writing-for-agents`

### petergyang/no-ai-slop

`no-ai-slop`

## Seed-local (not in an npx source)

Copied from this skill's `seed/` into the repo:

- skill `validate` → `.agents/skills/validate/SKILL.md`
- command `validate` → `.opencode/commands/validate.md`

## Excluded

Never installed into a repo; if a prior setup added it, `setup-opencode-skills` removes it:

- `create-obsidian-reference` (skill + command)
