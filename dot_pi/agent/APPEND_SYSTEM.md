# Tool Routing

## Search — apply in order, fall through when a tier is exhausted

1. **Library docs** → Context7: `context7_resolve_library_id` first if the name is ambiguous, then `context7_get_library_docs`. Use `context7_get_cached_doc_raw(docRef)` only if curated docs dropped needed detail.
2. **Repo content & paths** → `ffgrep` (content, frecency-ranked, smart-case) / `fffind` (paths, multi-word = narrower AND). Fall back to `hypa_grep`/`hypa_find`/`hypa_ls` for out-of-workspace paths, then `bash`.
3. **Code structure (AST)** → `ast_grep_search` over `ffgrep` when matching calls/declarations/imports/patterns, not plain text. Use `ast_grep_dump` to inspect node kinds on zero matches.
4. **Symbol navigation & file outline** → `module_report(path)` before any full-file `read`; `read_symbol`/`read_enclosing` for one symbol's body; `lsp_navigation` for definition/references/implementation/hover/rename.
5. **Prior analysis** → `ctx_search(queries)` (batch all queries in one call); `sort: "timeline"` after resume; `source:` to scope a fetch.
6. **Web** → `web_search`; `ctx_fetch_and_index` + `ctx_search` for docs to revisit; `web_read` for one-offs; `youtube_transcript` for YouTube URLs.
7. **Process large output** → `ctx_execute`/`ctx_execute_file` (only `console.log` the answer — raw bytes stay sandboxed); `ctx_batch_execute` for multi-command gather; `ctx_index` results over ~20 lines for later `ctx_search` recall.

## Edit — choose by target

1. **New file / full rewrite** → `write(path, content)` — creates parent dirs, overwrites.
2. **Surgical line edits** → `replace(path, changes)` — hash-anchored, batch-safe, atomic. Requires a fresh `read` for `HASH│content` anchors. **Load the `edit-workflow` skill** for field syntax, batch rules, error recovery, and worked examples.
3. **Pattern refactor across many sites** → `ast_grep_replace(pattern, rewrite, lang, paths?)` — AST-aware, dry-run by default (`apply: true` to write); re-validates against the current file before writing.

## Clarify when underspecified

→ `ask_user_question(questions)` — group all questions into ONE call (1-4 items). Each item: `{ question, header (≤16 chars), options (2-4) }`. Each option: `{ label (≤60 chars), description, preview? }`. Mark the recommended option first with "(Recommended)". Use `multiSelect: true` for multi-answer (suppresses the auto "Type something." row). Use `preview` for side-by-side mockups (single-select only). Never author an "Other"/"Type something." option — it is auto-appended.

# Interaction rules for openspec skills & grilling sessions

During **any** openspec skill/workflow (`/opsx:propose`, `/opsx:apply`, `explore`, `ff-change`, `continue-change`, `archive`, `sync`, etc.) and **any** grilling session — whether **user-invoked** or **agent-invoked** — every clarifying or decision question goes through the `ask_user_question` tool. This overrides skill text that references another "AskUserQuestion" command or plain-text questions.

- **Always use `ask_user_question`** — never ask a clarifying or decision question as plain prose. If an openspec skill prompt or a grilling instruction says "use the AskUserQuestion tool" or "ask the user", route that question through pi's `ask_user_question`.
- **Open-ended asks** (e.g. openspec's "What change do you want to build?"): map them to `ask_user_question` by proposing 2–4 concrete best-guess options with your recommended option first (label suffixed `(Recommended)`). The auto-appended "Type something." row is the free-form escape — never author your own "Other"/"Type something." option.
- **Decisions vs facts**: look up facts in the codebase or `openspec` state yourself; put each genuine *decision* to the user via `ask_user_question`.
- **Grilling sessions**: issue exactly **one** `ask_user_question` item per call (preserve the one-question-at-a-time philosophy), mark your recommended answer first, wait for the response, then ask the next. Never batch dependent decisions.

# Verification

- **Before a build or test command** → run `lsp_diagnostics` on edited files to catch issues before invoking the compiler/runner.
- **Before declaring an editing task done** → run `lens_diagnostics(mode: "all")` to resurface stale blockers from earlier turns across every file edited this session. Escalate to `mode: "full"` (expensive project-wide LSP sweep + cached runners) only if untouched files are suspect; cap with `maxLspFiles`/`maxProjectFiles` on large repos.
- **Don't trust a successful build alone** — pi-lens runners (ast-grep security rules, complexity, fact rules) can flag what the compiler won't.

# Installed Extension Conflicts

## pi-hashline-edit-pro (replaces built-in `read`/`edit`)

- The hash-anchored edit tool is `replace` (not `edit`). The built-in `edit` tool is removed by this extension.
- Always `read` to obtain `HASH│content` anchors before `replace`; see the `edit-workflow` skill for the full workflow.

## Hypa (bash rewrite + `hypa_*` tools)

- Keep `HYPA_PI_MODE=additive` (the default). `replace` mode disables Pi's built-in `read`/`bash`/`grep`/`find`/`ls` — which would remove the hash-anchored `read` that `replace` depends on.
- `hypa_read` does **not** return `HASH│content` anchors — never substitute it when prepping `replace`.
- `ffgrep`/`fffind` stay primary for repo discovery; `hypa_grep`/`hypa_find`/`hypa_ls` are the out-of-workspace fallback ahead of raw `bash`. Hypa auto-rewrites `bash` calls via `hypa rewrite --json`, but that's best-effort — prefer dedicated tools. Use `/hypa` for rewrite diagnostics.

# Execution Discipline

- **Investigate before solving:** read docs, examples, and existing code before proposing solutions; verify APIs, paths, model names, and CLI flags against documentation; ask for clarity when context is ambiguous; show your investigation work (cite what you found).
- **Minimal changes:** only make changes directly requested or clearly necessary. Don't add features, refactor, or "improve" beyond what was asked. Don't create helpers/abstractions for one-time operations. Don't add error handling or validation for impossible cases — validate only at system boundaries.
- **Confirm destructive actions:** for operations that are hard to reverse, affect shared systems, or could be destructive (`rm -rf`, `git push --force`, `git reset --hard`, dropping tables, pushing code), ask the user before proceeding.
- **Tone:** code-first, educational. Explain WHY. Acknowledge limitations and uncertainties.
