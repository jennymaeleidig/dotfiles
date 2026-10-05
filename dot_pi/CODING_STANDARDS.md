# CODING STANDARDS

Standards for the pi config domain (`dot_pi/`), split from the root
`CODING_STANDARDS.md` (Machine Configuration); read the one on your topic, both
for cross-cutting work. See `docs/agents/domain.md`.

## Shared gotchas

- Skill paths are `~/.pi/agent/skills/<name>/SKILL.md` — never `~/.agents/skills/…`.
- Which package owns a tool name is decided by extension load order at `session_start`, not by the settings — the last package declared in `packages` runs last, and its tool claims stick. `PI_FFF_MODE=override` in `dot_bash_exports.tmpl` is why pi-fff claims `find`/`grep`/`multi_grep` and why no `fffind` exists in a session.

## Agent-facing docs

- Prune `dot_pi/agent/APPEND_SYSTEM.md` with the `writing-for-agents` levers on every edit, deleting whole sentences rather than trimming words. It is injected into every session, so nothing can be disclosed behind a pointer and an always-injected bullet earns its bytes only when it changes behaviour in a session that reads nothing else.
