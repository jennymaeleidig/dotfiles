## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Domain docs

Two contexts, one per split domain: `CONTEXT.md` at the repo root (config — Machine Configuration) and `dot_pi/CONTEXT.md` (pi config — Agent tooling). `CONTEXT-MAP.md` at the root points at each of them. Read the one relevant to the topic; read both for cross-cutting work. Decisions live in `docs/adr/`. See `docs/agents/domain.md`.

### Applying state

Applying is the user's job. The guard fences target state on both sides — `allowWrite` excludes most host paths, and `denyRead` covers the home root while `allowRead` re-allows named roots but not the home root itself, so `chezmoi apply`, `diff`, and `status` all fail at the first `lstat` of a home-root file (`~/.aerospace.toml`), dry run included. Stage the source and hand the user the command; work source-side yourself with `chezmoi managed`, `target-path`, `source-path`, and `execute-template`.

### Coding standards

Same split: `CODING_STANDARDS.md` at the repo root (config) and `dot_pi/CODING_STANDARDS.md` (pi config).
