---
name: cc-safety-net
description: Boundary and CLI guidance for the global CC Safety Net pre-tool guard and the strict pi-sandbox. Use when a tool is blocked or denied, when running `npx -y cc-safety-net`, or to know which reads and writes are allowed.
---

# CC Safety Net & Sandbox guidance

A strict sandbox (pi-sandbox) and a CC Safety Net pre-tool guard are active for **every** agent, including subagents and background agents. This skill states the boundary and how to use the CLI. Do not treat it as advice to bypass anything — the restrictions are enforced at the OS and tool level.

## Boundary

- **Reads** are limited to the current project and `~/.pi/agent/skills`. Reads of anything else are denied (non-interactive runs auto-deny after ~1 ms).
- **Writes** are limited to the project, `/tmp`, `~/.npm`, and `~/.cc-safety-net`.
- CC Safety Net hard-blocks destructive commands, git-history mutation, and secrets (SSH keys, `.env`, `~/.aws`, and similar). These cannot be overridden, even by an allow rule.

## When a tool is blocked

- A block is **silent** and audit-logged; the only visible signal is the tool's returned `block` reason.
- **Never try to bypass a denial** — no shell wrappers, no path shadowing, no argument reordering, no interpreter one-liners. If a path is genuinely needed, report it so an owner can add it to the allow-list.

## CLI

- Read-only / audit: `npx -y cc-safety-net status`, `logs`, `rule list`, `rule verify`, `rule doc`.
- Write (`rule sync`, `rule add`) only after the user asks.
- Never edit `~/.cc-safety-net/policy.json` directly; CC Safety Net blocks it anyway.
