# Long-lived processes

Reference for [`pi-sandbox-runtime`](SKILL.md). Every shell command runs as its own sandboxed process group: the runtime spawns it detached and kills the whole group on timeout or abort, so a command can clean up its own children. A process that outlives its command sits outside that group; nothing later can rely on signalling it. Start processes so nothing reaches across commands:

- **Same-command lifecycle** — background the server, use it, and kill it within one bash call; killing own children works.
- **Self-terminating wrapper** — a process that outlives its starting command (dev server, watcher, long build) runs under an alarm — a self-signal — so a crashed or timed-out command cannot leak a squatter; its log file is the only channel back:
  ```bash
  perl -e 'alarm shift; exec @ARGV' 900 npx next dev -p "$PORT" > /tmp/dev.log 2>&1 &
  ```
- **Restart = fresh instance** — to pick up changes, start a new instance on a freshly probed port (`python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])'`, or parse the port the server actually bound from its log) and let the old one die on its alarm. A 200/404 on "your" port may be a stranger's server: prove ownership before trusting it.

A squatter you did not start: identify it, then hand `kill <pid>` to the user.
