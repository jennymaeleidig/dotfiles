---
name: writing-warden-rules
description: Write and tune judgeable pi-warden rules.
disable-model-invocation: true
---

# Writing warden rules

A warden rule is a **tripwire**: the exact shape in a change that makes it a violation, written so Jev can decide it from one changed file. The heading is the rule's name and id. The text under it is the specification.

This skill covers the per-edit and per-turn rules the rules guard reads from `pi-warden.md` or `rules.files` ([docs](https://github.com/DevMortimer/pi-warden/blob/main/docs/guards.md#rules)). A rule about a shell command, a path, or a file edit that arms a command belongs in `action.commandRules`, `action.pathRules`, or `action.armingRules` in the user config, not in this Markdown file.

## Write a rule

1. **Find the active source.** Ask for `/warden rules`, or resolve it yourself: root `pi-warden.md`, else `rules.files` from `~/.pi/agent/pi-warden/config.json` and `.pi/pi-warden.json`, else the fallback document. Edit the source in force. If nothing resolves, create `pi-warden.md` at the project root; if `rules.files` is configured, edit the listed file that should own the rule, because a root `pi-warden.md` shadows `rules.files` entirely.
   Done when: you know the file you are about to edit is the one in force.

2. **Capture the tripwire.** Get one real violating snippet and one compliant near-miss that must stay silent. Name the file scope, or say the rule is project-wide. If no real snippet exists, write the smallest code sample that triggers the violation.
   Done when: both snippets exist and you can point to the line in the violating one that breaks the rule.

3. **Choose the surface.** Use the table below. The surface decides what evidence the judge gets: one change, the whole run, or a different guard entirely.
   Done when: one surface is chosen and the reason fits in one sentence.

4. **Draft the heading and first line.** The heading names the violation, not the topic. The first sentence states the tripwire and the violated shape. Follow it with the exempting shape and the positive alternative.
   Done when: the heading plus the first sentence alone decide the violating snippet, without reading the rest of the body.

5. **Scope it.** Add `paths:` unless the rule genuinely applies to every file. Path scoping is the budget lever: unscoped rules ride every request and compete for the 31-rule cap.
   Done when: the violating sample's path matches, and an unrelated file does not.

6. **Self-test against the judge's frame.** The judge asks whether the change *introduces* a violation, judged on the file with the edit applied. A violation already present before the edit is not blamed on the edit. Check three things: the rule fires on the violating snippet; it stays silent on the near-miss; it is decidable from the changed content alone.
   Done when: all three answers are yes. If not, sharpen the tripwire, narrow the scope, or move the rule to `when: turn`.

7. **Add headers only when earned.** `source:` when the wording comes from an instruction file. `when: turn` when one edit cannot show the violation. `threshold:` and `severity:` after evidence, not as a first guess.
   Done when: every header has a reason, and no header appears twice.

8. **Verify the parse and the shape.** Ask for `/warden rules`; it must list the rule with the intended scope and no warning. With a key and consent, `/warden rules check` flags rules that are not `from_change_alone` or that a linter could enforce.
   Done when: the rule parses cleanly, and `check` is clean or the manual near-miss test passed.

When an existing rule is noisy, never fires, or `check` or `calibrate` flags it, read [tuning.md](tuning.md).

## Rule anatomy

```markdown
# No console output in library code
paths: src/**
source: AGENTS.md:65
Code under `src/` must not call `console.log`, `console.debug`, or `console.info`. Use the project logger. Tests and scripts may print.
```

**Heading.** One rule per heading. The shallowest heading level in the file is the rule level. Keep every rule at one level and put no shallower Markdown title above them: a `#` title above `##` rules is itself read as a rule. Text before the first rule heading is ignored. Headings inside code fences are not read.

**Header lines.** These sit at the top of the body, in any order, at most once each. A bad value is dropped with a warning.

| Header | What it does |
| --- | --- |
| `paths: src/**/*.ts, tests/**` | Limits the rule to matching files. `**` matches any depth, `*` stays within one segment, `?` matches one character. |
| `when: turn` | Judges once at the end of the run against the whole diff and the user's task, not on each edit. Default is `edit`. |
| `threshold: 0.9` | Per-rule cutoff from 0 to 1. Default is the user's `rules.threshold`, usually 0.7. |
| `severity: high` | Orders findings: `high`, `normal`, or `low`. Default is `normal`. |
| `source: AGENTS.md:65` | Names the instruction line the rule came from. Shown in `/warden rules` and in the steer when the rule fires. |

**Body.** Define the tripwire, the exempting shape, and the replacement behavior. Keep one violation per rule; split a rule that names two unrelated shapes.

## Choosing the surface

| The violation is visible | Surface |
| --- | --- |
| In the changed text of one file: a symbol, a comment, a declaration, a structure | Edit rule: the default, no `when:` header |
| Only across the whole diff, several files, or the user's task: scope creep, duplication, a single-use abstraction, speculative work | `when: turn` |
| Exactly and completely enforceable by a linter, formatter, or type checker | The linter, not warden: otherwise every edit spends a request to learn what the tool already knows |
| A command, path, or edit-then-command sequence, not written content | `action.commandRules`, `action.pathRules`, or `action.armingRules` in the user config |

A turn rule is the right home for "the change adds more than the task asked for" and "logic is duplicated across files". It is the wrong home for "this file must not contain `console.log`", which one edit shows.

## What makes a rule judgeable

- **A tripwire, not a topic.** "Code should be clean" has no violating shape. "A bare `TODO` without a ticket reference is a violation" does.
- **From one changed file.** If the judge needs another file, the task, or repository history, the rule is either a `when: turn` rule or not a warden rule.
- **One violation.** A rule that bundles naming, comments, and tests gets a muddled score and a vague steer.
- **A near-miss.** Name the shape that looks close but is allowed: tests that print, a `TODO(APP-123)`, a fake key in a fixture. Without it, the rule fires on clean lookalikes and lands in `fires on everything`.
- **The change, not the file's history.** "A newly added exported function declares its return type" beats "every function declares its return type", because an untouched function is not this edit's violation.
- **The first line carries the rule.** Turn-start reminders show the heading and the first line of text; the steer shows at most 200 characters of the body. Put the violation there.

## From AGENTS.md to rules

`/warden init` does this conversion; use the same selection when writing by hand. Take one instruction per rule. Skip prose, process, and anything a linter, formatter, or type checker already enforces exactly. Put the instruction's line number in `source:`. An instruction that needs another file, repository history, or the task stays in `AGENTS.md`, becomes a `when: turn` rule when the task and diff are enough, or is not a warden rule.

## Rewrite examples

| Weak | Why | Rewritten |
| --- | --- | --- |
| `# Logging` | A topic, not a violation | `# No console output in library code` |
| `# Good error handling` | No tripwire, no near-miss | `# Errors are not swallowed` — a `catch` must log with context, rethrow, or handle; an empty `catch` is a violation |
| `# Functions declare return types` | Whole-file state; a linter can often decide it | `# New exported functions declare a return type` with `paths: src/**/*.ts` |
| `# Don't over-engineer` | No shape, needs the task | `when: turn` under `# No abstraction with a single use` |
| `# No secrets` | Too broad; fixture values become false alarms | `# No hardcoded secrets` — no real password, key, or token; an obviously fake fixture value is fine |

## Limits that shape the writing

- A `write` is sampled at 6,000 characters: head, middle, and tail. An `edit` sends each new text plus about 40 lines of the file around it, before and after.
- At most 31 rules are asked per request. Rules are taken in file order after path scoping; the rest are dropped for that write. `/warden status` reports the drop.
- A turn-start reminder carries at most three rules.
- A fallback document (`AGENTS.md`, `CLAUDE.md`, `README.md`) is judged as one document with one question, not per rule, and is cut to `rules.maxChars`. Separate rules need a rules file with headings.
- Turn findings arrive once at the end of the run. They never hold a write and never enter the conversation.
