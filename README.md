# dotfiles

Managed with `chezmoi`. Hosts: macOS (Apple Silicon) and Ubuntu 26.04 LTS arm64
running as a UTM guest. Package ownership is stated at the top of
`packages/Brewfile`: `mise` owns runtimes, `apt` owns the Linux system layer,
`brew` owns CLI utilities, and `packages/flatpak-linux.txt` +
`packages/snap-linux.txt` own Linux GUI apps.

## Fresh Ubuntu guest

```sh
git clone https://github.com/jennymaeleidig/dotfiles ~/.local/share/chezmoi
~/.local/share/chezmoi/bootstrap.sh
```

`bootstrap.sh` caches sudo, installs chezmoi to an unmanaged
`~/.cache/chezmoi-bootstrap`, applies, and deletes that copy only after a
successful apply. Re-running it resumes a failed apply.

Then, once, as the user:

```sh
sudo usermod -aG docker "$USER"    # takes effect at next login
sudo tailscale up
gh auth login
pi                                 # signs in, materializes its packages
mkdir -p ~/.secrets && ${EDITOR:-nano} ~/.secrets/systemone.env  # TYPESAFE_API_KEY
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
- Retina and 3D acceleration stay as UTM has them; the guest works with software
  GL for the one program that needs it.

## Verify

```sh
chezmoi status
brew bundle check --file="$HOME/.local/share/chezmoi/packages/Brewfile"
command -v pi && herdr plugin list
systemctl --user show-environment | command grep -i libgl || echo clean
```
