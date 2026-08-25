---
name: effort-specifier
display-name: effort-specifier
description: Distil the wayfinding journey into an effort specification.
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
skills: to-spec, cc-safety-net, subagents
model: deepseek-v4-flash
thinking: off
output_transcript: false
prompt_mode: replace
inherit_context: false
allowed_subagents: mermaid-diagrammer
---