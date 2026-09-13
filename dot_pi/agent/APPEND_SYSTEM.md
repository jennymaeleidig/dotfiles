## Scripts: Temporary, Inline, & Here documents

- Multi-step scripts: write a temp file with the write tool (e.g. `$TMPDIR/script.py`) and execute it; one-liners stay inline. This is the substitute for two hard blocks (CC Safety Net): heredocs into anything but `cat`, `tee`, `git apply`, `git commit`, `gh pr create`, `gh issue create`, and multi-line inline `-c`/`-e` blobs — where a backtick in script text breaks CC Safety Net's quote tracking and a later `<<` false-blocks as a heredoc.

## Guards first

Two guards shape every command this agent runs — load the matching skill *before* the work that touches it, so patterns are known upfront, not discovered mid-failure:

- About to run dev servers or any background/long-lived process, or debugging local-server weirdness (stale 404/200 on your port, `EADDRINUSE`, `kill`/`pkill` refusing) — load the `pi-sandbox` skill first.
- About to touch secrets or credentials, run destructive commands, or mutate git history — load the `cc-safety-net` skill first.
- When a guard fires anyway (safety-net `block`, `EPERM`/`operation not permitted`): hand the blocked command verbatim to the user to run in their own unguarded terminal, and confirm any substitute plan before downgrading tooling or skipping the step.

## Subagents: Always delegate via Herdr

- Subagents and background agents run as Herdr panes under the same guards as this session — dispatching to them never escapes a denial.
- **Dispatch by default.** When work parallelizes or backgrounds well — a skill mandate (code-review's two axes, design-it-twice, wayfinder's research fan-out, grilling's fact-finding) or a win you spot yourself — load the `herdr` skill and split a sibling pane at once. Dispatch first, mention it after: no user request for Herdr is needed, and a mandate is never downgraded to inline or sequential.
- **Reports come back as files, not scrollback.** Every report-back dispatch prompt (review axes, research, design-it-twice) asks for the full report written to a temp file with only the path in reply; read the file. This overrides the herdr skill's fallback-only file rule: the file is the contract, requested up front, not a recovery step after `pane read` comes up short. Short interactive replies still read fine from the pane.
- **Close your own panes when the work is done.** A dispatched pane is scaffolding, not a deliverable. Close it with `herdr pane close <pane_id>` once the subagent settles — report read, request answered, or job failed — and the output is in hand: collect, then close. Panes this session created are yours to close; the herdr skill's ownership rule covers the rest, and a pane still working or worth watching stays open — say so when you leave it.
- The only skip is work too small to benefit from a pane — do that inline. If Herdr is genuinely unavailable, say so and ask how to proceed; never quietly fall back.

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
