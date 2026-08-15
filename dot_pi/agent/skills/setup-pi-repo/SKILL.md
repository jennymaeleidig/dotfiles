---
name: setup-pi-repo
description: Set up a repo for pi in one step — install the engineering skill set into `.agents/skills`, scaffold a minimal `.pi/settings.json` marker, and rely on pi-lens defaults for language tooling. Run once when you start working in a repo. Replaces the opencode setup quartet.
disable-model-invocation: true
---

# Setup Repo for Pi

Give a repo the pi setup in one step: the engineering skill set installed per-repo, a minimal `.pi/settings.json` project marker, and no per-language LSP or formatter config — pi-lens handles language tooling from its defaults (on by default, auto-detecting). This is a prompt-driven skill, not a script — explore, present, confirm, then write.

This skill collapses the opencode setup quartet (`setup-opencode-{repo,skills,lsps,formatters}`) into one: there is no LSP step and no formatter step, because pi-lens is on by default and detects languages itself. There is no per-language registry to keep in sync.

What gets installed is decided one way:

- `config.md` — the fixed set of skill sources, names, and seed-local files; edit it to change the set.

## Process

### 1. Explore

Read the repo's current state before changing anything:

- Root layout — top-level files and dirs (language signals: `package.json`, `*.csproj`, `*.sln`, `*.sh`, `go.mod`, `Cargo.toml`, `pyproject.toml`, …)
- Existing `.pi/settings.json`, `.pi/`, `.agents/skills/`, `skills-lock.json`
- Working-tree dirtiness (`git status`) — you'll be adding files; know what was already changed
- Whether this is `~` (home) — same treatment as any other repo

Done when you can state: the repo's languages, what pi artifacts already exist, and what's already dirty.

### 2. Install the skill set

Read [config.md](./config.md) and follow it. It installs the engineering skill set into `.agents/skills/` per the registry, copying seed-local files into place, and removing excluded skills if a prior setup left them. Confirm the finished set with the user before moving on.

### 3. Scaffold the project settings marker

Write `.pi/settings.json` at the repo root from the seed template at [seed/settings.json](./seed/settings.json) — an empty object that marks the repo as a pi project. If the file already exists, leave it untouched rather than overwriting user config.

Done when the repo has a minimal `.pi/settings.json` (or you found and preserved an existing one).

### 4. Language tooling — nothing to do

Do not enable per-language LSP servers or formatters. pi-lens is on by default and auto-detects languages from the codebase; there is nothing to configure and no registry to keep in sync. Say so rather than skipping silently.

### 5. Done

Summarise what was set up: skills installed, `.pi/settings.json` marker state, and that language tooling rides on pi-lens defaults. Note the trust caveat: pi asks before trusting a project folder that carries project-local settings or `.agents/skills`, and the restart-to-pick-up-config caveat only if the user is mid-session.
