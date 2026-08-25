---
name: general-read-write
description: >-
  General-purpose read-write agent: research complex questions, search for code, execute multi-step tasks. Use when a search will likely take several tries and the task also writes files or runs commands — spend the subagent's context, not yours.
extensions:
  [
    "@ff-labs/pi-fff",
    "context7",
    "pi-web-access",
    "cc-safety-net",
    "pi-sandbox",
    "pi-compact-ex",
    "~/.vibe-island/pi-extension",
  ]
tools: "*, ext:context7/resolve-library-id, ext:context7/query-docs, ext:pi-fff/grep, ext:pi-fff/find, ext:pi-web-access/fetch_content"
skills: cc-safety-net, subagents, context7-docs, writing-for-agents
model: deepseek-v4-flash
thinking: off
output_transcript: false
prompt_mode: append
inherit_context: false
isDefault: true
source: https://github.com/tintinweb/pi-subagents/blob/master/src/default-agents.ts#L17
allowed_subagents: ralph-runner
---
