---
name: validate
description: Validate produced artifacts and the current state of development against user-named criteria — a Matt Pocock skill (~/.agents/skills), a file, or steps listed inline. Use when asked to validate progress, check work against a process, or answer "did we follow X". More generic than code-review: any artifact compared against any criteria.
---

Validate WHAT was produced against criteria the user supplies. Unlike code review — a diff vs standards and a spec — both sides are open: a spec against tickets, a session's output against a skill's steps, a doc against a style guide.

## Process

### 1. Pin the criteria

What to compare against, per the user:

- **A skill name** — read `~/.agents/skills/<name>/SKILL.md` (plus any reference file it points at); its steps and rules are the criteria.
- **A file path** — read it; its contents are the criteria.
- **Steps listed inline** — use them verbatim.

If the user didn't specify, ask — never guess. Confirm the criteria resolve (skill found, file exists) before going further; fail here, not mid-comparison.

### 2. Pin the artifacts

What is being validated: files this session produced, working-tree changes, named docs, recent commits. Infer from context when the target is clear ("validate the tickets we just made"); ask only when it genuinely isn't.

### 3. Compare

Walk every criterion. For each, find the evidence in the artifacts and assign a verdict:

- **met** — the artifact satisfies it; quote the evidence.
- **partial** — present but incomplete or deviating; state the gap.
- **missing** — nothing in the artifacts addresses it.
- **n/a** — the criterion doesn't apply to these artifacts; say why.

Every criterion gets a verdict; every verdict carries evidence.

### 4. Report

One line per criterion, grouped by verdict, each with its evidence. End with a summary line: counts per verdict, and the single most consequential gap — not a merged score, so one axis can't mask another.
