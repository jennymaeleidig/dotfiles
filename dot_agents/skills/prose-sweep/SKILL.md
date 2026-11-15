---
name: prose-sweep
description: Sweep a codebase, or the files changed since a git basepoint, for prose that no longer matches the code or reads as slop.
disable-model-invocation: true
---

# Prose Sweep

A prose audit of a codebase, across the whole repo or across the files changed since a comparison point: comments, docstrings, docs, user-facing strings, and the references they make. Two kinds of finding:

- **Drift**: the prose claims something the code defeats.
- **Slop**: the prose carries a named `no-ai-slop` pattern, accurate or not.

Drift is about truth. Slop is about the sentence, so the two get separate axes. Both promote to one gate, the single review pass before edits, and the edits land per file.

`no-ai-slop` is required. If it is unavailable, stop and tell the user to install it.

## Process

### 1. Pin the comparison point

Ask the user what to compare against before reading any file:

- a git basepoint: a commit SHA, branch, tag, or merge-base;
- a full audit: the whole repo at the current state.

Start with a basepoint comparison; a full audit is the exception, chosen deliberately for a repo-wide cleanup.

**Basepoint.** Confirm the ref resolves with `git rev-parse <point>`. Capture the changed files:

- committed work: `git diff --name-only --diff-filter=ACMR <point>...HEAD`
- uncommitted work: `git diff --name-only --diff-filter=ACMR HEAD`
- untracked work: `git ls-files --others --exclude-standard`

Union the three. If the user limits the sweep to paths, add them as a pathspec. Drop binary, generated, and excluded files. If the union is empty, stop and ask whether to widen the point or run a full audit.

The diff selects whole files: a stale comment can sit on an unchanged line next to changed code, so review each selected file in full. A basepoint sweep covers recent work; the whole repo needs a full audit.

If the diff changes a public name, path, command, option, or default, search the repo for prose that names the old or new value and add those files. Use a word-boundary search. A rename breaks prose outside the diff.

**Full audit.** Use the repo root and every in-scope path at the current state.

Write down the root, the in-scope paths or selected files, the exclusions, and the current state: the code in the working tree as it stands.

The default exclusions are the places where prose is not authored by the repo or is not the source of truth. Hand-written prose inside an excluded area stays out unless the user includes it.

**Completion:** the comparison point, root, in-scope paths or selected files, exclusions, and current state are stated before any reviewer runs.

### 2. Dispatch the reviewers

Four review-only sub-agents in parallel, each with one question and a fresh context.

1. **Comments, docstrings, and test names**: does each claim match the code beside it?
2. **Docs, READMEs, and user-facing strings** (CLI help, errors, logs): does each claim match the behavior the repo ships?
3. **References**: does each path, symbol, command, or record named in prose still exist and still govern?
4. **Prose slop**: does any in-scope prose carry a named `no-ai-slop` pattern?

Axis 3 owns every dangling target, even inside a comment or doc. Axis 4 owns every slop finding, even on a line axis 3 flagged. Axes 1 and 2 own claims.

Each reviewer gets the scope, exclusions, its question, the evidence rules and historical-prose rule from step 3, and the output format. Paste each in full; the reviewer cannot see this file. If the repo documents terminology, voice, or prose rules, pass those in too. The slop reviewer also gets this instruction: call the Skill tool with `"no-ai-slop"` and use its detect job. Detect only: name each pattern, quote the line, and give the fix in a few words, using its pattern list as written.

If a sub-agent cannot load the Skill tool, run the slop axis in the parent.

Reviewers report only.

**Completion:** every axis returned a report, and each says what it found, including nothing.

### 3. Verify every finding

A finding is a claim; the evidence is the proof.

- **Drift**: quote the prose claim and the code fact that defeats it: a file and line, a command output, or a missing target. Check values, names, paths, counts, order, defaults, and load order.
- **Slop**: name the `no-ai-slop` pattern and quote the line.
- **Historical prose**: use the rule in **Scope** to separate a past claim (slop only) from a current-behavior claim (drift).
- **Code looks wrong**: leave the prose alone, mark the finding `ask`, and report the code question. The prose stays until the user settles it.

