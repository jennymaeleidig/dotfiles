# Unity, Assignment, and Meta Quest Skills & Commands

## Overview

Create three skills and two commands for OpenCode:

| Artifact | Type | Location | Purpose |
|----------|------|----------|---------|
| `meta-quest` | Skill | `.agents/skills/meta-quest/SKILL.md` | Meta Quest/Horizon OS VR development via metavr CLI |
| `unity` | Skill | `.agents/skills/unity/SKILL.md` | Unity C# development via unity-cli |
| `assignment` | Skill | `.agents/skills/assignment/SKILL.md` | Academic submission editor |
| `unity` | Command | `.opencode/commands/unity.md` | TUI entry point that loads unity skill |
| `assignment` | Command | `.opencode/commands/assignment.md` | TUI entry point that loads assignment skill |

**Skills** go in `.agents/skills/` (shared across agents, auto-discovered). **Commands** go in `.opencode/commands/` (TUI entry points that reference skills).

## Design Principles

All skills follow CLI-for-agents principles:
- **Structured output**: Use `--json` flags where available
- **Progressive disclosure**: Skill as routing layer → CLI `--help` for discovery → specific subcommand `--help` for details
- **Composability**: Agent can chain CLI tools with other commands
- **Error messages**: Tell the agent what to do next

## meta-quest Skill

Wraps `npx -y metavr` CLI. No MCP. Provides routing to Meta Quest/Horizon OS development knowledge.

### CLI Coverage

| Command Group | Subcommands | Use For |
|---------------|-------------|---------|
| `device` | list, info, connect, disconnect, reboot, wake, battery, controllers, configure-testing, health-check | Device management |
| `app` | install, uninstall, list, launch, stop, clear, info, path, foreground | App lifecycle |
| `capture` | screenshot | Screenshots |
| `files` | ls, push, pull, rm, mkdir | File management |
| `perf` | capture, analyze-trace, gpu-counters, open, load, context | Performance analysis |
| `docs` | search, fetch, api-search, api-details | Documentation lookup |
| `asset` | search | Meta's 3D asset library |
| `audio` | status, set, mute, unmute | Audio control |
| `log` | logcat with filters | Device logs |
| `shell/adb` | passthrough commands | Low-level access |

### Knowledge Routing

When the user asks about Quest/VR-specific topics, the skill instructs the agent to:
1. Use `npx -y metavr docs search <query>` for platform documentation
2. Reference specialized knowledge areas:
   - Unity VR development (OVRManager, hand tracking, passthrough, controllers)
   - Performance debugging (Perfetto traces, frame timing, thermal issues)
   - Horizon Platform SDK (Android/Kotlin apps)
   - Mixed Reality (MR Utility Kit, Scene API, spatial anchors)
   - WebXR (Immersive Web SDK, Three.js)
   - App submission (build validation, VRC compliance, store upload)

### CLI-for-Agents Principles

- Use `--json` flags for structured output
- Progressive disclosure: skill → `metavr --help` → `metavr <group> --help`
- Composable: agent can chain metavr with other tools
- Error messages tell the agent what to do next

## unity Skill

Wraps `unity-cli` — a standalone Go binary that talks to Unity via HTTP. No server, no config, no npx.

### Responsibilities

- Survey existing project code before writing scripts
- Pipeline-aware (Built-in, URP, HDRP) — detect and qualify shader/material steps
- Lead with working code, explain WHY
- Guide UI setup (scenes, materials, components) — never generate scripts for these
- Warn at the mistake point, not as a troubleshooting afterword
- End with verification: "You should see X. If not, check Y"

### Code Conventions Enforced

- `[SerializeField] private` over public fields; cache `GetComponent` in Awake/Start
- TextMeshPro for ALL text; New Input System for input
- Coroutines for sequences; never `async void`
- `FixedUpdate` for physics; `Update` for logic; `Mathf` over `System.Math`
- One MonoBehaviour = one concern; ScriptableObject for shared config

### Response Formats

- **How-to**: step-by-step + code + per-step explanation
- **Debug**: root cause → fix → prevention
- **Architecture**: options → trade-offs → recommendation
- **Concept**: explanation + Unity example + when to use it

### Runtime Tools

