---
name: ticket-creator
display-name: ticket-creator
description: Break an effort spec into implementation tickets.
extensions:
  [
    "@ff-labs/pi-fff",
    "cc-safety-net",
    "pi-sandbox",
    "pi-compact-ex",
    "~/.pi/agent/extensions/format-md-tables/index.ts",
    "~/.vibe-island/pi-extension",
  ]
tools: "*, ext:pi-fff/grep, ext:pi-fff/find"
skills: to-tickets, cc-safety-net, subagents
model: deepseek-v4-flash
thinking: off
output_transcript: false
prompt_mode: replace
inherit_context: false
allowed_subagents: mermaid-diagrammer
---