#!/usr/bin/env bash
# macOS prerequisites the rest of provisioning assumes: the Xcode Command Line
# Tools, which Homebrew's installer refuses to run without, and Rosetta 2 for
# x86_64 binaries on Apple silicon.
#
# Idempotent by presence check. bootstrap.sh calls this before the first apply;
# .chezmoiscripts/run_onchange_before_05-macos-prerequisites.sh.tmpl calls it on
# every apply, so a host provisioned before this file existed converges too.
#
# `xcode-select --install` is a GUI dialog, so it cannot be used here.
# `softwareupdate` installs the same package unattended, but only lists it while
# the on-demand marker file exists.
set -euo pipefail

if [ "$(uname -s)" != Darwin ]; then
	echo "==> not macOS; no prerequisites to install"
	exit 0
fi

needs_clt=0
if ! xcode-select -p >/dev/null 2>&1; then
	needs_clt=1
fi

# Probing by running an x86_64 binary would open the very install dialog this
# function replaces, so test for Rosetta's runtime directory instead.
needs_rosetta=0
if [ "$(uname -m)" = arm64 ] && [ ! -d /Library/Apple/usr/libexec/oah ]; then
	needs_rosetta=1
fi

if [ "$needs_clt" -eq 0 ] && [ "$needs_rosetta" -eq 0 ]; then
	echo "==> macOS prerequisites already present"
	exit 0
fi

# An unattended apply must never hang on a sudo prompt.
if ! sudo -n true 2>/dev/null; then
	echo "==> sudo needs a password: run 'sudo -v', then re-run" >&2
	exit 1
fi

if [ "$needs_clt" -eq 1 ]; then
	# A stale selection (an Xcode that has since been deleted) needs the path
	# pointed back, not a download.
	if [ -d /Library/Developer/CommandLineTools ]; then
		echo "==> xcode-select points elsewhere; selecting /Library/Developer/CommandLineTools"
		sudo xcode-select --switch /Library/Developer/CommandLineTools
	fi
fi

if ! xcode-select -p >/dev/null 2>&1; then
	marker=/tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
	touch "$marker"
	trap 'rm -f "$marker"' EXIT

	label=$(softwareupdate -l 2>&1 \
		| sed -n 's/^[[:space:]]*\* Label: \(Command Line Tools.*\)$/\1/p' \
		| grep -v Beta \
		| tail -1 || true)

	if [ -z "$label" ]; then
		echo "==> no Command Line Tools package in 'softwareupdate -l': run 'xcode-select --install', then re-run" >&2
		exit 1
	fi

	echo "==> installing $label"
	sudo softwareupdate -i "$label"

	if ! xcode-select -p >/dev/null 2>&1; then
		echo "==> Command Line Tools still missing after softwareupdate: run 'xcode-select --install', then re-run" >&2
		exit 1
	fi
fi

if [ "$needs_rosetta" -eq 1 ]; then
	echo "==> installing Rosetta 2"
	sudo softwareupdate --install-rosetta --agree-to-license
fi
