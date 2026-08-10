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
What a host actually has after Apply: its home directory as reconciled.
_Avoid_: destination, applied files

**Apply**:
The act of reconciling Source state into Target state: writing dotfiles, removing those no longer in Source state, and running scripts whose inputs changed.
_Avoid_: sync, deploy

**Provision**:
The one-time act of standing up a new host — installing the toolchain manager and chezmoi themselves, before the first Apply.
_Avoid_: bootstrap, fresh install

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

**Once script**:
A script that runs exactly once per host.
_Avoid_: first-run script

### Source-only artifacts

**Provisioning material**:
Source artifacts that feed scripts but are never applied to a host — extension sources.
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
The set of dotfiles for one program, such as the nvim, ghostty, bash, or starship app config. An app config may depend on tools.
_Avoid_: config, dotfile folder

**Theme**:
Styling choices — colors, fonts, cursor — shared across app configs; currently Monokai Pro. Themes are dependencies: each is sourced from its own repo, not maintained inside this repo; the shiki and bat themes are hosted here only until they are published.
_Avoid_: color scheme, style
