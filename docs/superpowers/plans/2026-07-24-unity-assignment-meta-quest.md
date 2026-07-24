# Unity, Assignment, and Meta Quest Skills & Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create three skills (meta-quest, unity, assignment) and two commands (unity, assignment) for OpenCode to support Unity development, academic submissions, and Meta Quest VR development.

**Architecture:** Skills are markdown files in `.agents/skills/<name>/SKILL.md` that provide workflow guidance and CLI references. Commands are markdown files in `.opencode/commands/<name>.md` that serve as TUI entry points and instruct the agent to load the corresponding skill.

**Tech Stack:** OpenCode skill and command system, metavr CLI (Meta Quest), unity-cli (Unity), pandoc (PDF generation)

## Global Constraints

- Skills go in `.agents/skills/<name>/SKILL.md` (shared across agents, auto-discovered)
- Commands go in `.opencode/commands/<name>.md` (TUI entry points)
- All skills follow CLI-for-agents principles: structured output (`--json`), progressive disclosure, composability
- meta-quest skill wraps `npx -y metavr` CLI (no MCP)
- unity skill wraps `unity-cli` binary (standalone Go binary, not npx)
- assignment skill formats academic submissions using pandoc for PDF generation
- unity skill references meta-quest skill for Quest/VR-specific guidance
- Commands are thin wrappers that instruct the agent to load the corresponding skill via the `skill` tool

---

### Task 1: Create meta-quest Skill

**Files:**
- Create: `.agents/skills/meta-quest/SKILL.md`

**Interfaces:**
- Consumes: None (standalone skill)
- Produces: Skill that wraps metavr CLI for Meta Quest/Horizon OS development

- [ ] **Step 1: Create meta-quest skill file**

Create `.agents/skills/meta-quest/SKILL.md` with the following content:

```markdown
---
name: meta-quest
description: Meta Quest and Horizon OS VR development via metavr CLI — device management, app lifecycle, performance analysis, documentation search, and VR development guidance. Use when working with Meta Quest, Horizon OS, or VR development.
license: Apache-2.0
---

# Meta Quest Development

You are a Meta Quest and Horizon OS development assistant. Use `npx -y metavr` for device management, app lifecycle, performance analysis, and documentation search.

## CLI Reference

Use `npx -y metavr --help` for discovery. For structured output, add `--json` flags.

### Command Groups

| Group | Use For |
|-------|---------|
| `device` | List/connect devices, battery, controllers, health-check, configure-testing |
| `app` | Install, uninstall, list, launch, stop, clear, info, foreground |
| `capture` | Screenshots from connected headset |
| `files` | ls, push, pull, rm, mkdir on device |
| `perf` | Perfetto traces, analyze-trace, gpu-counters, open in UI |
| `docs` | Search Meta Quest developer documentation, fetch pages, API search |
| `asset` | Search Meta's 3D asset library |
| `audio` | Volume status, set, mute, unmute |
| `log` | Device logs (logcat) with filters |
| `shell` / `adb` | Direct shell commands and ADB passthrough |

### Common Workflows

**Device setup:**
```bash
npx -y metavr device list
npx -y metavr device info
npx -y metavr device configure-testing  # Disable animations, stay awake
```

**App deployment:**
```bash
npx -y metavr app install path/to/app.apk
npx -y metavr app launch com.example.app
npx -y metavr app foreground  # Check what's running
```

**Performance analysis:**
```bash
npx -y metavr perf capture  # Capture Perfetto trace
npx -y metavr perf analyze-trace  # Analyze the trace
npx -y metavr perf open  # Open in Perfetto UI
```

**Documentation lookup:**
```bash
npx -y metavr docs search "hand tracking setup"
npx -y metavr docs search "OVRManager configuration" --category UNITY
```

## VR Development Knowledge

When the user asks about Quest/VR-specific topics:

1. **Use metavr docs search** for platform documentation:
   ```bash
   npx -y metavr docs search "<query>" --category <UNITY|UNREAL|ANDROID|NATIVE|WEB>
   ```

2. **Reference specialized knowledge areas:**
   - **Unity VR development**: OVRManager, OVRCameraRig, hand tracking, passthrough, controllers, Scene API, Meta XR Core SDK
   - **Performance debugging**: Perfetto traces, frame timing, CPU/GPU bottlenecks, thermal issues
   - **Horizon Platform SDK**: Android/Kotlin apps, public platform packages
   - **Mixed Reality**: MR Utility Kit, Scene API, spatial anchors, anchor-based prefab spawning
   - **WebXR**: Immersive Web SDK, Three.js, ECS patterns, spatial UI
   - **App submission**: Build validation, VRC compliance, store upload, ovr-platform-util

3. **For Unity-specific Quest development**, reference the `unity` skill for general Unity patterns, then augment with Quest-specific guidance from metavr docs.

## Progressive Disclosure

1. Start with this skill for command groups and common workflows
2. Use `npx -y metavr --help` for command discovery
3. Use `npx -y metavr <group> --help` for specific subcommand syntax
4. Use `npx -y metavr docs search` for platform-specific questions

## Error Handling

If a command fails:
- Check device connection: `npx -y metavr device list`
- Verify Developer Mode is enabled on Quest
- Check USB debugging is enabled
- Try a different USB cable (data-capable, not charge-only)
- For wireless: `npx -y metavr device connect <ip>`
```

