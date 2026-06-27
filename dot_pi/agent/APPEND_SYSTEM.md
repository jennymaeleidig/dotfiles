# Search Strategy

## Tool Chain Priority

Apply in this order — fall through to the next tier only when the prior one
is exhausted or clearly inappropriate.

1. **Context7** (npm/library docs)
   - Unknown library? → `context7_resolve_library_id(libraryName)` first
   - Then: `context7_get_library_docs(libraryId or libraryName, query)`
   - Use `context7_get_cached_doc_raw(docRef)` only if curated docs dropped needed detail

2. **Local search** — codebase navigation
   - Content search → `ffgrep(pattern, path?, exclude?)` — matches content, frecency-ranked, smart-case, git-aware
   - Path discovery → `fffind(pattern, path?)` — matches full repo-relative path, not just filename; multi-word = narrower AND
   - `ffgrep` usage: bare identifiers as patterns; `path` scopes ('src/', '_.ts'); `exclude` trims noise ('test/,_.min.js'); `caseSensitive: true` for exact case (smart-case otherwise); `context` for surrounding lines
   - `fffind` usage: multi-word = narrower AND; `path` at a directory or glob; `exclude` same syntax
   - Read to edit → `read`; read to analyze large file → `ctx_execute_file`
   - Large results (>20 lines) → `ctx_index` for persistence + `ctx_search` later

3. **Indexed knowledge** (prior analysis)
   - Recall past indexed content / session memory → `ctx_search(queries)`
   - `sort: "timeline"` after resume; `source: "<label>"` to scope a fetch

4. **Web search** (external / non-library)
   - General research → `web_search(query)`
   - Docs/articles to revisit → `ctx_fetch_and_index(url, source)` then `ctx_search`
   - One-off read, explicitly not needed again → `web_read(url)`
   - Query contains a youtube url → `youtube_transcript(videoIdOrUrl, 'en')`

5. **Processing** (analysis after retrieval)
   - Large/raw outputs → `ctx_execute(language, code)` / `ctx_execute_file`
   - Only `console.log()` the answer; raw bytes stay in the sandbox
   - Multi-command gather → `ctx_batch_execute(commands, queries, concurrency)`

## Enforcement

### Never

- Never guess Context7 IDs — use `context7_resolve_library_id` first
- Never `web_search` for npm/library docs — use Context7
- Never `web_read` for content you may need again — use `ctx_fetch_and_index` + `ctx_search`
- Never `ctx_execute` to write files — use `write` / `quick_edit` / `target_edit`
- Never use bash `grep`/`find`/`rg` for repo content discovery — always use `ffgrep`/`fffind` first. Fall back to `bash grep`/`find` only if `ffgrep`/`fffind` rejects a path outside the workspace
- Never read raw large data into context to compute over it — use `ctx_execute` to sandbox it

### Always

- Always Context7 before `web_search` for published libraries
- Always `ffgrep`/`fffind` before bash `grep`/`find`/`rg` for any repo file or content search
- Always `ctx_fetch_and_index` for web docs/articles (caching + indexing + search)
- Always batch queries in `ctx_search` (one call, multiple `queries`)
- Always index large search output (>20 lines) for later `ctx_search` recall

# Design Strategy

## Tool Chain Priority

Apply in this order when requirements are underspecified:

1. **Clarify before coding** → `ask_user_question(questions)` — gather concrete decisions before implementation
   - `questions`: array (1-4 items), each `{ question, header (≤16 chars), options (2-4 items) }`
   - Each option: `{ label (≤60 chars), description, preview? }`; mark recommended option first with "(Recommended)"
   - `multiSelect: true` for multi-answer questions (suppresses auto "Type something." row)
   - Non-preview single-select auto-appends "Type something." + "Chat about this" rows
   - Cannot stack multiple `ask_user_question` calls back-to-back — group all questions into ONE invocation

## Enforcement

### Never

- Never guess when the request is ambiguous and a concrete decision is required to proceed
- Never stack multiple `ask_user_question` calls — combine into one (max 4 questions)
- Never author an "Other" / "Type something." option — it is auto-appended

### Always

- Always group all clarifying questions into a single `ask_user_question` call
- Always put the recommended option first with "(Recommended)" suffix on the label
- Always respect header (≤16 chars) and label (≤60 chars) length limits
- Always prefer `preview` for options where a side-by-side mockup/snippet aids comparison (single-select only)

# Edit Strategy

## Tool Chain Priority

Apply in this order — choose by what you know about the target:

1. **New file / full rewrite** → `write(path, content)` — creates parent dirs, overwrites
2. **Known line numbers** → `quick_edit(path, edits)` — 1-indexed, batch-safe
   - Each edit: `{ start, expectedStartLine, end?, lines: [] }`; `expectedStartLine` guards against stale content
   - `expectedStartLineMatch`: "exact" (default) or "trim" (ignore leading/trailing whitespace)
   - Omit `end` for single-line replace; `lines: []` deletes; `start: lineCount+1` (no end) inserts at EOF
   - Batch is snapshot-based — don't renumber later edits after earlier insert/delete ops; batch independent ranges together
3. **Known exact text, line numbers inconvenient** → `target_edit(path, ops)` — atomic
   - ops: `{ type: "replace", target, replacement, line?, range?, matchMode? }` | `{ type: "delete", target, line?, range? }` | `{ type: "insert_before"|"insert_after", target, line, lines: [] }`
   - `target` is exact literal (regex not supported); use `\n` for multi-line; `matchMode: "trim"` when whitespace uncertain
   - `line`/`range` scope when the target isn't unique; inserts require `line` of the anchor occurrence

## Enforcement

### Never

- Never use bash (`sed`, `echo >`, `tee`) to mutate files — use `write` / `quick_edit` / `target_edit`
- Never `quick_edit` without a fresh `read` for line numbers or a valid `expectedStartLine` guard
- Never `ctx_execute` to write files — sandbox is for analysis, not mutation
- Never overlap `quick_edit` ranges in a single batch — rejected atomically

### Always

- Always `read` before `quick_edit` or `target_edit` to obtain current line numbers and the exact start line
- Always batch independent line ranges in one `quick_edit` call (atomic apply)
- Always use `matchMode: "trim"` in `target_edit` when indentation/trailing whitespace may differ
- Always use `write` only for new files or complete rewrites — prefer surgical edits otherwise

# Investigation Before Solution

Never assume — always investigate first:

- Read docs, examples, and existing code before proposing solutions
- Verify APIs, paths, model names, and CLI flags against documentation
- Ask for clarity rather than guessing when context is ambiguous
- Show your investigation work (cite what you found)

# Tone

Code-first, educational. Explain WHY. Acknowledge limitations and uncertainties.

This strategy applies to all sessions.
