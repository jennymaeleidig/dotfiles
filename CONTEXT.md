# Machine Configuration

The domain of provisioning a host: managing configuration files, installing tools, and bringing a machine to its desired state.

## Language

### State

**Host**:
A machine that this repo provisions — the place dotfiles and tools end up.
_Avoid_: machine, computer, laptop

**Source state**:
What this repo tracks — dotfiles, scripts, provisioning material, and repo docs — before anything reaches a host.
_Avoid_: repo, source

**Target state**:
What a host actually has after Apply: its home directory as reconciled, excluding runtime state.
_Avoid_: destination, applied files

**Runtime state**:
Files that running programs write — on a host or in the source directory — as opposed to this repo; deliberately not managed. Target-side runtime state (e.g. the pi package trees under `~/.pi/agent/npm/` and `~/.pi/agent/git/`) is left in place by Apply; source-side runtime files (e.g. opencode.json, skills-lock.json, .vscode/) never reach a host. Both sides are enumerated in `.chezmoiignore`.
_Avoid_: cache, unmanaged files, junk

**Apply**:
The act of reconciling Source state into Target state: writing dotfiles, removing those no longer in Source state, and running scripts whose inputs changed.
_Avoid_: sync, deploy

### Files and scripts

**Dotfile**:
A configuration file that this repo manages and applies to a host's home directory.
_Avoid_: config file, rc file

**Template**:
A dotfile or script whose content is rendered before apply, parameterized by included files and variables.
_Avoid_: tmpl file

**Script**:
A side-effecting action this repo runs on a host — installs or updates something rather than describing state.
_Avoid_: installer, setup script

**Onchange script**:
A script that runs when its inputs change; the inputs are hashed into the script's rendered content so the change is detected.
_Avoid_: watcher

**Prompt template**:
A dotfile that expands a slash-invoked prompt in pi — a reusable Markdown snippet typed as `/name`. Replaces opencode's "command" concept.
_Avoid_: command, slash command, custom command

### External sources

**External source**:
Content pulled from a remote location into Source state, refreshed on a schedule, and applied like any other source content — e.g. the ghostty and opencode theme files fetched by Apply.
_Avoid_: vendored copy, bundled content

### Source-only artifacts

**Source-only artifact**:
Any content in Source state that never reaches a host — repo docs, provisioning material, agent scratch. `.chezmoiignore` enumerates every source-only artifact explicitly; a blanket rule is forbidden because it would swallow applied content such as the opencode app config's markdown commands and skills.
_Avoid_: assets, bundled content

**Repo docs**:
Repository documents that guide the setup but never reach a host — docs/, README, CODING_STANDARDS.
_Avoid_: documentation

### Tools and apps

**Tool**:
A program a host needs, installed and upgraded by a toolchain manager. The model tracks a tool's presence, not its version.
_Avoid_: app, package, binary

**Toolchain manager**:
A program that installs, upgrades, and tracks the tools of a host, such as mise or homebrew.
_Avoid_: package manager, version manager

**App config**:
The set of dotfiles for one program, such as the nvim, ghostty, bash, starship, or pi app config. An app config may depend on tools.
_Avoid_: config, dotfile folder

**Pi Package**:
A pi package — a distributable bundle of extension, skill, prompt template, or theme, declared in the pi app config and materialized by pi into runtime state on startup. Distinct from a Tool (installed by a toolchain manager) and an External source (pulled into Source state by Apply).
_Avoid_: plugin, add-on

**Theme**:
Styling choices — colors, fonts, cursor — shared across app configs; currently Monokai Pro. A published theme is an external source; the shiki and bat themes are hosted in Source state only until they are published — the shiki theme as provisioning material, the bat theme as a plain dotfile.
_Avoid_: color scheme, style

### Agent tooling

**Subagent**:
A pi session the orchestrator spawns to run a bounded task in isolation — its own tools, model, and system prompt — returning a result. Spawned with pi-subagents' `Agent` tool.
_Avoid_: sub-agent, worker, background agent, child session

**Orchestrator**:
The main pi session that detects when to delegate and spawns subagents, then consumes their results.
_Avoid_: main agent, parent, host

**Leaf agent**:
A subagent that must not spawn further subagents (no `allowed_subagents`). The `vision` subagent is a leaf.
_Avoid_: terminal agent, sink agent

**Delegation**:
The orchestrator handing a bounded task to a subagent instead of doing it in-context, to keep the main context clean.
_Avoid_: handoff

**Ralph loop**:
A long-running, verifiable task driven by the pi-ralph-wiggum extension: the `ralph-runner` wrapper turns a task into a task file, runs the loop until the completion gate is met, and returns a `<promise>COMPLETE</promise>`. Conceptually a spawned unix process — one input, run until exit.
_Avoid_: loop agent, task runner

**Ralph runner**:
The subagent that runs one ralph loop on a supplied task to completion and returns. Dispatched via the `Agent` tool; never run inline.
_Avoid_: ralph agent, ralph-loop agent

**Prompt state machine**:
A slash prompt (`/name` in `dot_pi/agent/prompts/`) written as a machine: its body is one fenced Mermaid `flowchart TD` state diagram with explicit transitions and one terminal "report back" state. Node shapes carry meaning: `[ ]` inline orchestration, `[[ ]]` dispatch a `ralph-runner` subagent, `{ }` decision, `([ ])` report-back. Frontmatter (`description`, `argument-hint`) sits outside the diagram.
_Avoid_: slash command, prompt, command

**Prompt lifecycle**:
The larger state machine a prompt lives inside — the ordering of prompts a human walks (wayfind → to-effort-spec → to-impl-tickets → implement → close). A prompt is one state of it, and may compose child prompts the same way.
_Avoid_: flow, pipeline, workflow