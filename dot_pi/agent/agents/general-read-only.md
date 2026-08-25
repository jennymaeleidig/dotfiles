---
name: general-read-only
description: >-
  General-purpose read-only agent: research complex questions, search for code, verify information. Use when a search will likely take several tries — spend the subagent's context, not yours.
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
tools: "read, grep, find, ls, ext:context7/resolve-library-id, ext:context7/query-docs, ext:pi-fff/grep, ext:pi-fff/find, ext:pi-web-access/fetch_content"
skills: cc-safety-net, context7-docs
model: deepseek-v4-flash
thinking: off
output_transcript: false
prompt_mode: append
inherit_context: false
source: https://github.com/tintinweb/pi-subagents/blob/master/src/default-agents.ts#L17
---
