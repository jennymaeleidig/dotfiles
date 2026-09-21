---
name: setup-warden-rules
description: Bind a repo to the global pi-warden rules and create its local rules layer. Run once per repo before relying on pi-warden's rules guard there.
disable-model-invocation: true
---

# Setup warden rules

pi-warden judges every write and edit against a resolved rules file. There is no merge between rule
*sources*: a root `pi-warden.md` wins outright, otherwise `rules.files` is used, otherwise the first
of `AGENTS.md` / `CLAUDE.md` / `README.md`. Layering is achieved by naming both files in
`rules.files`:

- **Global** — `~/.pi/agent/warden/global-rules.md`, managed by chezmoi, bound once in the user
  config `~/.pi/agent/pi-warden/config.json`:
  `"rules": { "files": ["<abs>/global-rules.md", "warden-local-rules.md"], "skip": [".scratch/**"] }`
  Absolute paths are required (`~` is not expanded); missing entries are skipped silently.
- **Local** — `warden-local-rules.md` in the repo root, for rules that only make sense there.

Do not list `AGENTS.md` in `rules.files`. A fallback document is condensed, but a `rules.files` entry
is parsed as rules by heading, and a long `AGENTS.md` collapses into one rule of several thousand
characters — judged as a single question, riding every action request. `AGENTS.md` is where the agent
reads behavioural expectations; the judge does not need it.

That user-config binding is machine-wide and written by the user, not by this skill. Check it exists
before concluding the setup is broken.

## Process

1. **Check for a shadowing `pi-warden.md`** at the repo root. If one exists, the global file and
   `warden-local-rules.md` are both silently ignored: say so, move anything still wanted from it
   into `warden-local-rules.md`, then delete it.
2. **Create `warden-local-rules.md`** if absent, with a one-line intro and no headings (text before
   the first heading is ignored). Append the repo's rules under `#` headings.
3. **Add to `.chezmoiignore`** — in the chezmoi source repo only — if the new file lives at the
   source root, since an unlisted root file is installed into `$HOME`.
4. **Verify** with `/warden status`, which names the resolved sources and rule count.

## What makes a rule work

- The judge sees the file path, the written text, and the rule text. A rule about behaviour (did you
  read the ticket? did you run the tests?) can only ever answer `not_applicable`; put those in
  `AGENTS.md`, where the agent reads them.
- Say what a violation looks like: "must not contain X", "every X needs a Y". Taste rules judge
  poorly.
- No `!` negation in a `paths:` line — `globToRegExp` escapes `!` as a literal, so the rule silently
  matches nothing. Scope by listing the paths that *do* apply, and state exemptions in the rule
  text.
- `paths:` globs are unanchored at the start: `docs/**` also matches `dot_pi/docs/x`.
- Budget: 31 rules total per request across every file in `rules.files`, and each body is truncated
  near 400 characters. Keep the global file lean.
- Files matched by `rules.skip` (here `.scratch/**`) are never sent at all — no request, no cost.

## Where the deterministic rules go

Anything expressible as a command or path pattern belongs in the user config, not a rules file, so it
holds for every repo with no Jev judgment and no rules budget: `action.commandRules`,
`action.pathRules`, `action.armingRules`, `rules.sensitivePaths`. Project files cannot weaken them.

One trap when writing a path rule: `access: "none"` fires on a bare *mention* of the path in any
command, so `ls ~/.pi/agent/pi-warden/` is blocked along with the write you meant to stop. For a path
that should only be protected from writes, use `access: "read"` — reads flow, redirect/`tee` sinks
and `write`/`edit` are held. Also note that `tools` is ignored on the command surface: a rule fires
for every command tool, whatever its `tools` list says, so the `access` choice is what scopes it.
