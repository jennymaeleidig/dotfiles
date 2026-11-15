# Troubleshooting

Diagnose before editing config. Each symptom below has one likely cause; confirm it first.

## The server did not run

| Symptom | Cause | Fix |
| --- | --- | --- |
| `spawn-failed` | the binary launched and exited, or pi refused to launch it | read the refusal: project-code servers need project trust |
| `tool-not-found` | no binary resolved | install it project-locally, or run the host's managed install |
| `unavailable` | a server is defined but did not answer: failed launch, or a disabled primary | check `lsp.disabledServers` and the launch failure |
| `unsupported` | no definition covers that extension | record it as `unsupported`; do not substitute a runner's green result |
| `too_large` | the file exceeds the host's per-file query limit | probe a smaller file; the server never saw this one |
| a finding appears but its tag is a runner | the dispatch runner answered, not LSP | read the host's primary LSP findings, or probe with a language the runner cannot cover |

## The server runs but sees nothing

- **Wrong root.** A server started at a file's directory ignores the project. Add the root
  marker listed in [servers.md](servers.md), then restart the host; a warm server keeps
  its old root.
- **No project config.** A `jsconfig.json` without `checkJs`, a TS project without
  `tsconfig.json`, or an uninstalled dependency all produce zero diagnostics rather than
  a loud failure.
- **Trust.** Project-supplied `command`, `args`, `extensions`, `rootMarkers`, `env`,
  `initializationOptions`, `covers`, `enabled`, and `role` need project trust. On a custom
  server entry they are refused and the entry is disabled; on a built-in override they are
  dropped and the global value still runs. Mark the project trusted and restart.
- **Stale server.** Configuration changes apply to the next server launch. Idle eviction is
  the only in-session reset; otherwise restart the session.

## The finding is noise

- **Ignore rules do not filter explicit-path queries.** A probe on an "ignored" file still
  reaches the server. Ignore is for workspace scans, not a guarantee of safety.
- **Vendor and generated files.** Exclude them in host config, not by deleting diagnostics
  after the fact.
- **`checkJs` dust.** Turning on real checking surfaces genuine errors plus implicit-any
  hints in JS. Fix the errors; do not turn checking back off to hide them.

## Language-specific traps

- **Shell.** `bash-language-server` refuses the zsh dialect. `.zsh` belongs to `shuck`;
  without it zsh is `unsupported` for LSP, though the shellcheck runner may still lint it. A
  `.sh` file with a zsh shebang follows the same rule.
- **TypeScript 7.** A project `tsc --lsp` or `@effect/tsgo` replaces `typescript-language-server`.
  If navigation and diagnostics disagree, confirm which launch won in `/lens-health`.
- **Python.** pyright launches from the project's virtualenv, not the one running the host.
  A missing `.venv` silently falls back to the managed install.
- **Rust, Elixir, Nix, C#, Swift, and every server marked `trust` in
  [servers.md](servers.md).** These execute project build code at startup; without trust they
  are refused, not broken.
- **C/C++.** clangd without `compile_commands.json` resolves includes poorly; generate it or
  point clangd at a `compile_flags.txt`.

## Before declaring failure

1. The file is tracked and inside the repo, not a temp path outside the host's `cwd`.
2. The probe contains exactly one error, and the error is one the server classifies as a
   diagnostic, not a warning it suppresses.
3. The outcome line says `findings` or `clean`, and the tag names the server that answered.
