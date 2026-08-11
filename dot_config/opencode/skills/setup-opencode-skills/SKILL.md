---
name: setup-opencode-skills
description: Install or refresh a repo's OpenCode skill set and commands — the curated engineering skills, no-ai-slop, and the validate skill + command — pulled from npx sources into `.agents/skills/` (skills) and `.opencode/commands/` (commands), per the config registry. Use when setting up a repo, adding or refreshing installed skills or commands, or when invoked by setup-opencode-repo.
---

# Setup Skills

Install the per-repo skill set and commands. Which sources, which skill names, what to exclude, and which seed files to copy are all in `config.md` — edit that file to change the set; this skill just executes it.

## Process

### 1. Read the registry

Read [config.md](./config.md): the npx sources with their skill names, the seed-local skills/commands, and the exclusions.

### 2. Install the sources

For each source in the registry, run one npx `add` (always `skills@latest`), targeting the opencode agent in project scope, copying files, no prompts:

```bash
npx --yes skills@latest add <source> --skill <names…> --agent opencode --copy -y
```

- Project scope (default) installs under `.agents/skills/` — the universal dir opencode searches; `.opencode/skills/` is not the npx target.
- `--copy` puts real files in the repo you own and can edit (not symlinks).

### 3. Copy seed-local files

Anything the registry marks seed-local (not in an npx source) is copied from this skill's `seed/` into the repo:

- `seed/skills/validate/SKILL.md` → `.agents/skills/validate/SKILL.md`
- `seed/commands/validate.md` → `.opencode/commands/validate.md`

Preserve the exactly-adjusted paths; the repo's `.opencode/commands/` dir may need creating.

### 4. Apply exclusions

For each excluded name in the registry, if a prior setup left it in the repo, remove it:

```bash
npx --yes skills@latest remove <name> --agent opencode -y
```

### 5. Verify and report

Confirm every registered skill sits at `.agents/skills/<name>/SKILL.md` and every command at `.opencode/commands/<name>.md`. Report the installed set against the registry.

Completion: every registry source's skill names installed, every seed-local file copied, no excluded skill present, verify shows the set matching `config.md`.
