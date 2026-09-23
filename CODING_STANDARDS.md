# CODING STANDARDS

# No absolute home paths in managed files

A file that chezmoi applies to the host must reach the home directory through `~`, a
`{{ .chezmoi.homeDir }}`-style template value, or a chezmoi variable — never a hardcoded
`/Users/jennyleidig/...` path. Hardcoded home paths are a violation in any `dot_*` file, template, or
script under `.chezmoiscripts/`.

# .chezmoiignore uses explicit entries only

`.chezmoiignore` lists source-only artifacts and runtime state one path per line. A blanket pattern
such as `*.md` is a violation: it would swallow applied markdown, including the authored agent skills
under `dot_pi/agent/skills/`. New source-only artifacts get their own entry.
