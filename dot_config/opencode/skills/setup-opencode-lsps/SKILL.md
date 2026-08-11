---
name: setup-opencode-lsps
description: Configure OpenCode LSP servers for a repo by reading the codebase — enables opencode's built-in servers (auto-started per language, so most setups need no entries) and writes a custom server only for a language the codebase shows that no built-in covers, resolved and verified with mise. Use when setting up a repo, when a language's LSP is missing, or as invoked by setup-opencode-repo.
---

# Setup LSPs

Enable opencode's built-in LSP servers and add custom ones only where the codebase proves a need. Built-ins are the default: opencode starts each built-in server when its file extension is present and its requirement is met, so most repos need no explicit server entries at all. A custom server is the exception, written only for a language the repo actually uses that no built-in covers.

## Process

### 1. Explore the codebase

Walk the repo — root layout, manifest files, file tree — and list the languages actually present (e.g. `package.json`, `*.csproj`/`*.sln`, `*.sh`, `go.mod`, `pyproject.toml`, `Cargo.toml`). Ignore `node_modules`, build output, and generated code. These are the languages whose servers need to fire.

### 2. Enable the built-ins

Set `"lsp": {}` in the repo's `opencode.jsonc` (create from `setup-opencode-repo`'s seed if absent). The empty object keeps every built-in server enabled while leaving room for overrides — no per-language entries are written for built-in coverage.

### 3. Add custom servers for the gaps

For each language the codebase shows but no built-in server covers (checked against opencode's built-in registry at setup time), plan a custom entry: command resolved from the environment (`mise which <server>` or `command -v`), plus any `env`. Show the planned entry and confirm before writing.

### 4. Verify

- Each custom server resolves through mise (e.g. `mise x -- <server> --version`); flag anything missing — `mise install` may be needed — rather than writing config for a tool that isn't there.
- The resulting `opencode.jsonc` parses as valid JSONC.

Completion: every language the codebase shows is covered by a built-in server or a runtime-verified custom entry, and no unneeded entry was written.

## Troubleshooting

- Server doesn't start: most need project context — e.g. `tsconfig.json` (JS/TS), `.csproj`/`.sln` (C#), `go.mod` (Go) — matching the built-in's requirement.
- Command not found: the mise backend syntax may differ — check `mise registry <tool>`, then `mise install`.
- Behavior doesn't change after edits: opencode reads config at startup — restart after changes.
