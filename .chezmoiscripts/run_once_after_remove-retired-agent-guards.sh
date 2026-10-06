#!/bin/bash
set -euo pipefail
#
# One-time cleanup for the retired pi package pi-sandbox-runtime. Its
# declaration left dot_pi/agent/settings.json, but pi materializes packages into
# runtime state that .chezmoiignore deliberately excludes, so no Apply deletes
# those trees. This script removes the host paths the package deployed. It runs
# once per host; on a host that never installed it every path is already absent
# and the rm is a no-op.
#
# Runs after Apply, so the chezmoi-managed copies are normally already gone when
# this executes — they are listed anyway, so the removal holds whichever half
# runs first. Real (resolved) target paths on this host:
#
#   /Users/jennyleidig/.pi/agent/skills/pi-sandbox-runtime
#   /Users/jennyleidig/.pi/agent/git/github.com/jennymaeleidig/pi-sandbox-runtime
#
# Not removed: ~/.pi/agent/sandbox.json, which pi-sandbox reads again, and env
# files under ~/.secrets. They are unmanaged, may hold live credentials, and are
# the owner's to delete.

# Runtime tree pi materialized from the package declaration.
rm -rf \
	"$HOME/.pi/agent/git/github.com/jennymaeleidig/pi-sandbox-runtime"

# Skills the package contributed.
rm -rf \
	"$HOME/.pi/agent/skills/pi-sandbox-runtime"

echo "==> removed retired pi-sandbox-runtime state"
