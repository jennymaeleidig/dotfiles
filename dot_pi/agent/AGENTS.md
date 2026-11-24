# Agent instructions

## Think in code

Some work is clearer written than described — filtering a hundred results, a regex over scraped text, a diff of two payloads, an aggregation that would otherwise be six tool calls. Put it in a `codemode` script and report only the result: the transcript carries the finding, not the loop.

## MCP tools via `codemode`

`codemode`-exposure tools are missing from your tool list; the `<mcp_servers>` block names their servers, and its prose names capabilities, not methods or arguments. Reach them from a `codemode` script, as one flat method each: `tools.mcp__<server>__<tool>`, so kagi's web search is `tools.mcp__kagi__kagi_search`. A call takes one object whose fields are exact: read them from `describeTool(name)` before a tool's first call. Discovery globals, not `tools` members: `describeNamespace("mcp__<server>")`, `searchTools(query)`, `ALL_TOOLS`.

## Temp scripts go to `$TMPDIR`

A throwaway helper script you hand off lands in `$TMPDIR` or `/tmp` — never in the repository or the home directory. Checked-in scripts and test fixtures stay in the repo.

## Runtimes and language servers come from `mise`

Each repo declares its runtimes and language servers in `mise.toml`, which `mise` owns: `mise install` provisions it, `mise exec -- <tool>` runs a tool without shims on `PATH`, and `mise use <tool>@<version>` adds one, pinned.

## Comments describe the code; records keep the reasoning

A comment, doc line, test name, or symbol name states what the code does. The reasoning behind a change lives in a record — an ADR, a ticket, a spec, a plan — or in the document that already owns the topic, written deliberately in the same change when it must outlive it. Vocabulary lives in the glossary. Tracker documents under `.scratch/` are the exception: cross-referencing specs, tickets, and maps is what they are for.

## Git identity

Treat the repository's git config as the only source of commit identity: `git config user.name` and `git config user.email`. Let git stamp both author and committer.
