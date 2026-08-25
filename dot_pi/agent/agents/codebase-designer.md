---
name: codebase-designer
display-name: codebase-designer
description: Design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
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
skills: codebase-design, cc-safety-net, context7-docs, subagents
model: deepseek-v4-flash
thinking: off
output_transcript: false
prompt_mode: replace
inherit_context: false
allowed_subagents: general-read-write
---
