#!/usr/bin/env bash
# Stand-in for `pi` in the smoke test: record the task it was handed and report,
# exactly as the real child extension would write the sidecar.
set -u
last="${@: -1}"
printf '%s' "$last" > "${PI_SUBAGENT_REPORT}.task"
printf '{"type":"done","result":"smoke ok"}' > "$PI_SUBAGENT_REPORT"
