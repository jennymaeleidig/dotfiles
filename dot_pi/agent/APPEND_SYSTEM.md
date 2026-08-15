<!-- context-mode -->

# context-mode is active

Use `ctx_*` tools. The extension injects routing rules — follow them.

<!-- Note for Pi users: if this project also has CLAUDE.md, Pi.dev reads both files and duplicates routing instructions in context — remove one. -->
<!-- context-mode -->

# Tool inventory & usage rules

## File & shell
- `hypa_read` — read files: text slices (offset/limit, 2000-line/50KB cap) + images as vision. THE file reader — never cat/head/tail via shell.
- `hypa_shell` — every shell command, compressed output.
- `hypa_grep` — content search (ripgrep). `hypa_find` — name/path search. `hypa_ls` — listings.
- `write` — create/overwrite files; auto-creates parent dirs.
- `replace` — surgical line edits. Anchors = bare 3-char hash from read output, NEVER line content. Tightest range that changes. One call per file per message; verify post-edit diff.
- `undo_last_replace` — call immediately when a diff removes lines meant to keep.

## Discovery funnel (read-before-edit)
- `symbol_search` — rank candidate files by identifier (BM25). First step of every lookup.
- `project_report` — orient: hubs, entry points, layering violations, risk hotspots, dead weight. `view: compact` cheapest.
- `module_report` — file outline: symbols, who-uses-this, blast radius, call graph. Prefer before full read.
- `read_symbol` — one symbol body (marks read-guard). `read_enclosing` — smallest enclosing symbol/callback for a line.
- `pi_lens_activate_tools` — activate ast_grep_search / ast_grep_replace / ast_grep_outline / ast_grep_dump / lsp_navigation / lens_diagnostic_mark; usable next turn.
- ast-grep = structural search/rewrite; lsp_navigation = definition/references/rename/call hierarchy.

## Diagnostics (before done)
- `lsp_diagnostics` — LSP errors/warnings, run BEFORE builds.
- `lens_diagnostics` — ALL runners (LSP + tree-sitter + ast-grep + linters + knip/jscpd/madge/gitleaks/govulncheck). `delta` = this turn (instant); `all` = session-edited files (cheap); `full` = expensive project-wide sweep.

## Fast search (ff\*)
- `ffgrep` — frecency-ranked git-aware content match; prefer bare identifiers, use path/exclude to scope.
- `fffind` — fuzzy whole-path search; glob for exact names.

## Export
- `preview_export` — markdown/latex → PDF/HTML/PNG artifact.

## Context7 (cap 3 calls per question)
- `resolve-library-id` FIRST, then `query-docs` — up-to-date library docs. 3-call cap total.

## ctx\_\* routing (enforced)

Think-in-Code, hard rule: file bytes and raw output never enter conversation — only what code `console.log`s. Derive in the sandbox, print summaries.

- `ctx_execute_file` — analyze ONE file without reading it: FILE_CONTENT in sandbox, print derived answer. Mandatory for know-something-about-a-file.
- `ctx_execute` — derive from raw data (counts, filters, aggregates, parses, digests) instead of consuming it.
- `ctx_batch_execute` — 3+ related commands in ONE round trip: labels, concurrency 2-8 for I/O-bound; CPU/stateful (builds, tests) stays concurrency 1. Pass `queries` to get matched sections inline.
- `ctx_fetch_and_index` — web docs/research: fetch → index under source label → recall via `ctx_search`.
- `ctx_index` — persist docs, API refs, READMEs for later search.
- `ctx_search` — unified recall over indexed + session memory. Batch ALL questions in one call. `sort: timeline` for prior sessions; `contentType: code|prose` to filter.
- `ctx_stats` — check consumption BEFORE worrying about context limits.
- `ctx_doctor` — on ctx tool failure. `ctx_upgrade` — returns a command to run; tell user to restart after.
- `ctx_purge` — destructive wipe; only on explicit user request naming a scope (project or sessionId), confirm required.
- `ctx_insight` — dashboard launcher, not Q&A; questions go to `ctx_search`.

Priority when choosing: batch > execute > execute_file > search. Raw-reading data you mean to derive from is the failure mode.