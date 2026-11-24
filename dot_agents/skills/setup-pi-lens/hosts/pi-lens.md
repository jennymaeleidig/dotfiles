# Host adapter: pi-lens

pi-lens launches language servers itself; there is no separate LSP client to configure. The
registry is the authority for server ids, extensions, and root markers. `lsp.enabled` is on by
default (`--no-lsp` turns it off for a session, and it is global-only — a project file cannot
set it).

## Config files

| File | Scope | Holds |
| --- | --- | --- |
| `~/.pi-lens/config.json` | machine | defaults for every project |
| `.pi-lens.json` | project | overrides, merged per field; nearest file wins |

All LSP settings live under an `lsp` namespace:

```jsonc
{
  "lsp": {
    "disabledServers": ["typos"],
    "warmFiles": ["src/main.rs"],
    "servers": {
      "my-lsp": {
        "name": "My LSP",
        "extensions": [".myext"],
        "command": ["my-lsp-server", "--stdio"],
        "rootMarkers": ["my.toml"],
        "covers": ["my-runner"]
      }
    },
    "serverOverrides": {
      "rust": { "initializationOptions": { "check": { "command": "clippy" } } }
    }
  }
}
```

- `command` is a bare program (launched with `args`, default `["--stdio"]`) or an argv array
  whose first element is the program. A custom entry without `extensions` is never selected.
- `rootMarkers` accept `*` globs and subdirectory patterns (`*.csproj`, `tools/*.toml`); the
  nearest ancestor containing one is the root.
- `covers` names dispatch runners the server subsumes, so the runner reports
  `covered-by-primary` instead of double-reporting (e.g. `covers: ["shellcheck"]`).
- `lsp.disabledServers` is a denial: a project may add an id, none may remove one.
- `initializationOptions` take the server's own shape; pyright wants
  `{ "python": { "analysis": { "typeCheckingMode": "strict" } } }`, rust-analyzer reads it flat.
- `warmFiles` opens entry files at session start (e.g. `src/main.cpp` for clangd). Put it under
  `lsp` in either config file. `.pi-lens/lsp.json` is a legacy path: it still works, warns
  (`PILENS_CFG_0003`), and is slated for removal.

Project-supplied `command`, `args`, `extensions`, `rootMarkers`, `env`, `initializationOptions`,
`covers`, `enabled`, and `role` apply only when pi trusts the project. On `lsp.servers`, an
untrusted entry that sets one is disabled rather than launched on a merged config. On
`lsp.serverOverrides`, those fields are dropped and your global override, or the built-in
default, still runs. The reason lands in the `lsp-registry-decision` record and in
`/lens-health`.

## Discovery and ownership

Server binaries resolve in this order: the project's `node_modules/.bin`, then PATH, then
pi-lens managed installs under `~/.pi-lens/tools`. An uninstalled server with a managed
installer triggers an interactive install prompt; toolchain-bundled servers (Lean's `lake`,
`gopls` from `go install`) are PATH-only and never installed by the host.

JS/TS launch order: project `@effect/tsgo` when the nearest TypeScript is 7+, then project
`tsc --lsp` (TypeScript 7+), then `typescript-language-server`. The first two need project
trust and never install anything.

### Owner-managed launchers

A project-local `node_modules/.bin` wins before PATH, so a runtime manager on PATH does not own
a server by itself. Make the manager the launcher with a machine-config override. The id,
extensions, and root markers stay; the override replaces the whole argv, its server arguments
included:

```jsonc
{
  "lsp": {
    "serverOverrides": {
      "toml": { "command": ["mise", "exec", "--", "taplo", "lsp", "stdio"] },
      "marksman": { "command": ["mise", "exec", "--", "marksman", "server"] }
    }
  }
}
```

The manager reads its project config from the server's cwd (the project root). The override
bypasses pi-lens's discovery order entirely: the project's `node_modules/.bin`, `PATH` (except
for `mise` itself), and the pi-lens managed install are not fallbacks. Mise precedence:

1. nearest repo `mise.toml` / `mise.local.toml`
2. global `~/.config/mise/config.toml`
3. system mise config
4. inherited `PATH` for a command mise does not manage

Only overridden ids take this path; every other id keeps the discovery order above. Built-in
ids and args: `toml` (`lsp stdio`), `marksman` (`server`), `bash` (`start`), and
`yaml`/`json`/`css`/`html` (`--stdio`). Do not override `typescript`: the JS/TS strategy above
chooses its launcher, and an override removes that choice.

Put these in `~/.pi-lens/config.json`; a project override is only for a repo whose launcher or
args differ from the machine default. Duplicating the machine default buys nothing: a trusted
duplicate restates the machine value, and in an untrusted repo its launcher fields are dropped
while the machine override still runs.

## Read the selected state

| Question | Surface |
| --- | --- |
| Which servers are warm, what degraded | `/lens-health` (slash command) |
| Which server produced a finding | the finding's `[source]` tag — the server's diagnostic source (`[Pyright]`), not the registry id |
| Which operations this server supports | `lsp_navigation` with `operation: "capabilities"` |
| Why a server was or was not selected | `/lens-health`, then the `lsp-registry-decision` record |

`effective_config` answers the last question per file with provenance, but it is a model-facing
tool and may be disabled in the user config; `/lens-health` works regardless.

## Probe

```json
lens_diagnostics { "source": "lsp", "scope": "paths",
                   "paths": ["probe/bad.ts"], "waitMs": 20000, "severity": "all" }
```

Read the outcome line, not the finding count:

| Outcome | Meaning |
| --- | --- |
| `findings=N` | the server answered; confirm each finding's tag names the intended server |
| `clean=N` | the server positively confirmed a clean file (pull servers, versioned pushes) |
| `inconclusive` | the server stayed silent; for push-only silent-on-clean servers this is normal and **not** clean |
| `unavailable` | a server is defined but did not answer (failed launch, disabled primary) |
| `unsupported` | no definition covers that extension |
| `failed` | the server started but the check failed |
| `too_large` | the file exceeds the host's per-file query limit; the server never saw it |

A finding tagged with a dispatch runner (`[shellcheck]`, `[biome]`) is not LSP attribution. A
project `tsc --lsp` is an LSP launcher, so its findings are attribution even when tagged `[tsc]`.

## Restart rules

A running server keeps its root and initialization options. After adding or changing a root
marker, a custom server, a `command` override, or `initializationOptions`, restart the pi
session before re-probing. Idle servers are evicted after 20 minutes without edits (60 seconds
when the workspace is ephemeral), which is the only in-session reset.
