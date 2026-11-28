# Apply order: the phase/slot map

The *rules* governing `.chezmoiscripts/` live in `docs/adr/0001-script-phases-and-host-environment.md`; this file covers the *layout* — which slot each script occupies and why, so the ordering knowledge has one home instead of living only in per-script comments and numbered filenames.

## Phases (chezmoi application order)

1. `run_before_*` — before any target is written. May read Source state (`.chezmoi.sourceDir`) and the base system only.
2. plain `run_*` / `run_onchange_*` — inside the target-state pass, at its position in the ASCII ordering of target names. `.chezmoiscripts/…` sorts before `.config/…`, so a script here cannot read a config chezmoi is about to write.
3. `run_after_*` — after every target is written.

## The grid

| Slot | Script | Phase | Why that slot |
| --- | --- | --- | --- |
| before_00 | bootstrap-homebrew | `run_onchange_before_` | Both hosts get a brew prefix here, so every later script can assume it. Presence check, no hash. |
| before_05 | macos-prerequisites | `run_onchange_before_` | The Homebrew installer in 00 needs the Xcode CLT, so this sorts before it. Calls `packages/macos-prerequisites.sh` — deliberately also called by `bootstrap.sh`, which runs before any apply exists; the call is idempotent. |
| before_10 | brew-bundle | `run_onchange_before_` | Hash-gated on `packages/Brewfile`. Depends on the prefix from 00. |
| before_20 | apt-packages | `run_onchange_before_` | Linux GUI/host packages via apt, hash-gated on `packages/apt-ubuntu.txt`. |
| before_25 | linux-gui-apps | `run_onchange_before_` | Snaps and flatpaks (`packages/snap-linux.txt`, `packages/flatpak-linux.txt`). Slot 25, after apt: sudo's timestamp is still warm from 20 and snap install is user-scoped after first setup. |
| after_20 | macos-bash | `run_onchange_after_` | The bash binary is installed by the Brewfile in the before_ phase, so this cannot be before_; it reads nothing chezmoi writes, so after_20 (ahead of 30) is the right slot. |
| after_30 | setup-mise-tools | `run_onchange_after_` | Reads `~/.config/mise/config.toml`, a target: must be after_ or the config is absent on a fresh host. Hash-gated on the config file. |
| after_40 | pi-coding-agent | `run_onchange_after_` | Needs mise (after_30) for pnpm; pins `PI_VERSION` in the script as its own manifest hash. |
| after_50 | tidal | `run_onchange_after_` (darwin only) | Needs brew's ghc/cabal from the before_ phase; `TIDAL_VERSION` is the manifest hash. |
| after (any) | link-herdr-plugins | plain `run_after_` | Herdr's server is user-scoped and may not be running during an apply; a deferred success must retry next apply, hence not `run_onchange_`. |
| after_60 | adobe-hosts | `run_after_` | Blocked-list hosts entry; runs last so the GUI it serves for is in place. |

## Ordering invariants

- **Config-before-read**: anything reading an applied file (`~/.config/mise/config.toml`) is `after_`, and after the *specific* slot of anything it depends on (mise before pi).
- **Prefix-before-brew**: every brew consumer resolves the prefix itself via `packages/script-env.sh` (`brew_prefix`/`brew_env`), and aborts with a pointer to the script that should have provided it rather than failing opaquely.
- **Sudo warmth**: privileged scripts call `require_uncached_sudo` (from `script-env.sh`) only once real work remains; an unattended apply must never hang. `bootstrap.sh` asks once up front because brew's installer outlives sudo's 15-minute timestamp.
- **Retryability**: a script that can fail for environmental reasons (no herdr server) is a plain `run_after_`, never `run_onchange_`, so the next apply retries it.

## Manifest ownership

| Manifest | Owns | Platform |
| --- | --- | --- |
| `packages/Brewfile` | CLI utilities and macOS casks | both (formulas) / macOS (casks) |
| `packages/apt-ubuntu.txt` | Linux host packages | Linux |
| `packages/snap-linux.txt` + `packages/flatpak-linux.txt` | Linux GUI apps (cask counterparts live in the Brewfile) | Linux |
| `dot_config/mise/config.toml` | dev tool versions | both |
| `PI_VERSION` / `TIDAL_VERSION` inline in their scripts | tools no manifest can express | — |
