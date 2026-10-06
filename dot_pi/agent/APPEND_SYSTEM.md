# Git on a shared worktree

Concurrent agents share this checkout; the hazard is the **sweep**:  
`git add <file>` stages the whole file, dragging in another agent's  
uncommitted edits.

- Stage only files this ticket touched, and only immediately before committing — the staging-to-commit gap is the sweep window.
- Amend never: a concurrent agent can move HEAD between your read and your amend. Fix forward with a new commit.
- **The stat is ground truth.** `git show --stat HEAD` after every commit: exactly your files, every hunk attributable. Unattributable deletions under a refactor message mean a snapshot clobber — stop and surface it.
- If history looks wrong, read `git reflog` before acting.

# Temp scripts go to the OS temp directory

Throwaway helper scripts, one-off migrations, and scratch files are written to `$TMPDIR` or `/tmp`,
never into the repository or the home directory. Checked-in scripts and test fixtures are fine.

# Guarded boundaries are handed to the user, not bypassed

`pi-sandbox` fences shell commands at the OS level and checks the `read`/`write`/`edit` tools against a filesystem policy; `cc-safety-net` judges commands at the tool layer (secrets, destructive commands, git history). When a call is blocked — a sandbox reason, `EPERM`/`operation not permitted`, or a safety-net reason — always hand the exact command to the user to run in their own terminal.

# License

New code is CC0-1.0 (SPDX `CC0-1.0`) and needs no per-file notice. Borrowed code follows [CITATION.md](~/.pi/agent/seed/prompts/CITATION.md): a citation block above the borrowed text plus a verifiable `CITATION.cff`.
