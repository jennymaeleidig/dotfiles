# 0001 — Per-launch judge mode for pi

Status: accepted

## Context

pi has two hosting modes: local (oMLX at `localhost:8000` for chat and the
judge) and online (OpenCode for both). Every consumer of the judge reads its
configuration once, at load:

- tinysubagent parses `tinysubagent.jsonc` at extension load and freezes it
  for the session. It accepts a whole-file override through the
  `PI_TINYSUBAGENT_CONFIG` environment variable.
- pi-warden reads `pi-warden/config.json` into a session snapshot and only
  *reports* later file changes, never adopting them. It has no environment
  override for its judgment backend: `PI_TYPESAFE_BACKEND` names registry
  backends only, and pi-warden does not consult it.

Neither can be switched mid-session, and neither can read a mode from the
shared config files, which must stay identical across modes.

## Decision

The mode is chosen per launch, by the `pi` shell wrapper
(`~/.config/bash/pi-launch.sh`, rendered from `.chezmoidata.toml`):

1. tinysubagent switches through a **process-scoped** env assignment:
   `PI_TINYSUBAGENT_CONFIG=…tinysubagent.online.jsonc command pi …` on online
   launches. A prefix assignment, not an export, so the variable never
   persists in the shell; a caller-set value is never overridden.
2. pi-warden switches through a **config copy**: the wrapper copies
   `config.online.json` (or `config.local.json`) over `config.json` before
   launching. Because warden snapshots the file at load, the copy cannot
   affect sessions already running — each session judges the way it
   launched, and the file always reflects the most recent launch.
3. `config.json` itself is **not** chezmoi-managed; the wrapper owns it.
   Chezmoi materializes the two variants plus a `run_after` script that
   seeds `config.json` from `config.local.json` when missing, so a fresh
   machine or a deleted file converges to the local default without
   fighting an online launch's copy.

The launch default (local) lives in `settings.json` `defaultProvider` /
`defaultModel`, kept in sync with `[chat.local]` in `.chezmoidata.toml`.
In-session model cycling is `Ctrl+P` over `enabledModels`, which spans both
hosts; the judge is never switched mid-session.

## Consequences

- A bare launch with the local server down, or with the default chat model
  not in the server's catalog, falls back to a full online launch.
- `chezmoi apply` cannot silently flip an online session's judge: the file
  is no longer its target.
- The judge follows the *launch*, so a session that cycles its chat model
  to a remote model with `Ctrl+P` still judges as it launched. That is
  accepted: the judge is a launch-time property, not a per-message choice.
