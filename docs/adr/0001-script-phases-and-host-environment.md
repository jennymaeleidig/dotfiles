# 0001 — Chezmoi script phases and the host environment

Status: accepted

## Context

Provisioning a fresh Ubuntu 26.04 arm64 guest in UTM surfaced six failures in
`.chezmoiscripts/` and one that took the graphical session down. Every one was
the same blind spot: a script or a config file assuming something about its
environment that only holds on an already-provisioned host.

Scripts (`chezmoi` application order):

- `run_before_*` runs before any target is written.
- A plain `run_*` / `run_onchange_*` runs _inside_ the target-state pass, at its
  own position in the ASCII ordering of target names. `.chezmoiscripts/…` sorts
  before `.config/…`, so a plain script cannot read a config chezmoi is about to
  write.
- `run_after_*` runs after every target is written.

Environment:

- No script inherits another script's environment. `eval "$(brew shellenv)"`
  inside `00-bootstrap` is invisible to `10-brew-bundle`.
- `mise activate` installs a _prompt hook_; a script never draws a prompt, so it
  puts no shims on `PATH`. `mise exec -- <tool>` resolves from the global config
  instead.
- pnpm 12 places global executables in `$PNPM_HOME/bin`, and refuses `add -g`
  when that directory is not on `PATH`.
- `~/.config/environment.d/*.conf` is read **once**, when the systemd user
  manager starts, and then cached for the whole session. Editing or deleting the
  file changes nothing until `loginctl terminate-user` or a reboot;
  `systemctl restart gdm` does not re-read it.

## Decision

1. A `run_before_` script may read only Source state and the base system.
2. A plain `run_` script must not assume any target it needs has landed.
   Anything that reads an applied file belongs in `run_after_`.
3. Anything that needs a user-scoped daemon (herdr's server) is `run_after_` and
   a plain `run_`, not `run_onchange_`, because a deferred success must be
   retried on the next apply rather than recorded as done.
4. Every script resolves its own tools by absolute path, then `eval`s the
   environment it needs, then checks for the tool. It never relies on PATH
   inherited from a previous script or from the launching shell.
5. Rendering variables are scoped to the program that needs them, via a wrapper
   in `~/.local/bin`. Session-wide `environment.d` entries are not used for
   rendering at all.

## Consequences

- `setup-mise-tools` is `after_30`, `40-pi-coding-agent` is `after_40`, and
  `link-herdr-plugins` is a plain `run_after_` gated on `herdr plugin list`
  succeeding.
- `LIBGL_ALWAYS_SOFTWARE=1` lives only in the Ghostty wrapper. A session-wide
  copy reached `gnome-shell` and produced a SIGSEGV in a Wayland/virgl session:
  the shell does not merely ignore software rendering on Wayland, it can crash.
- Any future environment change needs `loginctl terminate-user`, and the runbook
  says so.
