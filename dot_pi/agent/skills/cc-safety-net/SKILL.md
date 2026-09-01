---
name: cc-safety-net
description: Boundary and CLI guidance for the global CC Safety Net pre-tool guard — secrets access, destructive commands, git-history mutation, and its rule allow-lists. Use when a tool is blocked with a safety-net reason, when running `npx -y cc-safety-net`, or when its rules are discussed. For filesystem/network denials and permission prompts, use the pi-sandbox skill.
---

# CC Safety Net guidance

A CC Safety Net pre-tool guard is active for **every** agent, including subagents and background agents. This skill states what it guards and how to use the CLI. Do not treat it as advice to bypass anything — the restrictions are enforced at the OS and tool level.

## Boundary

CC Safety Net hard-blocks secrets access (SSH keys, `.env`, `~/.aws`, and similar), destructive commands, and git-history mutation. These cannot be overridden, even by an allow rule.

The filesystem and network fence is a different guard — the pi-sandbox extension. See the `pi-sandbox` skill for that boundary, its config, and how its denials and permission prompts work.

## When a tool is blocked

- A block is **silent** and audit-logged; the only visible signal is the tool's returned `block` reason.
- **Never try to bypass a denial** — no shell wrappers, no path shadowing, no argument reordering, no interpreter one-liners. If a path is genuinely needed, report it so an owner can add it to the allow-list.

## CLI

- Read-only / audit: `npx -y cc-safety-net status`, `logs`, `rule list`, `rule verify`, `rule doc`.
