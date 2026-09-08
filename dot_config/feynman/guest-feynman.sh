#!/bin/sh
# Guest entry point for the feynman sandbox (docs/adr/0004): start the
# loopback relay (see relay.js), then exec the launcher inside the bundle
# (a symlink would break the launcher's own ROOT resolution). Rendered into
# the sandbox config by sandbox.yaml.tmpl.
if [ ! -x /opt/feynman/current/feynman ]; then
	echo "feynman: VM bundle missing at /opt/feynman — run feynman-vm-setup on the host" >&2
	exit 127
fi
/opt/feynman/current/node/bin/node /opt/relay.js >/dev/null 2>&1 &
exec /opt/feynman/current/feynman "$@"
