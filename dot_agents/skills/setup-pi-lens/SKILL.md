---
name: setup-pi-lens
description: Set up language servers (LSP) for a repository. Use when initializing LSP, when a language has no diagnostics or navigation, when adding a language, or when a server resolves the wrong project root or the wrong launcher.
---

# LSP setup

This skill changes configuration only. Host mechanics — config files, discovery order,
overrides, how to read the selected state — live in [hosts/pi-lens.md](hosts/pi-lens.md); read
it first.

## Choose install ownership

Default to **project-local**: a devDependency with a lockfile entry, so a fresh clone resolves
the same server. When the repo or user instructions name a runtime manager (mise, asdf, nix)
as owner of runtimes and language servers, that manager owns them instead of a project-local
package. The machine manifest tracks `latest`; a repo that needs reproducible versions pins
them in its own manifest, which overrides the machine default.

## Wire the host

Write only what differs from the host default: ignore build and asset directories, declare
custom servers for uncovered extensions, and set `serverOverrides` — per-field values merged
over the built-in definition, so an override replaces the launcher without re-declaring
extensions or root markers.

Make a runtime manager the launcher with a `command` override in the machine config
(`~/.pi-lens/config.json`); a manager on PATH does not own a server by itself, because a
project-local binary wins before PATH:

```jsonc
{
  "lsp": {
    "serverOverrides": {
      "toml": { "command": ["mise", "exec", "--", "taplo", "lsp", "stdio"] }
    }
  }
}
```

A project override (`.pi-lens.json`) is only for a repo whose launcher or args differ from the
machine default; duplicating the machine default buys nothing.

Do not override `typescript`: the host's JS/TS launch order chooses its launcher.

## Anchor the root

Place the marker that anchors the server's project root (`tsconfig.json`, `pyproject.toml`,
`go.mod`, ...). For monorepos, one marker per subproject, not one at the top. After adding or
changing a root marker or an override, restart the pi session — a running server keeps its
root and initialization options.

## Verify

Query `lens_diagnostics` (`source: "lsp"`) on files of each language and confirm findings carry
the intended server's tag. Silence is never clean: report each language as verified,
`unsupported`, or still silent with its reason.
