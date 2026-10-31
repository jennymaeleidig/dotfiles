#!/usr/bin/env bash
# Entry point for a host that has nothing. Run it from a clone rather than
# through `curl | bash`, so the sudo precondition below is visible before
# anything executes:
#
#   git clone <repo> ~/.local/share/chezmoi
#   ~/.local/share/chezmoi/bootstrap.sh
#
# The chezmoi this installs is disposable. `packages/Brewfile` owns chezmoi from
# the first `brew bundle` onward, so the temporary binary is removed when this
# script exits and brew's copy is what every later shell runs. Installing it to
# ~/.local/bin instead would shadow brew's copy permanently: dot_bashrc puts
# that directory on PATH after brew's shellenv has already run.
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 00-bootstrap and 20-apt both abort on an uncached sudo timestamp, and the
# Homebrew install between them outlives sudo's 15-minute timeout. Ask here,
# before the long phase, instead of leaving the user to learn it from a
# mid-apply failure.
sudo -v

if command -v chezmoi >/dev/null 2>&1; then
	echo "==> chezmoi already present; applying"
	exec chezmoi --source "$SOURCE_DIR" apply
fi

TMP_BIN="$(mktemp -d)"
trap 'rm -rf "$TMP_BIN"' EXIT

# -b targets the throwaway directory, and no subcommand means "install only":
# init is this script's job, not the installer's.
sh -c "$(curl -fsLS get.chezmoi.io)" -- -b "$TMP_BIN" >/dev/null

"$TMP_BIN/chezmoi" init --source "$SOURCE_DIR" --apply
