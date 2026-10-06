---
name: pi-sandbox
description: pi-sandbox, an OS-level fence over shell commands and the read/write/edit tools, controlling filesystem paths and, when configured, the network. Use when a call is blocked or a subprocess fails with EPERM / "operation not permitted", before a dev server or other long-lived process, when a stale server holds a port, or when a path allowance or the sandbox config comes up.
---

# pi-sandbox boundary

[pi-sandbox](https://github.com/carderne/pi-sandbox) fences **shell commands at the OS level** (`sandbox-exec` on macOS, `bubblewrap` on Linux) and checks the `read`, `write`, and `edit` tools against the same filesystem policy. It covers every pi agent, including subagents and background agents; commands entered with `!` are sandboxed by default.

## Read the boundary from the config

`~/.pi/agent/sandbox.json` (global) and `.pi/sandbox.json` (project, loaded only when the project is trusted) are the live boundary. Path and domain arrays from both files combine; project scalars win. Never assume it from memory or a prior grant — and treat both files as read-only to the agent.

- **Reads** — `denyRead` (default `["/Users", "/home"]`) marks regions denied by default. A read is prompted unless the path is in `allowRead` or `allowWrite`; granting the prompt adds the path to `allowRead`, which overrides `denyRead`.
- **Writes** — allowed only inside `allowWrite`; `denyWrite` takes precedence and is never prompted, and an empty `allowWrite` means no write access. `allowWrite` also grants read.
- **Network is disabled** in this config, so shell commands and sockets reach the network directly while the filesystem fence stays on. Re-adding `network.allowedDomains` turns the proxy back on, with per-domain prompts for anything outside the list.

Discovery at runtime: `/sandbox` shows the effective policy and session allowances; `/sandbox-allow domain|read|write <value>` prompts to add a grant; `/sandbox-enable`, `/sandbox-disable`, Alt+S, and `pi --no-sandbox` gate the whole session. Grants live in memory only and reset when the extension reloads — the agent cannot read or modify them.

## How denials surface

Subprocess filesystem denials arrive as `EPERM` / `operation not permitted`. Changing interpreter or wrapper changes nothing: hand the exact command to the user to run in their own terminal, and name the path so they can widen the config if the need recurs. Subagents and background agents run under the same fence, so dispatching to one changes nothing; a Herdr pane or any non-pi agent is outside it, so that hand-off is the only path.

`read`, `write`, and `edit` blocks raise a permission prompt with four choices — Abort, this session, this project, all projects. With `permissionPromptTimeoutSeconds: 0` the prompt waits indefinitely, so a hung tool call may simply be an unanswered prompt.

## Background servers and ports

Every bash command is its own sandbox instance, and signals and the process list are `same-sandbox`-only — hardcoded, no config option. Processes from earlier commands stay visible but untouchable: `curl` and `lsof` still reach them, while `kill` fails with `EPERM` and `ps`/`pgrep`/`pkill` hard-fail, so a detached server squats its port until it exits on its own. Start processes so the missing signal never matters:

- **Same-command lifecycle** — start the server in the background, use it, and kill it within one bash call; killing own children works.
- **Self-terminating wrapper** — anything that must outlive its starting command (dev server, watcher, long build) runs under an alarm, so a crashed or timed-out command can never leak a squatter; its log file is the only channel back:
  ```bash
  perl -e 'alarm shift; exec @ARGV' 900 npx next dev -p "$PORT" > /tmp/dev.log 2>&1 &
  ```
- **Restart = fresh instance** — start a new instance on a freshly probed port (`python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])'`, or parse the port the server actually bound from its log) and let the old one die on its alarm. A 200/404 on "your" port may be a stranger's server: `curl` proves reachability, `lsof -nP -iTCP:$PORT -sTCP:LISTEN` proves ownership.
- A stale squatter you didn't start: identify it with `lsof -ti :3000`, then hand `kill <pid>` to the user.
