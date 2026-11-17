# Scope reference

The keys themselves are documented in the pi-warden repository: [configuration.md](https://github.com/DevMortimer/pi-warden/blob/main/docs/configuration.md) carries the `rules.auditExtensions` row and the Project config section, and [guards.md → Rules](https://github.com/DevMortimer/pi-warden/blob/main/docs/guards.md#rules) carries path scoping and the two audit commands. Neither ships in the npm package. This file gives the ordered selection rules and the details those pages leave out, verified against pi-warden 2.12.1.

## Gates `/warden rules audit` applies, in order

| # | Gate |
| --- | --- |
| 1 | Inside the project: the resolved path is under the project root |
| 2 | No path segment starts with `.`, and no segment is a skip directory |
| 3 | The extension is in the source set |
| 4 | Not `.gitignore`d |
| 5 | Not matched by `rules.exclude` |
| 6 | Not matched by `rules.skip` |
| 7 | At least one edit rule applies: unscoped, or its `paths:` matches |
| 8 | Under the cap |

Gates 2 and 3 are decided inside the discovery walk, so they only see files the walk reached and they spend the walk's budget first. Gates 4–7 filter afterwards, which is why `exclude` and `skip` cost the walk nothing. Gate 7 asks only about edit rules, so a file whose only matching rule has `when: turn` is never audited.

## What the walk never sees

- **Any entry whose name starts with `.`**, file or directory, at every level: `.github/workflows/ci.yml` and `.env` are both invisible, and no setting reaches them.
- **Extensionless names**: `Makefile`, `Dockerfile`, `bin/deploy`. A file's extension is what follows its last dot, and a name with no dot has none.
- **Unknown extensions** that were never added to the source set.
- **Skip directories**, at any depth:

  `.git`, `node_modules`, `dist`, `build`, `.next`, `.output`, `coverage`, `.cache`, `__pycache__`, `.pi-warden`, `vendor`, `.turbo`, `.vercel`, `.netlify`, `.svelte-kit`

## Explicit paths

A **named file** skips gates 2 and 3, so an extensionless file, or one under a skip directory, can be judged by name. Gates 1, 4, 5, 6 and 7 still apply, so a named file under `rules.exclude` or `rules.skip` is never selected.

A **named directory** is walked, not listed: its dot entries, skip directories, and unknown extensions are skipped exactly as for the project root.

## The matcher

`rules.exclude`, `rules.skip`, and a rule's `paths:` share one matcher, run against the project-relative path with forward slashes:

| Pattern | Matches |
| --- | --- |
| `*` | any run of characters within one path segment |
| `**` | any run of characters, across segments |
| `**/x` | `x` at any depth |
| `?` | one character |

Any leading directories are allowed before the pattern: a pattern is not anchored to the project root. Braces and `!` are literal; a leading `./` on the path is stripped first. `paths:` takes a comma- or whitespace-separated list, one line per rule; a second `paths:` line is ignored with a warning.

## Extension entries

An entry is trimmed, one leading dot is stripped, lowercased, and deduplicated. A non-string, or an entry empty after normalization, is dropped silently.

## Caps

`/warden rules audit` collects at most 5000 files from each walked path, then sorts the selection. `--max` defaults to 50; a file cut by `--max` never reaches the confirm dialog's count, and the run reports how many it left out.

`/warden audit` counts at most 200 source files per project, applying none of gates 4 and 5–7; its prompt carries the counts, not the files.
