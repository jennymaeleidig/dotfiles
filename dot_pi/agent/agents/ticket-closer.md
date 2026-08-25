---
name: ticket-closer
display-name: ticket-closer
description: Validate and document an implemented ticket, then close it.
extensions:
  [
    "@ff-labs/pi-fff",
    "cc-safety-net",
    "pi-sandbox",
    "pi-compact-ex",
    "~/.vibe-island/pi-extension",
  ]
tools: "*, ext:pi-fff/grep, ext:pi-fff/find"
skills: cc-safety-net
model: deepseek-v4-flash
thinking: off
output_transcript: false
prompt_mode: replace
inherit_context: false
---