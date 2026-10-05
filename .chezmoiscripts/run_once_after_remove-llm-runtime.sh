#!/bin/bash
set -euo pipefail
#
# One-time cleanup for the retired local model runtime (llm-serve). Its
# declarations leave .chezmoiexternal.toml, dot_bash_exports.tmpl, and the
# herdr config, but the checkout and the herdr registration are host state
# that no Apply removes: the external lived under ~/.local/share, and the
# plugin registry is herdr runtime state. This script runs once per host; on a
# host that never installed the runtime every path is absent and this is a
# no-op.
#
# Real (resolved) target paths on this host:
#
#   /Users/jennyleidig/.local/share/llm-serve
#   /Users/jennyleidig/.config/herdr/plugins.json   (llama-state entry)
#
# Not removed: ~/local-llm. It holds the hand-downloaded llama.cpp build and
# GGUF, is unmanaged, and is the owner's to reclaim. The GitHub repository
# github.com/jennymaeleidig/local-llm is likewise the owner's to delete.

# Unregister the sidebar plugin before its source disappears, so herdr stops
# reporting a dangling manifest path.
if command -v herdr >/dev/null 2>&1; then
	# Read the registry once, into a variable. Piping `herdr plugin list` into
	# `grep -q` looks equivalent and is not: grep exits at the first match, the
	# producer dies of SIGPIPE, and under `set -o pipefail` the pipeline reports
	# 141.
	INSTALLED="$(herdr plugin list 2>/dev/null || true)"
	case "$INSTALLED" in
	*"- llama-state "*)
		herdr plugin unlink llama-state
		echo "==> unlinked herdr plugin: llama-state"
		;;
	esac
fi

# The llm-serve external checkout.
rm -rf "$HOME/.local/share/llm-serve"

echo "==> removed retired local model runtime state"
