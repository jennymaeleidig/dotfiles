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
Files that running programs write — on a host or in the source directory — as opposed to this repo; deliberately not managed. Target-side runtime state is left in place by Apply; source-side runtime files never reach a host.
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

### External sources

**External source**:
Content pulled from a remote location into Source state, refreshed on a schedule, and applied like any other source content.
_Avoid_: vendored copy, bundled content

**Source-only artifact**:
Content in Source state that never reaches a host — repo docs, provisioning material, agent scratch.
_Avoid_: assets, bundled content

**Repo docs**:
Repository documents that guide the setup but never reach a host.
_Avoid_: documentation

### Tools and apps

**Tool**:
A program a host needs, installed and upgraded by a toolchain manager. The model tracks a tool's presence, not its version.
_Avoid_: app, package, binary

**Toolchain manager**:
A program that installs, upgrades, and tracks the tools of a host, such as mise or homebrew.
_Avoid_: package manager, version manager

**App config**:
The set of dotfiles for one program, such as the nvim, ghostty, bash, or pi app config. An app config may depend on tools.
_Avoid_: config, dotfile folder

**Theme**:
Styling choices — colors, fonts, cursor — shared across app configs; currently Monokai Pro. A published theme is an External source; an unpublished one lives in Source state.
_Avoid_: color scheme, style