- `unity-cli` — editor control, console logs, exec C#, tests, menu items, reserialize, screenshot, profiler
- `npx -y metavr` — for Quest/VR-specific tasks (references `meta-quest` skill)

### CLI-for-Agents Principles

- Use `--json` flags where available
- Progressive disclosure: skill → `unity-cli list` → specific command `--help`
- Composable: agent can chain unity-cli with other tools

## assignment Skill

Academic submission editor. Formats user-provided content to fit a rubric's structure and word count.

### Responsibilities

- Read rubric file to identify required parts and word count
- Use ONLY user's provided words (from voice dictation or typed text)
- Never add, embellish, or fabricate content
- Format and rearrange content to match rubric's part structure
- Simple, direct sentences — avoid semicolons, em-dashes, nested clauses
- Adjust for word count: condense or lightly expand, but no new information
- User will enhance with their own words afterward

### Tool Usage

- `read` — rubric file for structure, word count, PDF naming convention
- `write` — formatted submission to `submission.md`
- `bash` — pandoc PDF conversion

### Response Format

- Start with `## Part 1: <rubric part name>` — no preamble
- Each rubric part: `## Part N: <rubric part name>` heading + paragraph
- End after last part — no conclusion, summary, or wrap-up
- Append `---` then `![Screenshot N](filename.png)` for each attached image
- Plain text only — no bold, italics, or markdown emphasis
- Target rubric's word count; default 150-250 words

### Critical Rules

- NEVER add component names, tool names, API references, SDK names, or technical jargon the user didn't say
- NEVER invent challenges, bugs, or troubleshooting steps
- NEVER describe screenshot contents the user didn't mention
- ALWAYS preserve user's original wording — only reorder and connect sentences
- Use simple, direct sentences — prefer short declarative over compound

### Tone

Grounded, unembellished student voice. Edit lightly for flow, not for style or polish.

## unity Command

TUI entry point at `.opencode/commands/unity.md`. Commands are prompt templates — the content IS the prompt that runs when the user types `/unity`.

### Format

```markdown
---
description: Unity C# development assistant across Built-in, URP, and HDRP
---

You are a Unity C# development assistant. Load the `unity` skill for detailed workflow guidance and CLI reference.

$ARGUMENTS
```

The command:
1. Sets the agent's role via the prompt content
2. Instructs the agent to load the `unity` skill (via the `skill` tool) for full workflow guidance
3. Passes `$ARGUMENTS` for context (e.g., `/unity how do I set up XR?`)

## assignment Command

TUI entry point at `.opencode/commands/assignment.md`.

### Format

```markdown
---
description: Academic submission editor — format content to fit a rubric
---

You are an academic submission editor. Load the `assignment` skill for formatting rules and workflow.

$ARGUMENTS
```

The command:
1. Sets the agent's role via the prompt content
2. Instructs the agent to load the `assignment` skill (via the `skill` tool) for full workflow guidance
3. Passes `$ARGUMENTS` for context (e.g., `/assignment "my words here" rubric.pdf screenshot1.png`)

## Integration Points

### unity ↔ meta-quest

The unity skill references meta-quest when working on Quest/VR projects:
- Quest-specific input handling (controllers, hand tracking)
- VR performance optimization (Perfetto, thermal)
- Passthrough and mixed reality
- OVRManager and Meta XR Core SDK

### Commands ↔ Skills

Commands are thin entry points that load skills:
- Commands provide the TUI interface and argument parsing
- Skills provide the detailed workflow guidance and CLI reference
- Commands pass `$ARGUMENTS` to skills for context

## File Structure

```
.agents/skills/
├── meta-quest/
│   └── SKILL.md
├── unity/
│   └── SKILL.md
└── assignment/
    └── SKILL.md

.opencode/commands/
├── unity.md
└── assignment.md
```

## Success Criteria

- `/unity` command loads unity skill and provides Unity development assistance
- `/assignment` command loads assignment skill and formats academic submissions
- `meta-quest` skill is auto-discovered and loaded when Quest/VR topics arise
- All skills follow CLI-for-agents principles (structured output, progressive disclosure, composability)
- unity skill references meta-quest for VR-specific guidance
- Commands are thin wrappers that pass arguments to skills