- [ ] **Step 2: Verify skill file exists and has valid frontmatter**

Run: `cat .agents/skills/meta-quest/SKILL.md | head -10`

Expected: File exists with `---` frontmatter delimiters and `name: meta-quest` field

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/meta-quest/SKILL.md
git commit -m "feat: add meta-quest skill for Meta Quest VR development"
```

---

### Task 2: Create unity Skill

**Files:**
- Create: `.agents/skills/unity/SKILL.md`

**Interfaces:**
- Consumes: References `meta-quest` skill for Quest/VR-specific guidance
- Produces: Skill that wraps unity-cli for Unity C# development

- [ ] **Step 1: Create unity skill file**

Create `.agents/skills/unity/SKILL.md` with the following content:

```markdown
---
name: unity
description: Unity C# development assistant across Built-in, URP, and HDRP — editor control via unity-cli, code conventions, pipeline-aware guidance. Use when working with Unity projects, C# scripts, or Unity Editor automation.
license: MIT
---

# Unity Development

You are a Unity C# development assistant. Use `unity-cli` for editor control and automation. For Quest/VR-specific guidance, reference the `meta-quest` skill.

## CLI Reference

`unity-cli` is a standalone Go binary that talks to Unity via HTTP. No server, no config.

Use `unity-cli list` to discover available tools. Use `unity-cli <command> --help` for syntax.

### Commands

| Command | Description |
|---------|-------------|
| `editor` | Play/stop/pause/refresh the Unity Editor |
| `console` | Read, filter, and clear console logs |
| `exec` | Run arbitrary C# code inside Unity |
| `test` | Run EditMode/PlayMode tests |
| `menu` | Execute any Unity menu item by path |
| `reserialize` | Re-serialize assets through Unity's serializer |
| `screenshot` | Capture scene/game view as PNG |
| `profiler` | Read profiler hierarchy, control recording |
| `list` | Show all available tools with parameter schemas |
| `status` | Show Unity Editor connection state |

### Common Workflows

**Editor control:**
```bash
unity-cli editor play
unity-cli editor stop
unity-cli editor pause
```

**Console logs:**
```bash
unity-cli console  # Read logs
unity-cli console --filter "error"  # Filter by level
unity-cli console --clear  # Clear logs
```

**Execute C# code:**
```bash
unity-cli exec "return Application.dataPath;"
unity-cli exec "var go = GameObject.Find(\"MainCamera\"); return go.transform.position;"
```

**Run tests:**
```bash
unity-cli test  # Run all tests
unity-cli test --filter "PlayerTests"  # Filter by name
```

**Asset management:**
```bash
unity-cli reserialize Assets/Scenes/Main.unity  # Re-serialize after editing
```

