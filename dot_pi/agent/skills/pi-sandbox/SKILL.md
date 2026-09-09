---
name: pi-sandbox
description: The filesystem and network boundary every tool operates under, enforced by the pi-sandbox extension. Use when a tool call is denied with a sandbox reason, when a subprocess fails with EPERM or "operation not permitted", when you need to know which paths or domains are allowed, or when sandbox configuration comes up.
---

# pi-sandbox boundary

[pi-sandbox](https://github.com/carderne/pi-sandbox) is a pi extension that fences filesystem and network access for **every** agent, including subagents and background agents. Bash commands are wrapped at the OS level (`sandbox-exec` on macOS, bubblewrap on Linux), so the fence holds for every subprocess; read/write/edit tool calls are intercepted in-process and checked against the same policy. It is a separate guard from CC Safety Net (secrets, destructive commands, git history — see its own skill).

## Determine the boundary from the config

The live boundary is config-driven — never assume it from memory or prior grants. Read `~/.pi/agent/sandbox.json` (global) and `.pi/sandbox.json` (local, if present), where `allowRead`, `allowWrite`, `denyWrite`, and `allowedDomains`/`deniedDomains` state what is accessible. Precedence differs by direction:

- **Reads** — any read is prompted unless the path is in `allowRead` or `allowWrite`. `denyRead` marks denied-by-default regions; a granted prompt adds the path to `allowRead`, which overrides it.
- **Writes** — `denyWrite` takes precedence over `allowWrite` and is never prompted. An empty `allowWrite` means no write access at all. `allowWrite` implies read.
- **Network** — `deniedDomains` hard-block at the OS level, no prompt. Domains outside `allowedDomains` (supports `*.example.com` wildcards) are prompted.

The sandbox config files themselves sit in `denyWrite`: only the user can change the boundary.

## How denials surface

- **Subprocesses** hitting the fence fail instantly with `EPERM` / `operation not permitted` — no prompt, and switching interpreter or wrapper changes nothing. **Hand the exact command to the user** to run in their own terminal, outside the fence; if the need recurs, surface the path or domain so the user can adjust `sandbox.json`.
- **Agent venues are not escape hatches.** Subagents and background agents run under this same fence — dispatching to them changes nothing. A Herdr pane (`herdr pane run`, `herdr agent start`) or any non-pi agent runs outside it: those processes are started by the Herdr server, not the wrapped shell. Routing a blocked command into another pane or agent is a bypass; the user hand-off above is the only path.
- **Tool calls** (read/write/edit) trigger a permission prompt to the user, with four options: Abort, this session, this project, all projects. With `permissionPromptTimeoutSeconds: 0` the prompt waits indefinitely — a hung call may simply be an unanswered prompt. Session allowances are in-memory only: the agent cannot read or modify them; `/sandbox` shows them to the user.
