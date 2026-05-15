---
name: search-strategy
description: Enforces local-first search with fff tools (ffgrep, fffind) for codebase queries, and web_search/web_read for external research. Ensures consistent tool selection.
source: custom
---

# Search Strategy Skill

This skill enforces a consistent search strategy:
- **Local codebase searches** → Always use `fff` tools (ffgrep, fffind)
- **External research** → Always use `web_search` or `web_read`
- **Indexed content** → Use `ctx_search` to query prior indexed knowledge

## Decision Tree

### When User Asks to Search

```
┌─ "Find X in this repo/project/files"
│  └─> Use: ffgrep or fffind
│
├─ "Search for files named X"
│  └─> Use: fffind (fuzzy path search)
│
├─ "Grep for pattern X"
│  └─> Use: ffgrep (smart-case regex)
│
├─ "Look up X on the web / documentation"
│  └─> Use: web_search (multi-backend)
│  └─> Then: web_read(url) for specific pages
│
└─ "Search previous context/indexed KB"
   └─> Use: ctx_search (queries array for batch)
```

## Tool Reference

### Local Search (fff tools)
- **ffgrep**: Search file contents
  - Smart-case (case-insensitive for lowercase patterns)
  - Regex support auto-detected
  - Context lines, limit, exclude options
  - Best for: code patterns, error messages, TODOs, imports

- **fffind**: Fuzzy path search
  - Matches full repo-relative paths (not just filenames)
  - Fuzzy multi-word matching (AND semantics)
  - Frecency-ranked (most-accessed first)
  - Best for: finding files by name/concept, locating components, module discovery

### Web Search (external research)
- **web_search**: Query the web
  - Multi-backend support (DuckDuckGo, Perplexity, etc.)
  - Use combine=true for parallel backend queries
  - Best for: current events, API docs, library versions, implementation patterns

- **web_read**: Fetch specific URL
  - Converts HTML → Markdown
  - Keywords parameter for relevance filtering
  - objective parameter for targeted extraction
  - Best for: reading specific docs, GitHub raw files, blog posts

### Context Search (indexed knowledge)
- **ctx_search**: Query previously indexed content
  - Batch all questions in one call
  - Supports source filtering
  - Best for: retrieving already-fetched documentation, prior analysis

---

## Examples

### ✅ Correct Usage

**Looking for imports of a module:**
```
ffgrep("import.*lodash", "src/")
```

**Finding a component file:**
```
fffind("Button component", "src/**/components/")
```

**Researching how to use a library:**
```
web_search("React useEffect hook best practices 2024")
web_read(url, objective: "how to cleanup subscriptions")
```

**Checking indexed docs later:**
```
ctx_search(queries: ["useEffect cleanup", "subscription patterns"])
```

### ❌ Anti-Patterns to Avoid

- ❌ Using `bash` + `grep` for codebase search (use ffgrep)
- ❌ Using `bash` + `find` for file lookup (use fffind)
- ❌ Using `web_read` without first `web_search` (don't guess URLs)
- ❌ Searching web for local project files (use fff tools)
- ❌ Using `ctx_execute` for large grep output (use ffgrep directly)

---

## Integration with context-mode

This skill works **alongside** context-mode:

1. **I choose the tool** (fff vs web vs ctx_search)
2. **Tool executes** → Returns data
3. **context-mode routes** → If output >20 lines, sandboxed processing via ctx_execute/ctx_index
4. **Results enter context** → Summary only, raw data stays in sandbox

Example flow:
```
ffgrep(pattern) → 50 lines output
  ↓ (output >20 lines)
  ↓ (context-mode triggered)
ctx_execute_file() → Analyze in sandbox → Summary to context
```

---

## Session Enforcement

This skill is now part of your system prompt. When you ask me to:
- Search the codebase → I'll use fff tools
- Research externally → I'll use web_search/web_read
- Query prior knowledge → I'll use ctx_search

**Override available**: If you explicitly say "use bash grep" or "use web_search for this repo file", I'll note it but generally prefer this strategy.
