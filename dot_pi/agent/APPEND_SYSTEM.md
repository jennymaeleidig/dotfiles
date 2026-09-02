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

## Accessibility

- When writing content or UI: follow the [WAI standards & guidelines](https://www.w3.org/WAI/standards-guidelines/) —
  [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) for content, the [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) patterns (semantics and keyboard contract) for interactive components.
