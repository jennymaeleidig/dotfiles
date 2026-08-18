---
description: Validate artifacts against criteria via the validate subagent
argument-hint: "<criteria> [artifacts]"
---

Run the validate skill on $@, dispatching its Compare and Report steps (3–4) to the `validate` subagent rather than running them inline.

1. Pin the criteria and artifacts (skill steps 1–2). $@ names the criteria; ask the user for anything it doesn't cover.
2. Dispatch the `validate` subagent (foreground) with a self-contained prompt naming the pinned criteria and artifact locations.
3. Report the subagent's verdict table verbatim.
