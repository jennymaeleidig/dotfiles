---
name: general
description: General-purpose subagent. A fresh pi session — this session's model, the normal tool set, no role instructions. Use when no specialized role fits.
# Intentionally no body: the child must behave exactly like a fresh pi session.
# tinysubagent injects this body as the task preamble, so any text here would
# change the child's behavior and defeat the point of a general role.
# Omitting `tools` grants the normal tool set; `subagent_report` is added by the harness.
---
