---
name: cc-safety-net
description: Boundary and CLI guidance for the global CC Safety Net pre-tool guard — secrets access, destructive commands, git-history mutation, and its rule allow-lists. Use when a tool is blocked with a safety-net reason, before touching secrets or credentials, before destructive or git-history work, when running `npx -y cc-safety-net`, or when its rules are discussed, including heredoc and stdin-consumer blocks.
---

# CC Safety Net guidance

A CC Safety Net pre-tool guard runs as a tool-layer hook for **every** pi agent, including subagents and background agents. It judges commands, it does not contain processes: it is the only guard layer in this setup.

## Boundary

On by default and owner-configurable: secret access (SSH keys, `.env`, `~/.aws`, and the credential files coding CLIs keep), destructive commands, and git-history mutation. Only catastrophic rules — wiping `/` or the home directory, deleting Git metadata — are always enforced. The agent can change none of it: `policy.json` is a protected path, writes hard-stop, and `policy apply` requires a human TTY.

## Heredocs and multi-line inline scripts

The most common blocks that are neither secrets nor destructive commands, under the `strict` preset:

- A heredoc may feed only `cat`, `tee`, `git apply`, `git commit`, `gh pr create`, `gh issue create` — sinks that read stdin as data. Anything reading stdin as a program (`python3 -`, `bash`, `sqlite3`, …) is blocked: the analyzer cannot vet interpreter stdin. Multiple heredocs, unquoted delimiters with `$`/backslash/`\` in the body, and heredocs alongside other input redirections are blocked too.
- A backtick in quoted script text (`node -e '…`template`…'`) breaks the parser's quote tracking: a later `<<` in the same text is misread as a heredoc declaration and blocks the whole command (`heredoc delimiter … was not found`) — a known parser false positive.
- The substitute for both is the temp-file pattern: write the script with the write tool, execute it as a one-liner. That is the pattern the allow-list expects, not a bypass — the block message's "restructure the command" points here.

## When a tool is blocked

- A block is silent and audit-logged; the only signal the agent sees is the returned `block` reason.
- **Hand the command to the user**: present it verbatim so they can run it in their own unguarded terminal — enforcement lives in the agent integration, not their shell.
- **Owner override is the second path**: allow-lists (`secret_protection.allow_paths`, `destructive_command_protection.allow_paths`), per-rule on/off, and the GUI — then retry. Surface the rule id or path so the owner can decide.
- **Venue is not a workaround** — but the boundary is the *integration*, not the terminal: a pi session keeps its guard anywhere, including a Herdr pane; a non-pi CLI is guarded only where its own integration is installed and enabled (`status` reports the gaps). Never route around a block.
- **Never try to bypass a denial** — no shell wrappers, no path shadowing, no argument reordering, no interpreter one-liners (one-liners are guaranteed caught only at the `paranoid` level).

## Discovery at runtime

`npx -y cc-safety-net --help` is the authority for commands and flags. Highlights: `explain "<cmd>"` (why-blocked trace), `status` (protection, level, per-integration gaps), `doctor` (self-test), `rule list` / `rule verify` / `rule doc`, `logs` (`--suspect` for false-positive triage), `gui` (the policy editor), `policy check` (agent-runnable) / `policy apply` (human-only).
