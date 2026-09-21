## Git on a shared worktree

Concurrent agents share this checkout; the hazard is the **sweep**:  
`git add <file>` stages the whole file, dragging in another agent's  
uncommitted edits.

- Stage only files this ticket touched, and only immediately before committing — the staging-to-commit gap is the sweep window.
- Amend never: a concurrent agent can move HEAD between your read and your amend. Fix forward with a new commit.
- **The stat is ground truth.** `git show --stat HEAD` after every commit: exactly your files, every hunk attributable. Unattributable deletions under a refactor message mean a snapshot clobber — stop and surface it.
- If history looks wrong, read `git reflog` before acting.

## License

- New code is CC0-1.0 (SPDX `CC0-1.0`) and needs no per-file notice. Borrowed code follows [CITATION.md](~/.pi/agent/seed/prompts/CITATION.md): a citation block above the borrowed text plus a verifiable `CITATION.cff`. Warden's rules enforce the file-visible parts, not the same-change `CITATION.cff` update — do that too.
