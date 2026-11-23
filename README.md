# dotfiles

Managed with `chezmoi`. Hosts: macOS (Apple Silicon) and Ubuntu 26.04 LTS arm64
running as a UTM guest. Package ownership is stated at the top of
`packages/Brewfile`: `mise` owns runtimes, `apt` owns the Linux system layer,
`brew` owns CLI utilities, and `packages/flatpak-linux.txt` +
`packages/snap-linux.txt` own Linux GUI apps.

## Fresh macOS host

Nothing has to be installed by hand: the first apply brings up the Xcode
Command Line Tools, Rosetta 2, and Homebrew.

```sh
git clone https://github.com/jennymaeleidig/dotfiles ~/.local/share/chezmoi
~/.local/share/chezmoi/bootstrap.sh
```

`bootstrap.sh` caches sudo, runs `packages/macos-prerequisites.sh`, and applies.
That helper installs the Command Line Tools through `softwareupdate`, not the
`xcode-select --install` GUI dialog, plus Rosetta 2 on Apple silicon. It is also
`run_onchange_before_05-macos-prerequisites.sh.tmpl`, so an older host converges
on the next apply. `run_onchange_before_00-bootstrap-homebrew.sh.tmpl` installs
Homebrew to `/opt/homebrew` when it is absent, so `10-brew-bundle` has a prefix
to use. Re-running `bootstrap.sh` resumes a failed apply.

`run_onchange_after_25-macos-default-editor.sh.tmpl` then makes Visual Studio
Code the Finder handler for text and source files with `duti`; the shell and git
editors were already `code` (`dot_bash_exports.tmpl`, `dot_gitconfig`).

`run_after_60-adobe-hosts.sh.tmpl` also writes a marked Adobe telemetry block
into `/etc/hosts` on both hosts. The records come from
`~/.local/share/adobe-blocklist/hosts`, a checksum-pinned chezmoi external
(`.chezmoiexternal.toml`); an upstream update is adopted by bumping that hash.
The list blocks sign-in and licensing endpoints as well as telemetry, so opt out
before running it on a host that uses Creative Cloud: delete the
`run_after_60-adobe-hosts.sh.tmpl` script and the external entry. Deleting only
the block from `/etc/hosts` lasts until the next apply.

Expect `brew bundle` to stay interactive on macOS: casks prompt for passwords
and open installers, and `mise install` plus Tidal's `cabal install` take a
while. Open a new terminal afterwards; `after_20` changes the login shell to
`/opt/homebrew/bin/bash`.

Then, once, as the user:

```sh
gh auth login                     # also gives git HTTPS credentials
gh auth setup-git
```

- Tailscale on macOS is the `tailscale-app` cask, deliberately not the App
  Store build and not the `tailscale` brew formula: each of the three ships a
  daemon, and two daemons share one state directory. The app supervises its own
  privileged daemon and bundles the CLI, so the first run is: approve the system
  extension when macOS asks, then log in. There is no `brew services` step. On
  Linux the same daemon comes from apt instead.
- qBittorrent is not in `packages/Brewfile` either: every qBittorrent cask is
  disabled upstream because the app does not pass Gatekeeper. Install it from
  qbittorrent.org, then clear the quarantine attribute before first launch
  (`xattr -dr com.apple.quarantine /Applications/qBittorrent.app`). Do not
  disable Gatekeeper itself. `transmission` is the cask that still installs.
- `mkdir -p ~/.secrets && ${EDITOR:-nano} ~/.secrets/systemone.env` with
  `OPENCODE_API_KEY` from https://opencode.ai/console; pi's `opencode` provider
  and pi-warden's judge endpoint both read it.
- `pi` signs in and materializes its packages.
- Start `herdr` once, then `chezmoi apply` again to link the vendored plugins.
- Grant what casks cannot: Aerospace (Accessibility), Karabiner (Input
  Monitoring and the System Extension, then log out), LuLu (network extension),
  superwhisper (microphone), OBS (screen recording).
- Import `tools/raycast/*.rayconfig` and `tools/vorssant/Vorssaint Settings.plist`
  through those apps; they are exports, not applied targets.

## Fresh Ubuntu guest

```sh
git clone https://github.com/jennymaeleidig/dotfiles ~/.local/share/chezmoi
~/.local/share/chezmoi/bootstrap.sh
```

`bootstrap.sh` caches sudo, installs chezmoi to an unmanaged
`~/.cache/chezmoi-bootstrap`, applies, and deletes that copy before the apply
when a chezmoi is already on PATH, and otherwise only after a successful apply.
Re-running it resumes a failed apply.

Then, once, as the user:

```sh
sudo usermod -aG docker "$USER"    # takes effect at next login
sudo tailscale up
gh auth login
pi                                 # signs in, materializes its packages
mkdir -p ~/.secrets && ${EDITOR:-nano} ~/.secrets/systemone.env  # OPENCODE_API_KEY
chezmoi apply                      # links the tinysubagent herdr plugin
```

Ghostty is a classic snap; Zen is a flatpak; VS Code comes from the Microsoft
repo. Ghostty launches through `~/.local/bin/ghostty`, which forces software GL
for that one program, because UTM's virgl exposes GL 2.1/GLES 3.0 and its
renderer needs more. `~/.local/share/applications/ghostty_ghostty.desktop`
routes the dock entry through the same wrapper.

## Invariants worth knowing before editing anything

- Script phases and their environment: `docs/adr/0001-script-phases-and-host-environment.md`.
- `~/.config/environment.d` is cached by the systemd user manager at start.
  After changing it, `loginctl terminate-user "$USER"`; restarting `gdm` does
  nothing.
- `run_onchange_` records success by content hash: a script that exits 0 while
  deferring work will never run again. Defer with a plain `run_` instead.
- Never set rendering variables session-wide on this guest. It has already cost
  a login loop.
- PATH edits prepend then deduplicate (`prepend_path` in `dot_bashrc.tmpl`),
  never "skip if already present": launchd hands the session a PATH that already
  holds brew's bin near the end, and a presence check leaves `/bin` ahead of it.
- On macOS the login shell is `/opt/homebrew/bin/bash`, whitelisted in
  `/etc/shells` and set with `sudo chsh` by
  `.chezmoiscripts/run_onchange_after_20-macos-bash.sh.tmpl`. `/bin/bash` stays
  Apple's 3.2 under SIP: nothing symlinks over it, and `.chezmoiscripts/*` keep
  `#!/bin/bash` deliberately.
- Retina and 3D acceleration stay as UTM has them; the guest works with software
  GL for the one program that needs it.

## Verify

```sh
chezmoi status
brew bundle check --file="$HOME/.local/share/chezmoi/packages/Brewfile"
bash --version                    # macOS: 5.x from /opt/homebrew/bin, never 3.2
command -v pi && herdr plugin list
systemctl --user show-environment | command grep -i libgl || echo clean
```
