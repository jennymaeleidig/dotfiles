---
name: setup-pi-workspace
description: Set up a repo's workspace — run setup-matt-pocock-skills, then overlay this skill's authoritative local-markdown issue-tracker doc. Use when onboarding a repo, or the user says "setup pi workspace".
---

# setup pi workspace

Set up a repo's workspace for the engineering skills. Two steps: run `setup-matt-pocock-skills` for the interactive per-repo setup, then **overlay** this skill's local-markdown tracker doc — `docs/agents/issue-tracker.md` — so the repo tracks issues by the conventions the rest of the skill suite reads.

The tracker doc ships with this skill as a seed template — `issue-tracker-local.md` (beside `SKILL.md`) — that file is the authoritative copy. Edit the tracker semantics there; the overlay just copies it into each repo.

## Process

### 1. Run setup-matt-pocock-skills

Load `~/.pi/agent/skills/setup-matt-pocock-skills/SKILL.md` and follow it, one section at a time, letting the user answer. It writes `docs/agents/*.md` and the `## Agent skills` block into `CLAUDE.md`/`AGENTS.md`.

The Section A tracker choice is provisional — step 2 overrides it with this skill's tracker doc. Let the user answer naturally.

Done when setup finishes and `<repo>/docs/agents/issue-tracker.md` plus the `## Agent skills` block exist.

### 2. Overlay the local-markdown tracker

Write the tracker doc from the seed template in this skill folder:

- [issue-tracker-local.md](./issue-tracker-local.md) — local-markdown issue tracker (the authoritative copy)

Copy it to `<repo>/docs/agents/issue-tracker.md` — overwrite; the seed wins. Then, in the repo's `## Agent skills` block (`CLAUDE.md`/`AGENTS.md`), update only the `### Issue tracker` sub-block to read:

> Issues and specs live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

The rest of the block stays as setup wrote it.

Done when the copy is byte-identical to the seed and the `### Issue tracker` line reads as above.

### 3. Verify

- `diff <repo>/docs/agents/issue-tracker.md <skill>/issue-tracker-local.md` — identical.
- The `### Issue tracker` sub-block matches; the rest of the block is as setup left it.

## Notes

- Re-running is safe: setup updates in place, then the overlay reinstates the seed.
