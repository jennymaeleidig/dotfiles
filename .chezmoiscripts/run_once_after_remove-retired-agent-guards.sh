#!/bin/bash
set -euo pipefail
#
# One-time cleanup for the retired pi packages pi-system-one and
# pi-sandbox-runtime. Their declarations leave dot_pi/agent/settings.json, but
# pi materializes packages into runtime state that .chezmoiignore deliberately
# excludes (ADR-0002), so no Apply deletes those trees. This script removes the
# host paths the two packages deployed. It runs once per host; on a host that
# never installed them every path is already absent and the rm is a no-op.
#
# Runs after Apply, so the chezmoi-managed copies are normally already gone when
# this executes — they are listed anyway, so the removal holds whichever half
# runs first. Real (resolved) target paths on this host:
#
#   /Users/jennyleidig/.pi/agent/sandbox.json
#   /Users/jennyleidig/.pi/agent/skills/pi-sandbox-runtime
#   /Users/jennyleidig/.pi/agent/skills/system-one
#   /Users/jennyleidig/.pi/agent/git/github.com/jennymaeleidig/pi-sandbox-runtime
#   /Users/jennyleidig/.pi/agent/npm/node_modules/pi-system-one
#   /Users/jennyleidig/.pi/agent/npm/node_modules/system-one-core
#
# Not removed: ~/.secrets/system-one.env. It is unmanaged, may hold a live
# credential, and is the owner's to delete.

# Runtime trees pi materialized from the package declarations.
rm -rf \
	"$HOME/.pi/agent/npm/node_modules/pi-system-one" \
	"$HOME/.pi/agent/npm/node_modules/system-one-core" \
	"$HOME/.pi/agent/git/github.com/jennymaeleidig/pi-sandbox-runtime"

# Skills the packages contributed.
rm -rf \
	"$HOME/.pi/agent/skills/system-one" \
	"$HOME/.pi/agent/skills/pi-sandbox-runtime"

# chezmoi-managed config the sandbox extension read.
rm -f "$HOME/.pi/agent/sandbox.json"

echo "==> removed retired pi-system-one and pi-sandbox-runtime state"
