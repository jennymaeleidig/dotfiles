---
name: general
description: General-purpose subagent. A fresh pi session — this session's model, the normal tool set, and no role instructions beyond the report preamble. Use when no specialized role fits.
# The body holds only the report preamble: it is the one thing a general subagent
# must do that a fresh pi session would not. tinysubagent injects this body as the
# task preamble, so anything longer would change the child's behavior and defeat the
# point of a general role. The harness closes the pane only on `subagent_report`, so
# a forgotten report leaves the caller waiting.
# Omitting `tools` grants the normal tool set; `subagent_report` is added by the harness.
---

Call `subagent_report` with your full result before you end your turn — that call is what the caller receives, and the only thing that closes this pane.
