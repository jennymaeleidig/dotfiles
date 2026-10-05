# Secrets live outside source state

Credentials and provider endpoint values that shell startup files must export are kept in unmanaged env files under `~/.secrets/`, sourced by guarded `[ -f ]` lines in managed files like `dot_bash_exports.tmpl`. The source directory is plain text and git-backed, so a secret rendered into a template would land in state and history; chezmoi never sees these values. The source line is load-bearing in one detail: the file is sourced under `set -a` (allexport), because plain `KEY=value` lines sourced without it stay shell-local and never reach child processes — a pi extension reading `process.env` then reports the value as unset.

The decision has no consumer today: the `SYSTEM_ONE_*` exports that motivated it left with the pi-system-one package, and `dot_bash_exports.tmpl` no longer sources a `~/.secrets/` file. It stands as the shape for the next secret, not as a description of current exports. It also no longer buys session secrecy: the OS fence that hid `~/.secrets` behind `denyRead` is removed, so `~/.secrets` is now unmanaged by convention only, readable at the home root like any other file.

## Considered options

- Secret-manager template functions (`onepasswordRead`, `output`): clean state, but every Apply gains a tool dependency and a sign-in requirement.
- Encrypted source files (`chezmoi encrypt`): still state — ciphertext in repo history, key management on Apply.
- Unmanaged env file plus a guarded source line: no new tools and nothing in state. The cost is a manual per-secret step on a new host — exactly what a wizard-style hand-off is for.
