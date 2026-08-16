---
name: vision
description: >-
  Use when the active model is text-only AND a task needs visual analysis: the
  user asks to visually verify/check something ("looks right", "centered",
  "matches the design", "visible/hidden"), references a screenshot or image
  path, a tool result contains an image the model cannot see, or there is a gap
  between text output and a visual criterion. Delegates the visual reasoning to
  a vision subagent so the main context receives only structured findings.
---

# Vision

Delegate visual tasks to the `vision` subagent. Never do visual reasoning in-context — the whole point is to keep image bytes and verbose visual reasoning out of the main context.

## When NOT to invoke

Skip if the active model is vision-capable (native image input). Skip if the accessibility/text tree already answers the question.

## Steps

### 1. Detect visual intent

Sources: explicit visual language in the user prompt ("visually verify", "looks right", "centered", "matches the design"); an image path or attachment in a user message; an image attachment in a tool result; or a gap between a text description and a positional/color/readability/layout criterion.

If the text tree already answers the question, don't delegate.

### 2. Gather image paths

Prefer on-disk paths — pass the `filePath` option to screenshot tools. Assign each image a short contract id (`current`, `before`, `after`, `reference`, `detail`) and use those ids throughout.

If a tool result has only an inline base64 attachment (`data:image/...;base64,`) with no path, write the bytes to a temp file first via a Node script — never paste base64 into a shell command, prompt, or transcript.

### 3. Author the spawning prompt

Build a prompt with four sections:

- **Visual Task** — one or two sentences stating the exact visual question.
- **Images to Inspect** — `<id>: <local path> - <why it matters>` per image.
- **Response Template** — the smallest JSON object that answers the question. Prefer booleans, enums, numbers, arrays, and nullable fields over prose. Always include evidence fields and an uncertainty/failure field. Use arrays with one representative item shape for repeated findings.
- **Response Rules** — must use only the listed images; must match the template exactly (no extra keys, no prose); must cite evidence; must use `null` when a fact can't be determined.

### 4. Delegate (foreground)

```
Agent({
  subagent_type: "vision",
  description: "<short visual task description>",
  prompt: <the spawning prompt>,
})
```

### 5. Parse

The subagent returns one JSON object and nothing else. Parse it and compare its keys to your template. Retry once with the same subagent (include the invalid output plus the template) if the JSON is malformed or has missing/extra keys. Cite the evidence fields when reporting back; honor uncertainty/failure fields honestly — never invent a stronger conclusion than the subagent reported.
