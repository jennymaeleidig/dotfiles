#!/bin/bash
set -euo pipefail
#
# Binds pi-warden to the shared rules file, seeds TypeSafe consent, turns the
# status bar off, and pins the one path rule the sandbox does not express. The warden
# user config is RUNTIME state, not source: `/warden mode` writes `mode`, and the
# `/warden config` panel rewrites the document — every one of them through a
# read-modify-write of the whole file. A chezmoi-managed copy would be clobbered on
# each Apply (consent re-prompting forever), so this script merges the keys it owns
# and leaves every other key untouched. Removing a key here does not remove it from
# the file — edit the file, or use `/warden config`.
#
# Editing this script changes its content hash and reruns it (onchange
# mechanism). `after_` because the shared rules file under dot_pi/agent/warden/
# is what rules.files points at, so it should already be in target state.
#
cd "$HOME"

command -v jq >/dev/null || {
	echo "jq is required to configure pi-warden" >&2
	exit 1
}

CONFIG="$HOME/.pi/agent/pi-warden/config.json"
RULES="$HOME/.pi/agent/warden/global-rules.md"
LOCAL="warden-local-rules.md"

mkdir -p "$(dirname "$CONFIG")"
chmod 700 "$(dirname "$CONFIG")"
[ -f "$CONFIG" ] || printf '{}\n' >"$CONFIG"

TMP="$(mktemp "$(dirname "$CONFIG")/.config.json.XXXXXX")"
trap 'rm -f "$TMP"' EXIT

# Upserts by id and unions the lists, so a rule or skip entry added later in
# the file survives, and a rerun of this script is a no-op.
#
# Three kinds of key, deliberately handled differently:
#   rules.files, action.pathRules  chezmoi owns them; Apply is the last word.
#   widget.enabled                 off. The default "live" status line is one
#                                  sentence rewritten on every judged call, and
#                                  it pushes the editor around as it grows. The
#                                  guards, the trace, and the /warden panels are
#                                  untouched by this key; the trace opens with
#                                  ctrl+shift+w or /warden trace instead of a
#                                  click on the bar.
#   widget.barMode                 "stack", so a bar turned back on in the panel
#                                  comes back a line per guard rather than live.
#   typesafe                       only seeded when absent. Consent belongs to
#                                  the tool: `/warden disable` must survive the
#                                  next Apply, so the test is `has("typesafe")`
#                                  and not `// true` — jq's alternative operator
#                                  treats an explicit `false` as empty and would
#                                  turn a deliberate opt-out back on.
#                                  (`PI_WARDEN_ENABLED=1` in the shell grants the
#                                  same consent for headless runs and outranks
#                                  this key either way.)
jq --arg g "$RULES" --arg l "$LOCAL" --argjson rule '{
  "id": "guard-config",
  "paths": ["~/.pi/agent/pi-warden/**", "~/.pi/agent/sandbox.json", "~/.cc-safety-net/**"],
  "access": "read",
  "tools": ["write", "edit"],
  "onlyIfExists": false,
  "action": "block",
  "message": "the guard configuration is out of bounds for an agent"
}' '
  (.rules // {}) as $r
| (.action // {}) as $a
| (.widget // {}) as $w
| .rules = ($r + {
    files: ([$g, $l] + (($r.files // []) | map(select(. != $g and . != $l)))),
    skip: ((($r.skip // []) + [".scratch/**"]) | unique)
  })
| .action = ($a + {
    pathRules: ((($a.pathRules // []) | map(select(.id != "guard-config"))) + [$rule])
  })
| .widget = ($w + { enabled: false, barMode: "stack" })
| .typesafe = (if has("typesafe") then .typesafe else true end)
' "$CONFIG" >"$TMP"

chmod 600 "$TMP"

if cmp -s "$TMP" "$CONFIG"; then
	echo "==> pi-warden already bound to $RULES"
else
	mv "$TMP" "$CONFIG"
	echo "==> Bound pi-warden: rules.files -> $RULES + $LOCAL, rules.skip += .scratch/**, action.pathRules += guard-config, widget.enabled = false (barMode stack for when it returns), typesafe seeded"
fi
