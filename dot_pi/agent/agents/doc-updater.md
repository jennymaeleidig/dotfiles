---
name: doc-updater
display-name: doc-updater
description: Update the docs and notes touched by completed work so they stay accurate with the implementation.
extensions:
  [
    "@ff-labs/pi-fff",
    "cc-safety-net",
    "pi-sandbox",
    "pi-compact-ex",
    "~/.pi/agent/extensions/format-md-tables/index.ts",
    "~/.vibe-island/pi-extension",
  ]
tools: "*, ext:pi-fff/grep, ext:pi-fff/find, ext:format-md-tables/format_md_tables"
skills: domaing-modeling, writing-for-agents, no-ai-slop, cc-safety-net, subagents
model: deepseek-v4-flash
thinking: off
output_transcript: false
prompt_mode: replace
inherit_context: false
allowed_subagents: mermaid-diagrammer
---
