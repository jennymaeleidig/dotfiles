---
name: warden-scope-setup
description: Scope pi-warden to one repository — extra source extensions, excluded and skipped paths, and per-rule path scopes. Use when a warden audit misses a language, selects nothing, samples vendored or generated code, a rule fires outside its area, or a new repository needs its file scope set from scratch.
---

# Warden scope setup

Take one repository to **every tracked file judged, excluded, skipped, or ignored by git, with the reason recorded**.

Three knobs decide it, in three files:

| Knob | Key | File | Decides |
| --- | --- | --- | --- |
| Source set | `rules.auditExtensions` | user config | which extensions the audit discovers |
| Exclusions | `rules.exclude`, `rules.skip` | user and project config | which paths are never sent (`exclude`) or never judged (`skip`) |
| Rule scope | `paths:` under a rule heading | the rules file | which files one rule is asked about |

A **bucket** is one extension, or one extensionless name, among the tracked files. Each bucket gets one outcome: **judged**, **excluded**, or **skipped**.

The source set governs discovery for the two audit commands only. The live guard judges a write or edit whatever its extension and wherever it sits, so scoping the audit does not quiet an edit.

Config: user `~/.pi/agent/pi-warden/config.json`; project `<repo>/.pi/pi-warden.json`, read only when Pi trusts the project. Arrays can only be written by hand-editing JSON.

[scope.md](scope.md) has the gate order, the matcher, the skip directories, the caps, and which page documents each key.

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
| Source code with no extension | judged only by naming it: step 6 |
| A dot-path or dot-file | never discovered by the audit; a live edit there is judged like any other path, subject to gitignore, `exclude`, and `skip` |
| Generated, vendored, or build output | excluded or skipped: step 4 |
| Tests, docs, fixtures a rule should not read | skipped: step 4 |

A gitignored path needs no config.

Done: every bucket carries one outcome and one reason. Every judged bucket is a decision, not a default.

### 3. Extend the source set in the user file

Append the judged extensions to `rules.auditExtensions`. Write a bare name or one leading dot (`"astro"`, `".astro"`); casing does not matter, and an entry that still holds a dot or a slash can match no file and is dropped with a warning.

The key is **user file only**. A project file that names it is ignored with a warning, because the audit samples every file it discovers, so the source set is a privacy decision each developer makes. Propose the exact JSON; edit the file after the user confirms.

Done: every judged extension outside the built-in set is listed, and `/warden status` shows no warning naming the key.

### 4. Write the exclusions in the project file

```json
{ "rules": { "exclude": ["secrets/**", "**/*.pem"], "skip": ["tests/**", "**/*.test.*"] } }
```

A project file's `exclude` and `skip` **replace** the user's arrays, they do not add to them: repeat the user's whole list for a key the project sets. An empty array clears the user's list, and the session-start line reports only what the project added.

Write the full path you mean: the matcher allows any leading directories, so `secrets/**` also catches `vendor/secrets/x` ([scope.md](scope.md) has the full matcher).

Done: every excluded or skipped bucket is matched by a pattern, each user list is repeated whole where the project sets the key, `/warden rules` prints the effective `rules.exclude` list, and `/warden status` shows no config warning.

### 5. Scope the rules

Add a `paths:` line under the heading of each rule that fires outside its area, in the rules file in force: root `pi-warden.md`, else the effective `rules.files` list, else the fallback document.

```markdown
# No console output in library code
paths: src/**
```

Path scoping is also the request budget. Rule wording, header syntax, and the rule cap belong to [writing-warden-rules](../writing-warden-rules/SKILL.md); this step only narrows where a rule is asked.

Done: `/warden rules` lists the intended scope for each scoped rule, no header warning appears, and no rule is scoped only to paths that step 4 excludes or skips.

### 6. Verify the selection

```text
/warden rules                      # parsed rules, their paths: scopes, effective exclude patterns
/warden status                     # config warnings, unscoped rules past the cap
/warden rules audit . --max 200    # confirm dialog names the file count before anything is sent
```

A rules source may be `pi-warden.md`, `rules.files`, or, with the default `rules.fallback`, the first of `AGENTS.md`, `CLAUDE.md`, `README.md` that exists, judged as one document. With none of them, with `rules.fallback` off, or with a fallback that is prose only, the audit selects nothing.

The dialog names how many files would leave the machine. Set `--max` above the judged total, and expect the count to equal the buckets the walk can see: extensions in the source set, less gitignored, excluded, skipped, and paths no edit rule matches. A count above that means the source set or an exclusion is wrong; a count below means a bucket was mislabelled, or a cap truncated it.

A path the walk cannot see is judged only by name: `/warden rules audit Makefile bin/deploy` still honours gitignore, `exclude`, `skip`, and the rule match. Confirm only when the user agrees to spend the requests.

Done: the count reconciles as above, no config warning remains, and any `left out` line is explained.

### 7. Record

Update the one document in the repo that owns tooling setup (`docs/agents/warden.md`, or a section of `AGENTS.md`). Record the reasoning and the per-developer step the config cannot carry:

- the extensions each developer must add to their own user file, since the repo cannot ship them
- each excluded or skipped path with its reason
- the extensionless files and the explicit audit command that reaches them
- the verification commands

Done: a fresh clone, plus the recorded per-developer step, reaches the same judged set without this conversation.
