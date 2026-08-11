---
name: setup-opencode-repo
description: Set up this repo with a fresh, minimal OpenCode config — install the agent skill set and commands, scaffold a minimal project config, enable LSP servers (built-ins on), and enable formatters only when the project declares one. Run once when you start working in a repo.
disable-model-invocation: true
---

# Setup Repo

Give a repo the OpenCode setup you work in: skills and commands installed per-repo, a minimal `opencode.jsonc`, built-in LSPs ready for the languages actually there, and formatters only when the project already asks for them. This is a prompt-driven skill, not a script — explore, present, invoke the companion skills, confirm, then write.

What gets installed is decided two ways:

- `setup-opencode-skills`'s `config.md` — the fixed set of skill sources, names, and commands; edit it to change the set.
- At runtime — `setup-opencode-lsps` and `setup-opencode-formatters` read the codebase's languages and opencode's built-in registries, so they carry no lookup tables of their own; nothing to keep in sync.

## Process

### 1. Explore

Read the repo's current state before changing anything:

- Root layout — top-level files and dirs (language signals: `package.json`, `*.csproj`, `*.sln`, `*.sh`, `go.mod`, `Cargo.toml`, `pyproject.toml`, …)
- Existing `opencode.json` / `opencode.jsonc`, `.opencode/`, `.agents/skills/`, `skills-lock.json`
- Working-tree dirtiness (`git status`) — you'll be adding files; know what was already changed
- Whether this is `~` (home) — same treatment as any other repo

Done when you can state: the repo's languages, what opencode artifacts already exist, and what's already dirty.

### 2. Invoke `setup-opencode-skills`

Load the `setup-opencode-skills` skill and follow it. It installs the skill set into `.agents/skills/` and commands into `.opencode/commands/` per its `config.md`. Confirm the finished set with the user before moving on.

### 3. Scaffold the project config

Write `opencode.jsonc` at the repo root from the seed template at [seed/opencode.jsonc](./seed/opencode.jsonc) — schema plus `"lsp": {}`, which enables every built-in LSP server; formatters are opt-in and come in step 5 only if the project declares one. If the file already exists, leave it untouched rather than overwriting user config.

Done when the repo has a `$schema` + `"lsp": {}` `opencode.jsonc` (or you found and preserved an existing one).

### 4. Invoke `setup-opencode-lsps`

Load the `setup-opencode-lsps` skill and follow it. It enables opencode's built-in LSP servers and writes a custom entry only for a language the codebase shows that no built-in covers. Confirm the planned entries with the user before it writes.

### 5. Invoke `setup-opencode-formatters`

Load the `setup-opencode-formatters` skill and follow it. It enables opencode's built-in formatters only when the project declares one (a formatter config or dependency in the codebase), writing a custom entry only for a declared formatter no built-in covers; otherwise it leaves formatters off so the project's files aren't reformatted. Confirm the planned entries with the user before it writes.

### 6. Done

Summarise what was set up: skills installed, command(s) scaffolded, config file state. Note the restart-to-pick-up-config caveat only if the user is mid-session.