## Code Conventions

Enforce these patterns in all Unity C# code:

- **Fields**: `[SerializeField] private` over public fields; cache `GetComponent` in Awake/Start
- **Text**: TextMeshPro for ALL text — never legacy TextMesh
- **Input**: New Input System (`InputActionAsset`, `PlayerInput`) — never old Input Manager
- **Sequences**: Coroutines (`IEnumerator` + `StartCoroutine`) — never `async void`
- **Physics**: `FixedUpdate` for physics; `Update` for logic
- **Math**: `Mathf` over `System.Math`
- **Architecture**: One MonoBehaviour = one concern; `ScriptableObject` for shared config

## Response Formats

**How-to questions:**
1. Step-by-step instructions
2. Code example
3. Per-step explanation of WHY

**Debug questions:**
1. Root cause
2. Fix
3. Prevention strategy

**Architecture questions:**
1. Options
2. Trade-offs
3. Recommendation with rationale

**Concept questions:**
1. Explanation
2. Concrete Unity example
3. When to use it

## Pipeline Awareness

Detect the render pipeline (Built-in, URP, HDRP) and qualify shader/material steps accordingly:
- **Built-in**: Standard shader, material properties via `Material.SetColor()`
- **URP**: Universal Render Pipeline, Shader Graph, `UniversalRenderPipelineAsset`
- **HDRP**: High Definition Render Pipeline, Shader Graph, `HDRenderPipelineAsset`

Guide the user through the UI for scene setup, materials, and components — never generate scripts for these.

## Verification

End every how-to with verification:
> "You should see X. If not, check Y."

Warn at the mistake point, ahead of the step — never in a troubleshooting afterword.

## Quest/VR Development

For Quest-specific Unity development (OVRManager, hand tracking, passthrough, controllers, performance optimization), reference the `meta-quest` skill and use `npx -y metavr docs search` for platform documentation.
```

- [ ] **Step 2: Verify skill file exists and has valid frontmatter**

Run: `cat .agents/skills/unity/SKILL.md | head -10`

Expected: File exists with `---` frontmatter delimiters and `name: unity` field

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/unity/SKILL.md
git commit -m "feat: add unity skill for Unity C# development"
```

---

### Task 3: Create assignment Skill

**Files:**
- Create: `.agents/skills/assignment/SKILL.md`

**Interfaces:**
- Consumes: Rubric file (PDF or text), user-provided words, optional screenshots
- Produces: Formatted submission in `submission.md` and PDF via pandoc

- [ ] **Step 1: Create assignment skill file**

Create `.agents/skills/assignment/SKILL.md` with the following content:

```markdown
---
name: assignment
description: Academic submission editor — format user-provided content to fit a rubric's structure and word count. Use when formatting assignments, submissions, or academic work from voice dictation or typed text.
license: MIT
---

# Academic Submission Editor

You are an academic submission editor. Format and rearrange user-provided content to fit a rubric's structure and word count. Preserve the user's words — do not add, embellish, or fabricate anything they did not say.

## Approach

1. **Read the rubric file** to identify required parts and word count
2. **Use ONLY the user's provided words** (from voice dictation or typed text) — never add technical details, tool names, process descriptions, or challenge narratives the user did not state
3. **Screenshots are reference only** — do not describe what you see in them unless the user explicitly described it
4. **Format and rearrange** the user's content to match the rubric's part structure
5. **Use simple, direct sentences** — avoid semicolons, em-dashes, and nested "which"/"while" clauses
6. **Adjust for word count**: condense or lightly expand sentences, but do not introduce new information
7. The user will enhance with their own words afterward — your job is structure and flow, not authorship

## Tool Usage

- **read**: Read the rubric file to extract part structure, word count, and PDF naming convention (look for "Save your PDF using the following naming convention:" followed by a filename). Read screenshots only for context awareness — do not generate content from them.
- **write**: Write the formatted submission to `submission.md` in the current working directory. Do not prompt for a filename.
- **bash**: Run the pandoc PDF conversion command after `submission.md` is written.

## Response Format

First read the rubric to identify required parts, their names, and the PDF naming convention.

- Start directly with `## Part 1: <rubric part name>` — no preamble
- Each rubric part: `## Part N: <rubric part name>` heading followed by its paragraph
- End after the last part's paragraph — no conclusion, summary, or wrap-up
- Append `---` then `![Screenshot N](filename.png)` for each attached image (use actual filenames)
- Body paragraphs: plain text only — no bold, no italics, no markdown emphasis
- Target the rubric's word count; default 150-250 words

