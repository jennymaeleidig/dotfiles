---
name: edit-workflow
description: Hash-anchored edit workflow for the pi-hashline-edit-pro `replace` tool. Load when editing existing files — covers `hash_range_inclusive`/`content_lines` syntax, read-before-edit anchors, batch rules, error recovery, and worked examples.
---

# Edit Workflow (pi-hashline-edit-pro)

The `replace(path, changes)` tool replaces lines using hash anchors from `read`. Every line returned by `read` carries a `HASH│content` prefix; the 3-character HASH (URL-safe base64 `A-Za-z0-9-_`, e.g. `aB3`, `4yN`, `-qk`) is the anchor. The line number is not part of the wire format.

## Prerequisite: `read` before `replace`

Always `read(path)` first to obtain current `HASH│content` anchors. Anchors go stale when their lines change; anchors for **untouched** regions stay valid across edits, so a re-`read` only needs to cover the region you plan to edit.

## Change shape

```
{ "hash_range_inclusive": ["start_hash", "end_hash"], "content_lines": ["line1", "line2"] }
```

- `hash_range_inclusive`: a pair of 3-character HASH anchors. The **entire inclusive span** (start through end) is deleted and replaced with `content_lines`.
- `content_lines`: literal replacement content, one string per line. **No `HASH│` prefix.** No already-existing context lines from outside the range.
- `content_lines: []` deletes the range.
- To append after the last line: include the old last line's hash in the range, then add the new line(s) after the old content in `content_lines`.

## Batch rules

- Batch every change to one file in a **single** `replace` call (atomic apply).
- Ranges must be non-overlapping — rejected as `[E_EDIT_CONFLICT]`.
- Batch is snapshot-based, not sequential; don't renumber later edits after earlier insert/delete ops. Batch independent ranges together.

## Error recovery

- `[E_STALE_ANCHOR]` → the anchored line changed since the last `read`. Re-`read` for fresh anchors, copy the new 3-char hashes into `hash_range_inclusive`, retry.
- `[E_EDIT_CONFLICT]` → two ranges overlap. Make them non-overlapping.
- `[E_BARE_HASH_PREFIX]` / `[E_INVALID_PATCH]` → a `content_lines` entry starts with `HASH│`. Remove the prefix; use literal file content only (plain `+`/`-` lines are fine).
- `[E_WOULD_EMPTY]` → the edit would empty a non-empty file; adjust the range.

## Worked examples

<example>
Single-line replace — change `const x = 99;` to `const x = 1;`.

`read` returns: `MQX│const x = 99;`

```json
{ "path": "src/main.ts", "changes": [
  { "hash_range_inclusive": ["MQX", "MQX"], "content_lines": ["const x = 1;"] }
] }
```

</example>

<example>
Multi-line range replace — swap a function body. `read` returns:

```
ZPM│function greet(name) {
VRW│  return `Hello, ${name}`;
abc│}
```

```json
{ "path": "src/main.ts", "changes": [
  { "hash_range_inclusive": ["ZPM", "abc"], "content_lines": [
    "function greet(name) {",
    "  return `Hi, ${name}`;",
    "}"
  ] }
] }
```

The closing `}` is **inside** the replaced range, so it's not duplicated. Do not include lines outside the range in `content_lines`.
</example>

<example>
Delete a range (lines `aB3` through `xY7`):

```json
{ "path": "src/server.ts", "changes": [
  { "hash_range_inclusive": ["aB3", "xY7"], "content_lines": [] }
] }
```

</example>

<example>
Append after the last line. `read` ends with `ZPM│const y = 2;`:

```json
{ "path": "src/main.ts", "changes": [
  { "hash_range_inclusive": ["ZPM", "ZPM"], "content_lines": ["const y = 2;", "const z = 3;"] }
] }
```

The old last line is re-included in `content_lines`, then the new line follows it.
</example>

<example>
Multiple non-adjacent regions in one call — delete two separate ranges:

```json
{ "path": "src/server.ts", "changes": [
  { "hash_range_inclusive": ["aB3", "xY7"], "content_lines": [] },
  { "hash_range_inclusive": ["MQX", "ZPM"], "content_lines": [] }
] }
```

</example>

## When to use `replace` vs alternatives

- `write` — new files or complete rewrites.
- `replace` — surgical, line-level changes to existing files (hash-anchored). Prefer over `write` for small changes.
- `ast_grep_replace` — semantic pattern refactor across many sites (e.g. `console.log($MSG)` → `logger.info($MSG)`, `var $X` → `let $X`). Dry-run by default; `apply: true` to write.
