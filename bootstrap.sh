#!/usr/bin/env bash
# Entry point for a host that has nothing. Run it from a clone rather than
# through `curl | bash`, so the sudo precondition below is visible before
# anything executes:
#
#   git clone <repo> ~/.local/share/chezmoi
#   ~/.local/share/chezmoi/bootstrap.sh
#
# The chezmoi this installs is disposable. `packages/Brewfile` owns chezmoi from
# the first `brew bundle` onward, so this copy is removed once the apply has
# succeeded and brew's binary is on PATH. Installing it to ~/.local/bin instead
# would shadow brew's copy permanently: dot_bashrc puts that directory on PATH
# after brew's shellenv has already run.
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# A fixed path, not mktemp: the first apply normally fails partway (brew install,
# then apt behind a lapsed sudo timestamp), and by then neither Homebrew's
# chezmoi nor this clone's entry point can run an apply again. A temporary
# directory would take the only retry tool with it.
BOOTSTRAP_BIN="$HOME/.cache/chezmoi-bootstrap"

# 00-bootstrap and 20-apt both abort on an uncached sudo timestamp, and the
# Homebrew install between them outlives sudo's 15-minute timeout. Ask here,
# before the long phase, instead of leaving the user to learn it from a
# mid-apply failure.
sudo -v

if command -v chezmoi >/dev/null 2>&1; then
	echo "==> chezmoi already present; applying"
	rm -rf "$BOOTSTRAP_BIN"
	exec chezmoi --source "$SOURCE_DIR" apply
fi

if [ ! -x "$BOOTSTRAP_BIN/chezmoi" ]; then
	mkdir -p "$BOOTSTRAP_BIN"
	# -b targets that directory, and no subcommand means "install only": init is
	# this script's job, not the installer's.
	sh -c "$(curl -fsLS get.chezmoi.io)" -- -b "$BOOTSTRAP_BIN" >/dev/null
fi

# set -e exits here on a failed apply, deliberately leaving the binary in place
# so re-running this script retries instead of re-downloading.
"$BOOTSTRAP_BIN/chezmoi" init --source "$SOURCE_DIR" --apply

# Redundant only now, with the apply known good and brew's copy installed.
rm -rf "$BOOTSTRAP_BIN"