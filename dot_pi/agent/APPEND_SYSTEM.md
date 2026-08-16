# Tool routing

## File search
- `grep` — content. `find` — paths. FFF-backed, frecency-ranked.
- `symbol_search` — identifier lookup, first step of every code lookup.

## Read before edit
- `module_report` (outline) → `read_symbol` / `read_enclosing` (body).

## Diagnose before done
- `lsp_diagnostics` before builds. `lens_diagnostics` before declaring done.

## Memory & web
- `ctx_search` — KB/memory recall. `web_search` — questions.
- `ctx_fetch_and_index` → `ctx_search` — docs to recall later.

## Rules
- Never `cat`/`head`/`tail` — `hypa_read` is the reader.
- Think-in-Code: derive in sandbox, print only the answer.
