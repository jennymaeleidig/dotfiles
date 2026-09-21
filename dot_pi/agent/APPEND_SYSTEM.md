## Subagents: Always delegate via Herdr

- Subagents and background agents run as Herdr panes under the same guards as this session — dispatching to them never escapes a denial.
- **Dispatch by default.** When work parallelizes or backgrounds well — a skill mandate (code-review's two axes, design-it-twice, wayfinder's research fan-out, grilling's fact-finding) or a win you spot yourself — load the `herdr` skill and split a sibling pane at once. Dispatch first, mention it after: no user request for Herdr is needed, and a mandate is never downgraded to inline or sequential.
- **Dispatch pi.** Start subagents with `--kind pi` — same harness and account as this session. Any other kind is a separate third-party agent on its own model and network calls, so only the user names one.
- **Fan out, then wait.** Start every agent first, then collect with `herdr agent wait` — it returns when each settles.
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

- New code is CC0-1.0 (SPDX `CC0-1.0`) and needs no per-file notice. Borrowed code follows [CITATION.md](~/.pi/agent/seed/prompts/CITATION.md): a citation block above the borrowed text plus a verifiable `CITATION.cff`. Warden's rules enforce the file-visible parts, not the same-change `CITATION.cff` update — do that too.
