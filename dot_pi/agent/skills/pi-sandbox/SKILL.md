---
name: pi-sandbox
description: The filesystem and network boundary every tool operates under, enforced by the pi-sandbox extension. Use when a tool call is denied with a sandbox reason, when a subprocess fails with EPERM or "operation not permitted", when a stale server holds a port or kill/pkill/pgrep fail inside the sandbox, when you need to know which paths or domains are allowed, or when sandbox configuration comes up.
---

# pi-sandbox boundary

[pi-sandbox](https://github.com/carderne/pi-sandbox) is a pi extension that fences filesystem and network access for **every** agent, including subagents and background agents. Bash commands are fenced at the OS level, so the fence holds for every subprocess; read/write/edit tool calls are checked against the same policy. It is a separate guard from CC Safety Net (a tool-layer command guard: secrets, destructive commands, git history — see its own skill).

## Determine the boundary from the config

The live boundary is config-driven — never assume it from memory or prior grants. Read `~/.pi/agent/sandbox.json` (global) and `.pi/sandbox.json` (local, if present), where `allowRead`, `allowWrite`, `denyWrite`, and `allowedDomains`/`deniedDomains` state what is accessible. Precedence differs by direction:

- **Reads** — any read is prompted unless the path is in `allowRead` or `allowWrite`. `denyRead` marks denied-by-default regions; a granted prompt adds the path to `allowRead`, which overrides it.
- **Writes** — `denyWrite` takes precedence over `allowWrite` and is never prompted. An empty `allowWrite` means no write access at all. `allowWrite` implies read.
- **Network** — `deniedDomains` hard-block at the OS level, no prompt. Domains outside `allowedDomains` (supports `*.example.com` wildcards) are prompted.

Only the user changes the boundary — grants arrive through prompts or user edits; the config files are read-only to the agent. Discovery at runtime: `/sandbox` shows the effective policy and current session allowances; `/sandbox-allow domain <url>` / `read <path>` / `write <path>` prompt to add grants; `/sandbox-enable` / `/sandbox-disable` (or Alt+S, `pi --no-sandbox`) gate the whole session.

## How denials surface

- **Subprocess** hits surface as `EPERM` / `operation not permitted`, but only `deniedDomains` and `denyWrite` are guaranteed silent: bash network violations outside `allowedDomains` and bash write failures raise a prompt. Switching interpreter or wrapper changes nothing. **Hand the exact command to the user** to run in their own terminal, outside the fence; if the need recurs, surface the path or domain so the user can adjust `sandbox.json`.
- **Agent venues are not escape hatches.** Subagents and background agents run under this same fence — dispatching to them changes nothing. A Herdr pane (`herdr pane run`, `herdr agent start`) or any non-pi agent runs outside it: those processes are started by the Herdr server, not the wrapped shell. Routing a blocked command into another pane or agent is a bypass; the user hand-off above is the only path.
- **Not every block is this fence.** Heredoc rejections (`heredoc form or stdin consumer is not supported safely`, `Unsupported heredoc syntax`) and `rm -rf`-style rule blocks come from CC Safety Net's command analyzer, not the sandbox — heredocs and multi-line commands run fine under this fence. Load the `cc-safety-net` skill for those.
- **Tool calls** (read/write/edit) trigger a permission prompt to the user, with four options: Abort, this session, this project, all projects. With `permissionPromptTimeoutSeconds: 0` the prompt waits indefinitely — a hung call may simply be an unanswered prompt. Session allowances are in-memory only: the agent cannot read or modify them; `/sandbox` shows them to the user.

## Background servers and ports

Every bash command is its own sandbox instance, and signals and the process list are `same-sandbox`-only — hardcoded, no config option. Processes from earlier commands stay **visible but untouchable**: `curl` and `lsof` still reach them, while `kill` fails with `EPERM` and `ps`/`pgrep`/`pkill` hard-fail — so a detached server squats its port until it exits on its own. Start processes so the missing signal never matters:

- **Same-command lifecycle** — start the server in the background, use it, and kill it within one bash call; killing own children works.
- **Self-terminating wrapper** — any process that must outlive its starting command (dev server, watcher, long build) runs under an alarm — a self-signal is never fenced — so a crashed or timed-out command can never leak a squatter; its log file is the only channel back:
  ```bash
  perl -e 'alarm shift; exec @ARGV' 900 npx next dev -p "$PORT" > /tmp/dev.log 2>&1 &
  ```
- **Restart = fresh instance** — to pick up changes, start a new instance on a freshly probed port (`python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])'`, or parse the port the server actually bound from its log) and let the old one die on its alarm. A 200/404 on "your" port may be a stranger's server: `curl` proves reachability, `lsof -nP -iTCP:$PORT -sTCP:LISTEN` proves ownership (works cross-command).
- A stale squatter you didn't start: identify it with `lsof -ti :3000`, then hand `kill <pid>` to the user.
