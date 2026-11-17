---
name: warden-scope-setup
description: Set which files pi-warden judges in one repository — extra source extensions, excluded and skipped paths, and per-rule path scopes. Use when a warden audit misses a language, selects nothing, samples vendored or generated code, a rule fires outside its area, or a new repository needs its file scope set from scratch.
---

# Warden scope setup

Take one repository to **every tracked file judged, excluded, skipped, or unreachable by the walk, with the reason recorded**.

Three knobs decide it, in three files:

| Knob | Key | File | Decides |
| --- | --- | --- | --- |
| Source set | `rules.auditExtensions` | user config | which extensions the audit discovers |
| Exclusions | `rules.exclude`, `rules.skip` | user and project config | which paths are never sent (`exclude`) or never judged (`skip`) |
| Rule scope | `paths:` under a rule heading | the rules source | which files one rule is asked about |

A **bucket** is one extension, or one extensionless name, among the tracked files. Each bucket gets one outcome: **judged**, **excluded**, or **skipped**; a bucket the walk cannot see is judged only when named.

The source set governs discovery for the two audit commands only. `exclude`, `skip`, and a rule's `paths:` narrow the live guard as well.

Config: user `~/.pi/agent/pi-warden/config.json`; project `<repo>/.pi/pi-warden.json`, read only when Pi trusts the project. Arrays can only be written by hand-editing JSON.

[scope.md](scope.md) has the reference details: the gate order, the matcher, and the caps.

## Process

### 1. Bucket the tracked files

```bash
git ls-files | awk '
  {
    path = $0; name = path; sub(/.*\//, "", name)
    if (path ~ /(^|\/)\./) { print "dot-path\t" path; next }
    if (name !~ /\./) { print "extensionless\t" name; next }
    ext = name; sub(/.*\./, "", ext); print "extension\t" tolower(ext)
  }' | sort | uniq -c | sort -rn
```

`git ls-files | wc -l` is the total the buckets must add up to.

Done: every tracked file sits in exactly one bucket, and the bucket counts sum to the tracked total.

### 2. Assign each bucket an outcome

| Bucket | Outcome |
| --- | --- |
| A built-in extension that is source | judged, with nothing to configure (the set is the `rules.auditExtensions` row of the [configuration docs](https://github.com/DevMortimer/pi-warden/blob/main/docs/configuration.md)) |
| An extension outside that set that is source | judged: step 3 |
| Source code with no extension | judged only when named: step 6 |
| A dot-path or dot-file | never discovered; judged only when named, and a live edit is judged like any other path, subject to gitignore, `exclude`, and `skip` |
| A file under a skip directory | never discovered; judged only when named (the list is in [scope.md](scope.md)) |
| Generated, vendored, or build output | excluded or skipped: step 4 |
| Tests, docs, fixtures a rule should not read | skipped: step 4 |

A gitignored path needs no config.

Done: every bucket carries one outcome and one reason, and every judged bucket names the extension or file that reaches it.

### 3. Extend the source set in the user file

Append the judged extensions to `rules.auditExtensions`. Write a bare name or one leading dot (`"astro"`, `".astro"`); casing does not matter, and an entry that still holds a dot or a slash can match no file and is dropped with a warning.

The key is **user file only**. A project file that names it is ignored with a warning, because the audit samples every file it discovers, so the source set is a privacy decision each developer makes. Propose the exact JSON; edit the file after the user confirms.

Done: every judged extension outside the built-in set is listed, and `/warden status` shows no warning naming the key.

### 4. Write the exclusions in the project file

```json
{ "rules": { "exclude": ["secrets/**", "**/*.pem"], "skip": ["tests/**", "**/*.test.*"] } }
```

A project file's `exclude` and `skip` **add to** the user's lists, never replace them: a project can take a path out of judging, and cannot send one the user excluded. An exact repeat keeps one entry. Keep anything that must never leave the machine in the user file, where every project inherits it.

Write the full path you mean: `secrets/**` also catches `vendor/secrets/x` ([scope.md](scope.md) has the matcher).

Done: every excluded or skipped bucket is matched by a pattern, every user exclusion is still in force, `/warden rules` prints the effective `rules.exclude` list, and `/warden status` shows no config warning.

### 5. Scope the rules

Add a `paths:` line under the heading of each rule that fires outside its area, in the rules source: root `pi-warden.md`, else the effective `rules.files` list, else the first of `AGENTS.md`, `CLAUDE.md`, `README.md`, judged as one document.

```markdown
# No console output in library code
paths: src/**
```

A `paths:` line scopes the live per-edit guard too, not only the audit. Rule wording, header syntax, and the request budget belong to [writing-warden-rules](../writing-warden-rules/SKILL.md); this step only narrows where a rule is asked.

Done: `/warden rules` lists the intended scope for each scoped rule, no header warning appears, and no rule is scoped only to paths that step 4 excludes or skips.

### 6. Verify the selection

```text
/warden rules                      # parsed rules, their paths: scopes, effective exclude patterns
/warden status                     # config warnings, unscoped rules past the cap
/warden rules audit . --max 200    # confirm dialog names the file count before anything is sent
```

With no rules source, with `rules.fallback` off, or with a fallback that is prose only, the audit selects nothing.

The dialog names how many files would leave the machine. Set `--max` above the judged total, and expect the count to equal the buckets the walk can see: extensions in the source set, less gitignored, excluded, skipped, and paths no edit rule matches. A count above that means the source set or an exclusion is wrong; a count below means a bucket was mislabelled, or `--max` truncated it.

A path the walk cannot see is judged only by name: `/warden rules audit Makefile bin/deploy` still honours gitignore, `exclude`, `skip`, and the rule match. Confirm only when the user agrees to spend the requests.

Done: the count reconciles as above, no config warning remains, and any `left out` line is explained.

### 7. Record

Update the one document in the repo that owns tooling setup (`docs/agents/warden.md`, or a section of `AGENTS.md`). Record the reasoning and the per-developer step the config cannot carry:

- the extensions each developer must add to their own user file, since the repo cannot ship them
- each excluded or skipped path with its reason
- the extensionless files and the explicit audit command that reaches them
- the verification commands

Done: a fresh clone, plus the recorded per-developer step, reaches the same judged set without this conversation.
