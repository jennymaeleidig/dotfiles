Global judgment rules for pi-warden, shared by every repo. Managed by chezmoi at
`~/.pi/agent/warden/global-rules.md` and bound through `rules.files` in the user config
(`~/.pi/agent/pi-warden/config.json`), so it applies to every project and every agent unless a repo
shadows it with its own root `pi-warden.md`.

Each `#` heading is one rule; the text under it is what the judge reads alongside the file path and
the written text. Keep rules to what a written file can show — behavioural expectations belong in
`AGENTS.md`. No `!` negation in `paths:` lines (unsupported), and the 31-rule budget is shared with
each repo's `warden-local-rules.md`.

# No secrets in source or config
Source files, configs, and templates must not contain real passwords, API keys, tokens, or private
keys. Read them from the environment, a secrets manager, or a chezmoi template. Obviously fake
fixtures such as `test-key` or `hunter2` are fine.

# Borrowed code keeps its citation
Code, config, or a doc snippet copied or adapted from an external source — verbatim or paraphrased —
must carry a citation block naming the creator, title, source, and license above the borrowed text.
Format and required fields: see `~/.pi/agent/seed/prompts/CITATION.md`. Borrowed text with no
citation block is a violation.

# CITATION.cff stays verifiable
paths: CITATION.cff
A `CITATION.cff` change must be valid CFF, cite only fields verifiable from the source, name the
original license, and never delete existing entries. Fabricated or removed metadata is a violation.

# Temp scripts go to the OS temp directory
Throwaway helper scripts, one-off migrations, and scratch files are written to `$TMPDIR` or `/tmp`,
never into the repository or the home directory. A new `.py`/`.sh` file created inside the repo
solely to be executed once is a violation; checked-in scripts and test fixtures are fine.

# TODO comments name a ticket
A `TODO` or `FIXME` comment must name a ticket or issue, for example `TODO(APP-123): ...`. A bare
`TODO` is a violation.

# Blocked boundaries are handed to the user, not bypassed
When a command is blocked by the `pi-sandbox-runtime` guard with `EPERM`/`operation not permitted`, or by a safety-net
rule, do not retry it through a different interpreter, wrapper, subagent, or a Herdr pane to get
around the block. Report the exact blocked command to the user so they can run it in their own
terminal, and stop. Retrying a blocked operation through another venue is a violation.
