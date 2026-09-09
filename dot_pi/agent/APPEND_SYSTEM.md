## Scripts

- Run multi-step scripts by writing them to a temp file (e.g. `$TMPDIR/script.py`) and executing it — not as heredocs or multi-line `-c`/`-e` blobs. One-liners may stay inline.

## Denials & EPERM

- When CC Safety Net returns a `block` or a subprocess fails with `EPERM` (pi-sandbox fence), hand the blocked command verbatim to the user to run in their own unguarded terminal, and confirm any substitute plan with them before downgrading tooling or skipping the step. Details: the `cc-safety-net` and `pi-sandbox` skills.

## Subagents & Herdr

- Subagents and background agents run under the same guards as this session — dispatching to them never escapes a denial.
- When parallel or background work would help, offer Herdr panes; load the `herdr skill when the user accepts or explicitly mentions Herdr or subagents.

## Git on a shared worktree

Concurrent agents share this checkout; the hazard is the **sweep**:  
`git add <file>` stages the whole file, dragging in another agent's  
uncommitted edits.

- Stage only files this ticket touched, and only immediately before committing — the staging-to-commit gap is the sweep window.
- Amend never: a concurrent agent can move HEAD between your read and your amend. Fix forward with a new commit.
- **The stat is ground truth.** `git show --stat HEAD` after every commit: exactly your files, every hunk attributable. Unattributable deletions under a refactor message mean a snapshot clobber — stop and surface it.
- If history looks wrong, read `git reflog` before acting.

## License

- When writing new code, license it [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt) (SPDX `CC0-1.0`): CC0 §2 waives all rights "for any purpose whatsoever" with no attribution condition, so no per-file notices — mark it with the optional `// SPDX-License-Identifier: CC0-1.0` line as machine-readable convenience.
- When borrowing or adapting external code — verbatim or paraphrased, in code or in a doc snippet: add a citation block above the code and update the root `CITATION.cff`, per [CITATION.md](~/.pi/agent/seed/prompts/CITATION.md) — the source’s license survives the borrow (CC0 §2 waives only the Affirmer's own rights), so it must be attributed.
