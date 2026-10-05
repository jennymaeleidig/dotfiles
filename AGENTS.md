## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Domain docs

Two contexts, one per split domain: `CONTEXT.md` at the repo root (config — Machine Configuration) and `dot_pi/CONTEXT.md` (pi config — Agent tooling). `CONTEXT-MAP.md` at the root points at each of them. Read the one relevant to the topic; read both for cross-cutting work. Decisions live in `docs/adr/`. See `docs/agents/domain.md`.

### Applying state

Applying is the user's job — repo policy, not an enforced fence. The OS sandbox is gone; `cc-safety-net` (tool-layer, command-pattern based) is the only guard left. Stage the source and hand the user the apply command; work source-side yourself with `chezmoi managed`, `target-path`, `source-path`, and `execute-template`.

### Coding standards

Same split: `CODING_STANDARDS.md` at the repo root (config) and `dot_pi/CODING_STANDARDS.md` (pi config).
