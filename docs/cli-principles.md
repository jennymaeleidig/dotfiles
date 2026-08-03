# CLI Principles for Agent-Used Tools

<!-- From: Ugo Enyioha -->

## The Eight Rules

### 1. Structured output is not optional

- Support `--json`. Stdout is the API contract; progress, warnings, and spinners go to stderr.
- Flat fields over nested objects. Consistent types across commands (a number stays a number).
- One JSON object per line (JSONL) for streaming output.

### 2. Exit codes are the agent's control flow

- Document exit codes. This project's contract: `0` success, `1` general failure, `2` usage error, `3` not found, `5` conflict.
- Pair exit codes with structured error output: `{"error": "conflict", "message": "...", "existing_id": "..."}`.

### 3. Make commands idempotent

- Prefer declarative verbs (`ensure`, `apply`, `sync`) over imperative ones (`create`, `delete`).
- Re-running a completed command is a no-op, not an error.
- If a command cannot be idempotent, make the conflict detectable with a distinct exit code.

### 4. Self-documenting beats external docs

- `--help` is the tool description, parameter spec, and usage guide in one.
- Mark required vs optional flags. Include realistic examples. Document the `--json` flag.
- Support subcommand discovery (`tool --help`, `tool <cmd> --help`).

### 5. Design for composability

- `--quiet` outputs bare values, one per line, no decoration, for piping.
- Document explicit stdin acceptance (e.g. `-f -`) where supported.
- Provide batch operations instead of forcing N single calls.

### 6. Provide dry-run and confirmation bypass

- `--dry-run` produces structured output describing what would change.
- `--yes` / `--force` bypasses all prompts; an agent cannot answer a prompt.
- Detect non-interactive terminals: skip prompts or fail with a message telling the caller to pass `--yes`.

### 7. Errors should be actionable

- Structured error codes (`"image_not_found"`), not prose-only failures.
- Echo the failing input back. Suggest the next step when one exists.
- Distinguish transient errors (retryable) from permanent ones.

### 8. Use consistent noun-verb grammar

- `tool noun verb` (e.g. `git remote add`), never mixed conventions (`create-user`, `delete_user`).
- Hierarchical help turns discovery into a tree search instead of a guessing game.

## Checklist

```
[ ] --json flag for structured output
[ ] JSON to stdout, messages to stderr
[ ] Meaningful exit codes (not just 0/1)
[ ] Idempotent operations (or clear conflict handling)
[ ] Comprehensive --help with examples
[ ] --dry-run for destructive commands
[ ] --yes/--force to bypass prompts
[ ] --quiet for pipe-friendly bare output
[ ] Consistent field names and types across commands
[ ] Consistent noun-verb hierarchy (e.g., `noun verb`)
[ ] Actionable error messages with error codes
[ ] Batch operations for bulk work
[ ] Non-interactive TTY detection
```
