# dot_pi

Source for `~/.pi`, the pi coding agent's home. What lands here is what pi loads
at session start, so this tree describes the agent's environment rather than the
dotfiles repo around it.

## Roles

`agent/agents/*.md` are roles for the `subagent` tool. Frontmatter carries
`name`, `description`, and `tools`; the body is the child's system prompt. A
repository's own `.pi/agents/*.md` wins over a user role of the same name.

`tools` is an allowlist with `*` patterns, and `-name` subtracts. Leaving the MCP
tools out keeps every configured server reachable from `codemode` scripts; the
moment one entry starts with `mcp__`, the list filters MCP servers down to the
ones it names.

## Tools, packages, and models

`agent/settings.json` holds `defaultTools` and `packages`. The package list is
what pi materializes into `agent/npm/` on the host. `agent/tools-config.json`
disables tools outright — `bash`, `edit`, and `write` are off, so no role can
reintroduce them.

## MCP

`agent/mcp.json` configures servers, their `exposure`, and per-tool exposure
overrides. With `codemode` exposure plus `codemode.mode: "only"`, MCP tools are
not declared to the model at all: they are called from scripts as
`tools.mcp__<server>__<tool>`.

## Skills

`agent/skills.symlink` links the host skills directory rather than copying it.
Package-provided skills are materialized by pi at startup and have no Source
counterpart.

## Subagent routing

`agent/tinysubagent.jsonc.tmpl` renders from `.chezmoidata.toml`. Change the data,
not the rendered file.

## Extension settings

Extensions that ship a settings panel write `agent/extension-settings/<name>.json`.
A few keep a single JSON directly in `agent/`: `pi-usage.json`,
`pi-auto-compact.json`, `compact-transcript.json`.

## Runtime state

pi writes these on the host, and none of them belongs in this tree:
`agent/npm/`, `agent/git/`, `cache/`,
`agent/extensions/herdr-agent-state.ts`, and the materialized `agent/skills/`.

## Verify

```sh
chezmoi managed | command grep '^\.pi/'
```