The code fact or the named pattern is the only gate.

Mark each finding `apply`, `skip`, or `ask`. Keep a list of skipped findings with the reason.

**Completion:** every finding has a code fact or a named pattern, and exactly one of `apply`, `skip`, or `ask`.

### 4. Gate the findings

Group the `apply` and `ask` findings by file and show the table:

| Location | Type | Prose claim | Evidence | Action | Risk |
| --- | --- | --- | --- | --- | --- |

- **Type**: `drift`, `slop`, or `both`.
- **Action**: `rewrite`, `delete`, or `flag`.
- **Risk**: `none`, `user-visible`, or `ambiguous`.

Show `skip` as counts with one-line reasons. Wait for the user's go-ahead before the first batch.

**Completion:** the user has approved the apply list.

### 5. Apply the cleanup

One batch per file, so each diff is reviewable and a bad edit stays local.

- **Drift**: rewrite when the passage still has a job after the correction: a why, a constraint, a warning. Delete when the false claim was its only content. Remove a dangling reference; leave any replacement record to the user.
- **Slop**: cut first. Rewrite only when a fact, constraint, or warning must survive.
- **Both**: repair the claim first, then cut the replacement like any other slop edit.
- The diff changes prose only: rewrite or delete, nothing else.

For each batch that contains a rewrite, call the Skill tool with `"no-ai-slop"` in edit mode on the rewritten prose, then check the result against the parts of `eval.md` in the `no-ai-slop` skill that apply to code prose: no new claims, no banned words, no slop patterns. Override the voice rule: code prose has no single writer, and the register is terse and factual. Keep the technical claim, keep it to why or a non-obvious constraint, add no claims.

Preserve comments that explain a non-obvious why, unless the repo's own comment rule says reasoning belongs in a record. Add citations to specs, ADRs, or tickets in code only when the repo allows it. If the reasoning must persist, leave it in the document that owns it.

**Completion:** every batch is applied; the diff changes prose only.

### 6. Report

Report inline in Markdown:

- **Scope**: the comparison point, the file count, and the exclusions.
- **Findings**: the gate table, with the `apply` and `ask` rows that were decided.
- **Changed**: counts by `drift` and `slop`, with the file sets.
- **Kept**: every skipped finding and its reason.
- **Verification**: the evidence rule, and the fact that no command gate was used.
- **Residual risk**: code questions, ambiguous history, snippets that could not be repaired with certainty, and prose outside the basepoint.

**Completion:** every axis and every finding is accounted for.

## Scope

The comparison point selects the files. This section decides what in those files counts.

In scope: comments, docstrings, test names, README and docs prose, user-facing strings, code snippets in docs, and the references they make.

Out of scope:

- decision records: ADRs, specs, and tickets, for both drift and slop, including their links;
- vendored, generated, build output, lockfiles, minified files, snapshots, and generated docs;
- external URLs;
- code changes, new prose, refactors, and grammar-only edits.

Historical prose: changelogs, migration notes, and release notes are in scope for slop. They are in scope for drift only when they claim current behavior.

A code snippet in a doc is a prose claim. Fix it only when the correct source form is unambiguous; otherwise mark it `ask`.

## Sub-agent brief

```text
Review <root> for <axis>. REVIEW ONLY: report findings, change nothing.

Scope: <in-scope paths, or the selected files>. Exclude: <paths>.
Question: <one sentence>.
Evidence rule: <the rule for this axis, pasted in full>.
Historical prose: <the rule, pasted in full>.
Output: numbered findings, each with path:line, type (drift/slop/both), the
prose claim, the code fact or named pattern, proposed action, and risk. End
with a count. Skip anything tooling enforces. Mark anything you cannot
evidence `ask`.
```

For the slop axis, add the detect instruction from step 2 to the brief.
