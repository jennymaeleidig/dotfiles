---
name: pi-sandbox-runtime
description: The filesystem and network boundary every tool operates under, enforced by the pi-sandbox-runtime extension driving @anthropic-ai/sandbox-runtime. Use before starting dev servers or other long-lived background processes, when a tool call is blocked with a guard reason, when a subprocess fails with EPERM or "operation not permitted", when a Tool is refused as unmapped, when you need to know which paths or domains are allowed, or when sandbox configuration comes up.
---

# pi-sandbox-runtime boundary

[pi-sandbox-runtime](https://github.com/jennymaeleidig/pi-sandbox-runtime) is a pi package that puts **every Tool call and every shell command** under one sandbox policy, driving [`@anthropic-ai/sandbox-runtime`](https://github.com/anthropic-experimental/sandbox-runtime) directly. It replaced `carderne/pi-sandbox` (v0.6.8), which fenced `bash` only — `grep`, `find` and `ls` ran unchecked against the whole filesystem, and Tools contributed by other packages were never judged. Shell commands now run inside the OS sandbox (macOS `sandbox-exec`, Linux `bwrap`); every other Tool call is judged against the same policy before it runs. It is a separate guard from CC Safety Net (a tool-layer command guard: secrets, destructive commands, git history — see its own skill).

## Determine the boundary from the config

Never assume the boundary from memory or a prior grant. Two files are read, and both may be absent:

- Global: `~/.pi/agent/sandbox.json`
- Project: `<project>/.pi/sandbox.json`

The project file layers over the global one: scalars and the `network` / `filesystem` sections are replaced, while the six path and domain lists are **unioned**, and `tools` is merged per Tool name. `enabled` is replace-not-merge. An unrecognised key is a **load error, not a shrug** — a key you believe is protection but which is ignored is worse than no protection. Keys the predecessor package wrote (`permissionPromptTimeoutSeconds`, `sandboxUserShell`, `allowBrowserProcess`, `network.allowUnauthenticatedSocksProxy`, `network.sshProxy`) are recognised, reported as ignored at session start, and not honoured. The config files are read-only to the agent.

Semantics:

- **Reads** are **allowed by default**, except beneath `denyRead` (which defaults to `["/Users", "/home"]`). `allowRead` re-allows paths beneath a `denyRead` region. More specific wins over broader, so `allowRead` beats a broader `denyRead`, while a narrower `denyRead` beats a broader `allowRead`. This is the opposite of the write side.
- **Writes** are allowed only inside `allowWrite` (which defaults to nothing). `denyWrite` wins over `allowWrite`. `allowWrite` does not by itself re-allow a read that `denyRead` still matches.
- **Symlinked roots on macOS.** The shell fence sees resolved paths, so `/tmp` is `/private/tmp` and `/var` is `/private/var`. Naming only `/tmp` lets the guard's own write check pass while a shell write is still denied at the OS level. Name both spellings for any symlinked writable root — the shipped config names both `/var/folders/*/*/T/**` and `/private/var/folders/*/*/T/**` for the temp directory.
- **Network** — `allowedDomains` is an allow-list of real domains; wildcards such as `*.npmjs.org` are fine and `"*"` is rejected on purpose. `deniedDomains` hard-blocks regardless. An empty `allowedDomains` allows none. Shell commands reach the network through the runtime's proxy, and the guard refuses a command naming an unlisted domain before it runs.

If no config exists at all, the guard supplies `denyRead: ["/Users", "/home"]` and empty lists for everything else — nothing is writable and no domain is reachable.

Runtime discovery: `/guard` shows the guard's status, the global and project config paths it loaded, the effective policy, and any session grants; `/guard-allow <path>` admits a path and its children, `/guard-allow tool:<name>` admits a whole Tool. Grants are in-memory only and vanish when the session ends; nothing is written back to the config. `pi --no-guard` bypasses the guard for one session, and `enabled: false` in a config switches it off.

## Every Tool call is judged

Core Tools (`read`, `write`, `edit`, `grep`, `find`, `ls`, `bash`, `powershell`) are mapped to what they touch. A Tool contributed by another package is read from its advertised parameter schema: a field named like a path (`path`, `file`, `files`, `dir`, `directory`, `root`) is a claim. When the guard cannot tell whether such a Tool reads or writes that path, it judges the claim against **both** the read and the write rules and says so in the refusal; a session-start notice lists every Tool whose access was inferred, so a stricter-than-needed classification can be corrected in `tools`.

A Tool whose paths cannot be determined at all — including a Tool that touches no filesystem paths — is **refused**, not allowed. Declare it in `tools`:

```json
{
  "tools": {
    "format_md_tables": { "fields": ["path"], "access": "write" },
    "mermaid_lint": { "fields": ["path"], "access": "read" },
    "some_pathless_tool": { "fields": [], "access": "none" }
  }
}
```

`access` is `"read"`, `"write"`, or `"none"`. A declared override that matches no path in the call is also refused, so a misspelled field cannot fail open.

## Fail closed

An invalid config, a missing runtime dependency (`ripgrep` on macOS and Linux; the package needs Node >= 20.11), an unsupported platform, or a sandbox that has not started all refuse the call with a reason. A refusal is a statement about the policy, not a bug in the call: read it — it names whether the path failed `denyRead`, `denyWrite`, or `allowWrite`, which domain is not in `allowedDomains`, or that the Tool is unmapped.

## How denials surface

- **Subprocess** filesystem denials surface as `EPERM` / `operation not permitted`; an unlisted domain is refused by the guard before the command runs. Switching interpreter or wrapper changes nothing — **hand the exact command to the user** to run in their own unguarded terminal, and surface the path or domain so they can widen the config.
- **Agent venues are not escape hatches.** Subagents and background agents run under the same guard — dispatching to them changes nothing. A Herdr pane (`herdr pane run`, `herdr agent start`) or any non-pi agent runs outside it: those processes are started by the Herdr server, not the wrapped shell. Routing a blocked command into another pane or agent is a bypass; the user hand-off above is the only path.
- **Not every block is this fence.** Heredoc rejections (`heredoc form or stdin consumer is not supported safely`, `Unsupported heredoc syntax`) and `rm -rf`-style rule blocks come from CC Safety Net's command analyzer, not the sandbox — heredocs and multi-line commands run fine under this fence. Load the `cc-safety-net` skill for those.

## Background servers and ports

Every shell command runs as its own sandboxed process group: the runtime spawns it detached and kills the whole group on timeout or abort, so a command can clean up its own children. A process that outlives its command sits outside that group, and a later command must not rely on being able to signal it. Start processes so nothing needs to reach across commands:

- **Same-command lifecycle** — start the server in the background, use it, and kill it within one bash call; killing own children works.
- **Self-terminating wrapper** — a process that must outlive its starting command (dev server, watcher, long build) runs under an alarm — a self-signal — so a crashed or timed-out command cannot leak a squatter; its log file is the only channel back:
  ```bash
  perl -e 'alarm shift; exec @ARGV' 900 npx next dev -p "$PORT" > /tmp/dev.log 2>&1 &
  ```
- **Restart = fresh instance** — to pick up changes, start a new instance on a freshly probed port (`python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])'`, or parse the port the server actually bound from its log) and let the old one die on its alarm. A 200/404 on "your" port may be a stranger's server: prove ownership before trusting it.
- A squatter you did not start: identify it, then hand `kill <pid>` to the user.
