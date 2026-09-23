---
name: pi-sandbox-runtime
description: The filesystem and network boundary every tool operates under, enforced by the pi-sandbox-runtime extension driving @anthropic-ai/sandbox-runtime. Use before starting a dev server or any other long-lived process, when a tool call is blocked with a guard reason, when a subprocess fails with EPERM or "operation not permitted", when a Tool is refused as unmapped, or when the sandbox config or a path or domain allowance comes up.
---

# pi-sandbox-runtime boundary

[pi-sandbox-runtime](https://github.com/jennymaeleidig/pi-sandbox-runtime) puts **every Tool call and every shell command** under one policy, driving [`@anthropic-ai/sandbox-runtime`](https://github.com/anthropic-experimental/sandbox-runtime) directly. Shell commands run inside the OS sandbox (macOS `sandbox-exec`, Linux `bwrap`); every other Tool call is judged against the same policy before it runs. This is not CC Safety Net (a tool-layer command guard: secrets, destructive commands, git history — see its own skill).

## Read the boundary from the config

Read them each time, and read a grant from earlier in the session as session-scoped rather than standing. Both files are possibly absent:

- Global: `~/.pi/agent/sandbox.json`
- Project: `<project>/.pi/sandbox.json`

The project file layers over the global one: scalars and the `network` / `filesystem` sections are replaced, the six path and domain lists are **unioned**, and `tools` merges per Tool name. `enabled` is replace-not-merge. An unrecognised key is a **load error, not a shrug** — a key you believe is protection but which is ignored is worse than no protection. Keys the predecessor package wrote (`permissionPromptTimeoutSeconds`, `sandboxUserShell`, `allowBrowserProcess`, `network.allowUnauthenticatedSocksProxy`, `network.sshProxy`) are recognised, reported as ignored at session start, and not honoured. Both files are read-only to the agent.

Semantics:

- **Reads are default-allow**, except beneath `denyRead` (default `["/Users", "/home"]`). `allowRead` re-allows paths beneath a `denyRead` region. More specific wins over broader, so `allowRead` beats a broader `denyRead`, while a narrower `denyRead` beats a broader `allowRead`.
- **Writes are default-deny**: allowed only inside `allowWrite` (default nothing), and `denyWrite` wins over `allowWrite`. `allowWrite` does not by itself re-allow a read that `denyRead` still matches.
- **Symlinked roots on macOS.** The shell fence sees resolved paths, so `/tmp` is `/private/tmp` and `/var` is `/private/var`. Naming only `/tmp` lets the guard's own write check pass while a shell write is still denied at the OS level. Name both spellings for any symlinked writable root.
- **Network** — `allowedDomains` is an allow-list of real domains; wildcards such as `*.npmjs.org` are fine and `"*"` is rejected on purpose. `deniedDomains` hard-blocks regardless, and an empty `allowedDomains` allows none. Shell commands reach the network through the runtime's proxy.

With no config at all, the guard supplies `denyRead: ["/Users", "/home"]` and empty lists for everything else — nothing is writable and no domain is reachable.

`/guard` shows the guard's status, the global and project config paths it loaded, the effective policy, and any session grants; `/guard-allow <path>` admits a path and its children, `/guard-allow tool:<name>` admits a whole Tool. Grants are in-memory only and vanish when the session ends — nothing is written back to the config. `pi --no-guard` bypasses the guard for one session; `enabled: false` switches it off.

## Every Tool call is judged

Core Tools (`read`, `write`, `edit`, `grep`, `find`, `ls`, `bash`, `powershell`) are mapped to what they touch. A Tool contributed by another package is read from its parameter schema: a field named like a path (`path`, `file`, `files`, `dir`, `directory`, `root`) is a claim. When the guard cannot tell whether such a Tool reads or writes that path, it judges the claim against **both** the read and the write rules and says so in the refusal; a session-start notice lists every Tool whose access was inferred, so a stricter-than-needed classification can be corrected in `tools`. A Tool whose paths cannot be determined at all — including a Tool that touches no filesystem paths — is **refused**, not allowed. Declare it in `tools`:

```json
{
  "tools": {
    "some_path_tool": { "fields": ["path"], "access": "write" },
    "some_read_tool": { "fields": ["path"], "access": "read" },
    "some_pathless_tool": { "fields": [], "access": "none" }
  }
}
```

`access` is `"read"`, `"write"`, or `"none"`. A declared override that matches no path in the call is also refused, so a misspelled field cannot fail open.

## Refusals

The fence fails closed: an invalid config, a missing runtime dependency (`ripgrep` on macOS and Linux; Node >= 20.11), an unsupported platform, or a sandbox that has not started all refuse the call with a reason. Read it — a refusal is a statement about the policy, not a bug in the call: it names whether the path failed `denyRead`, `denyWrite`, or `allowWrite`, which domain is not in `allowedDomains`, or that the Tool is unmapped.

- **Subprocess** filesystem denials surface as `EPERM` / `operation not permitted`; an unlisted domain is refused before the command runs. Changing interpreter or wrapper changes nothing — **hand the exact command to the user** to run in their own unguarded terminal, and name the path or domain so they can widen the config.
- **Subagents and background agents run under the same guard**, so dispatching to one changes nothing. A Herdr pane (`herdr pane run`, `herdr agent start`) or any non-pi agent runs outside it — the Herdr server starts those processes, not the wrapped shell — so the user hand-off above is the only path.
- **Not every block is this fence.** Heredoc rejections (`heredoc form or stdin consumer is not supported safely`, `Unsupported heredoc syntax`) and `rm -rf`-style rule blocks come from CC Safety Net's command analyzer, not the sandbox — heredocs and multi-line commands run fine under this fence. Load the `cc-safety-net` skill for those.

## Long-lived processes

Before starting a dev server, watcher, or long build, read [`long-lived-processes.md`](long-lived-processes.md) — how a sandboxed process group outlives its starting command, and the lifecycle rules for handling that.
