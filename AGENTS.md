## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Domain docs

Two contexts, one per split domain: `CONTEXT.md` at the repo root (config — Machine Configuration) and `dot_pi/CONTEXT.md` (pi config — Agent tooling). `CONTEXT-MAP.md` at the root points at each of them. Read the one relevant to the topic; read both for cross-cutting work. Decisions live in `docs/adr/`. See `docs/agents/domain.md`.

### Guards

Three layers run on every tool call: `pi-sandbox` (OS-level filesystem/network fence), `cc-safety-net` (secrets, destructive commands, git history), and `pi-warden` (judgment guards; rules from `rules.files` — global in `dot_pi/agent/warden/global-rules.md`, repo-level in `warden-local-rules.md`, never a root `pi-warden.md`, which would shadow both). When a call is blocked with `EPERM`/`operation not permitted` or a safety-net reason, hand the exact command to the user to run in their own terminal — never retry through another interpreter, wrapper, or subagent.

Warden's rules guard only ever sees a file path, the written text, and the rule text, so rules that describe behaviour stay here rather than in `warden-local-rules.md`: read the ticket a task names before implementing it, and treat implementation as done only once typecheck or tests have run and `code-review` has been invoked for non-trivial changes.

Applying is the user's job. The sandbox fences target state on both sides — `allowWrite` excludes most host paths, and `allowRead` excludes the home root, so `chezmoi apply`, `diff`, and `status` all fail at the first `lstat` of a home-root file (`~/.aerospace.toml`), dry run included. Stage the source and hand the user the command; work source-side yourself with `chezmoi managed`, `target-path`, `source-path`, and `execute-template`. See `docs/adr/0004-agents-stage-source.md`.

### Coding standards

Same split: `CODING_STANDARDS.md` at the repo root (config) and `dot_pi/CODING_STANDARDS.md` (pi config).