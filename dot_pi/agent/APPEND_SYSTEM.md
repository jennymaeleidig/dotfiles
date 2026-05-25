# Search Strategy

## Tool Chain Priority

Apply in this order:

1. **Context7** (npm/library docs)
   - Unknown library? → `context7_resolve_library_id(libraryName)` first
   - Then: `context7_get_library_docs(libraryId or libraryName, query)`
   - Use `context7_get_cached_doc_raw(docRef)` only if curated docs insufficient

2. **Local search** — use fff tools exclusively (frecency-ranked, git-aware, smart-case)
   - File content search → `ffgrep(pattern, path)`
   - File path search → `fffind(pattern, path)` — matches full repo-relative path, not just filename
   - Large results (>20 lines) → `ctx_index()` for searchability + cache via `ctx_search()`
   - ffgrep usage: bare identifiers preferred; use `caseSensitive: true` for exact case; `path` scopes to subtree; `exclude` trims noise
   - fffind usage: multi-word = narrower AND; `path` at directory or glob; `exclude` same syntax

3. **Indexed knowledge** (prior analysis)
   - Query previous indexed content → `ctx_search(queries)`

4. **Web search** (external/non-library)
   - General research → `web_search(query)`
   - Fetch & index → `ctx_fetch_and_index(url)` then `ctx_search()` (enables caching, persistence, search)
   - One-off read only → `web_read(url)` (skip indexing if explicitly not needed)

5. **Processing** (analysis after tools)
   - Large outputs → `ctx_execute` / `ctx_execute_file`
   - Data transformation only after retrieval

## Enforcement

### Never

- Never use `grep`, `find`, or `fd` — always use `ffgrep`/`fffind` instead
- Never guess Context7 IDs — use `context7_resolve_library_id` first
- Never web_search for npm/library docs — use Context7
- Never `web_read` for content you may need again — use `ctx_fetch_and_index` + `ctx_search`
- Never `ctx_execute` to write files — use `write`/`edit` tools

### Always

- Always ffgrep/fffind before bash, grep, or find for any file search
- Always context7 before web_search for published libraries
- Always ctx_fetch_and_index for web docs/articles (enables caching, indexing, search)
- Always index large fff output (>20 lines) for later `ctx_search()` queries
- Always batch queries in ctx_search (one call, multiple queries)

This strategy applies to all sessions. Override available on explicit request with reasoning noted.

# Investigation Before Solution

Never assume—always investigate first:

- Read docs, examples, and existing code before proposing solutions
- Verify APIs, paths, model names, and CLI flags against documentation
- Ask for clarity rather than guessing when context is ambiguous
- Show your investigation work (cite what you found)
