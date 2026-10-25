# Writing Code

Always use the `context7-docs` skill without me having to explicitly ask when I need library/API documentation, code generation, or setup and configuration steps.

# Files cite no records

A record is a point-in-time document: an ADR (`docs/adr/`, `ADR-0002`), a ticket, a spec, a plan, a wayfinder map, or a research note. No code, config, or prose cites a specific one as the reason for a change. The code and its tests state the behaviour; `CONTEXT.md` supplies vocabulary. Reasoning worth keeping is captured deliberately — in an ADR or the documentation, case by case — never narrated into a comment. A placeholder that defines the convention (`.scratch/<feature-slug>/spec.md`), a bare generic filename (`spec.md`, `map.md`), and an ignore-list entry are not citations of one.

# License

New code is CC0-1.0 (SPDX `CC0-1.0`) and needs no per-file notice. Borrowed code follows [CITATION.md](~/.pi/agent/seed/prompts/CITATION.md): a citation block above the borrowed text plus a verifiable `CITATION.cff`. Run `date +%Y-%m-%d` and use the result as the access date.

## Borrowed code

Every block taken from an external source — code, config, or a doc snippet — cites: creator, title, a resolvable source (URL, DOI, or repo plus version), and license.

---

Each piece of borrowed code:

1. **Carries a citation block at the source**

Every borrowed block has a full citation block directly above it. A comment that names a source without all four is an incomplete citation and a violation. A modification appends `Modified by {name} on {date} — {changes}` under the existing block.

2. **Updates CITATION.cff**

A run that adds borrowed code updates the project's `CITATION.cff` in the same run, with only fields
verifiable from the source and the original license.

---

An entry or comment that names a source without all four is an incomplete citation and a violation.

Original code carries no citation.

# Git on a shared worktree

Concurrent agents may share this checkout; the hazard is the **sweep**: `git add <file>` stages the whole file, dragging in another agent's uncommitted edits.

- Stage only files this ticket touched, and only immediately before committing — the staging-to-commit gap is the sweep window.
- Amend never: a concurrent agent can move HEAD between your read and your amend. Fix forward with a new commit.
- **The stat is ground truth.** `git show --stat HEAD` after every commit: exactly your files, every hunk attributable. Unattributable deletions under a refactor message mean a snapshot clobber — stop and surface it.
- If history looks wrong, read `git reflog` before acting.

# Temp scripts go to the OS temp directory

Throwaway helper scripts, one-off migrations, and scratch files are written to `$TMPDIR` or `/tmp`, never into the repository or the home directory. Checked-in scripts and test fixtures are fine.
