# The OS-level sandbox guard is removed

`git:github.com/jennymaeleidig/pi-sandbox-runtime` and its config `dot_pi/agent/sandbox.json` are removed, along with the `pi-system-one` package. The only guard layer left is `cc-safety-net`, which judges commands at the tool layer (secrets access, destructive commands, git-history mutation) but contains no process: it does not fence file writes and cannot express a filesystem read boundary.

This reverses ADR-0006 and removes the mechanism ADR-0004 recorded. It is a deliberate acceptance of less enforcement, not a claim that the tool-layer guard is equivalent. With no OS fence, the boundary that forced "the agent works from source, the user applies" no longer exists as a denial the agent cannot cross; that split stays in force as policy (`AGENTS.md` and the `chezmoi apply` hand-off it names), not as an enforced boundary.

Consequences: the applied guard config (`~/.pi/agent/sandbox.json`), the `pi-sandbox-runtime` agent skill, and the package's git checkout are retired from Source state. Runtime trees pi materialized for the two packages under `~/.pi/agent/npm` and `~/.pi/agent/git` are ignored by `.chezmoiignore` (ADR-0002), so no Apply deletes them; a `run_once` cleanup script names their real host paths and removes them. Env exports that only served `pi-system-one` (`SYSTEM_ONE_*`) are gone from `dot_bash_exports.tmpl`. ADR-0008's claim that the sandbox's `denyRead` keeps `~/.secrets` out of session reach no longer holds; the file is now only unmanaged, not unreachable.

## Considered options

- **Keep `pi-sandbox-runtime`**: rejected by owner decision. It was the only layer that judged *every* Tool call and fenced subprocess argv, so its removal is the loss that matters.
- **Replace it with another OS fence**: not taken. No replacement is declared; if enforcement returns, it is a new decision, not a silent revival of ADR-0006.