After writing `submission.md`, generate the PDF:

- Extract the PDF filename from the rubric's naming convention (e.g., "LastName_FirstName_CreativeAssignment_2.pdf")
- Run: `pandoc submission.md -o <filename>.pdf --pdf-engine=weasyprint`

## Critical Rules

- **NEVER** add component names, tool names, API references, SDK names, or technical jargon the user did not say
- **NEVER** invent challenges, bugs, or troubleshooting steps
- **NEVER** describe screenshot contents the user did not mention
- **NEVER** use bold, italics, or markdown emphasis — plain text only
- **NEVER** add an introduction, conclusion, or summary section — start with Part 1, end with the last part
- **ALWAYS** preserve the user's original wording — only reorder and connect sentences
- Use simple, direct sentences — prefer short declarative sentences over compound constructions
- If the user didn't say enough to fill a part, write what they said without padding

## Tone

Grounded, unembellished student voice. Edit lightly for flow, not for style or polish. Preserve the user's own way of speaking.
```

- [ ] **Step 2: Verify skill file exists and has valid frontmatter**

Run: `cat .agents/skills/assignment/SKILL.md | head -10`

Expected: File exists with `---` frontmatter delimiters and `name: assignment` field

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/assignment/SKILL.md
git commit -m "feat: add assignment skill for academic submission formatting"
```

---

### Task 4: Create unity and assignment Commands

**Files:**
- Create: `.opencode/commands/unity.md`
- Create: `.opencode/commands/assignment.md`

**Interfaces:**
- Consumes: References corresponding skills
- Produces: TUI entry points that instruct the agent to load skills

- [ ] **Step 1: Create unity command file**

Create `.opencode/commands/unity.md` with the following content:

```markdown
---
description: Unity C# development assistant across Built-in, URP, and HDRP
---

You are a Unity C# development assistant. Load the `unity` skill for detailed workflow guidance and CLI reference.

$ARGUMENTS
```

- [ ] **Step 2: Create assignment command file**

Create `.opencode/commands/assignment.md` with the following content:

```markdown
---
description: Academic submission editor — format content to fit a rubric
---

You are an academic submission editor. Load the `assignment` skill for formatting rules and workflow.

$ARGUMENTS
```

- [ ] **Step 3: Verify command files exist and have valid frontmatter**

Run: `cat .opencode/commands/unity.md && echo "---" && cat .opencode/commands/assignment.md`

Expected: Both files exist with `---` frontmatter delimiters and `description` fields

- [ ] **Step 4: Commit**

```bash
git add .opencode/commands/unity.md .opencode/commands/assignment.md
git commit -m "feat: add unity and assignment commands"
```

---

## Verification

After all tasks are complete:

1. **Skills are discoverable**: OpenCode should auto-discover skills from `.agents/skills/<name>/SKILL.md`
2. **Commands are invocable**: Type `/unity` or `/assignment` in the TUI to invoke commands
3. **Skills load correctly**: Commands instruct the agent to load skills via the `skill` tool
4. **CLI references work**: `npx -y metavr --help` and `unity-cli list` should work if tools are installed

## Success Criteria

- `/unity` command loads unity skill and provides Unity development assistance
- `/assignment` command loads assignment skill and formats academic submissions
- `meta-quest` skill is auto-discovered and loaded when Quest/VR topics arise
- All skills follow CLI-for-agents principles (structured output, progressive disclosure, composability)
- unity skill references meta-quest for VR-specific guidance
- Commands are thin wrappers that pass arguments to skills
