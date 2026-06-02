# unity-context Specification

## Purpose
Defines the `unity-context` and `unity-list-packages` custom tools registered via TypeScript extension. Covers Unity project metadata extraction (version, render pipeline, dimension, capabilities) from ProjectSettings and Packages/manifest.json. The extraction logic lives in a separate bash script for testability.
## Requirements
### Requirement: Tool registered via TypeScript extension

The `unity-context` custom tool SHALL be registered using `pi.registerTool()` within a TypeScript extension file at `dot_pi/agent/extensions/unity-tools.ts`. The tool SHALL be auto-discovered by pi from the `extensions/` convention directory. A second tool, `unity-list-packages`, SHALL be registered in the same extension file.

#### Scenario: Extension auto-discovered

- **WHEN** pi starts with `dot_pi/agent/extensions/` (chezmoi source path) containing `unity-tools.ts`
- **THEN** both `unity-context` and `unity-list-packages` tools SHALL be available to the LLM without any additional flags

### Requirement: Tool extracts Unity project metadata

When invoked, the `unity-context` tool SHALL execute a bash script that reads the Unity project's configuration files and returns a JSON object with the following fields: `unityVersion`, `renderPipeline`, `dimension`, `template`, `projectPath`, and `capabilities`.

#### Scenario: Extracting from a valid Unity project

- **WHEN** the tool is called from the root of a Unity project containing `ProjectSettings/ProjectVersion.txt`
- **THEN** the tool SHALL return JSON with the Unity version parsed from the file
- **AND** the render pipeline SHALL be detected from `ProjectSettings/GraphicsSettings.asset`
- **AND** the template SHALL be detected from `ProjectSettings/ProjectSettings.asset`
- **AND** the dimension SHALL be detected from `ProjectSettings/EditorSettings.asset`
- **AND** the capabilities SHALL be derived from `Packages/manifest.json` using heuristic categorization

#### Scenario: Not in a Unity project

- **WHEN** the tool is called from a directory that does not contain `ProjectSettings/ProjectVersion.txt`
- **THEN** the tool SHALL return an error message indicating the directory is not a Unity project
- **AND** the error SHALL be surfaced to the LLM as the tool result

### Requirement: Bash extraction logic is separate from extension

The Unity project metadata extraction logic SHALL reside in a standalone bash script (`dot_pi/agent/extensions/unity-context.sh`) that is called by the TypeScript extension via `execSync`. This separation SHALL allow the extraction script to be tested independently.

#### Scenario: Bash script runs independently

- **WHEN** `bash unity-context.sh` is executed in a Unity project root
- **THEN** it SHALL output the same JSON as when called via the pi tool
- **AND** the JSON SHALL include `dimension` and `capabilities` fields

### Requirement: No parameters required

The `unity-context` tool SHALL accept no parameters — it extracts context from the current working directory automatically. The TypeBox schema SHALL be `Type.Object({})`.

#### Scenario: Tool called without arguments

- **WHEN** the LLM invokes `unity-context` with no arguments
- **THEN** the tool SHALL execute successfully and return project metadata

### Requirement: Heuristic package categorization

The `unity-context` bash script SHALL include a `categorize()` function that classifies package names into capability domains using pattern matching on the package identifier string. Known patterns SHALL include: `*xr*` → xr, `*inputsystem*` → input, `*render-pipeline*` → rendering, `*mcp*|*ml-agent*|*sentis*` → ai_integration, `*netcode*|*transport*|*multiplayer*` → networking, `*entities*|*jobs*|*burst*` → ecs, `*probuilder*|*cinemachine*` → editor.

#### Scenario: Known package matches its category

- **WHEN** a package name contains known pattern substrings
- **THEN** the package SHALL be assigned to the corresponding capability category
- **AND** the output SHALL include the package name and version in `capabilities.<category>[]`

#### Scenario: Unknown package falls to other catchall

- **WHEN** a package name does not match any known pattern AND is not in the ignore list
- **THEN** the package SHALL appear in `capabilities.other[]` with name and version

#### Scenario: Module, IDE, test, and ubiquitous packages are ignored

- **WHEN** a package name starts with `com.unity.modules.` or `com.unity.ide.`, or is `com.unity.test-framework`
- **THEN** the package SHALL be excluded from all capability output

### Requirement: Dimension detection from EditorSettings

The `unity-context` bash script SHALL parse `ProjectSettings/EditorSettings.asset` to extract `m_DefaultBehaviorMode` and report the project dimension.

#### Scenario: 3D project detected

- **WHEN** `m_DefaultBehaviorMode` is `0`
- **THEN** the output SHALL include `"dimension": "3D"`

#### Scenario: 2D project detected

- **WHEN** `m_DefaultBehaviorMode` is `1`
- **THEN** the output SHALL include `"dimension": "2D"`

#### Scenario: EditorSettings.asset missing

- **WHEN** `ProjectSettings/EditorSettings.asset` does not exist
- **THEN** the output SHALL include `"dimension": null`

### Requirement: Capabilities output shape

The `capabilities` field in the tool output SHALL be a JSON object where each key is a category name (or `"other"`) and each value is an array of `"packageName@version"` strings. Categories with no detected packages SHALL be omitted from the output.

#### Scenario: Capabilities with matches and other catchall

- **WHEN** a project has Meta XR SDK, Input System, and an unknown custom package
- **THEN** the output capabilities SHALL contain `"xr": ["com.meta.xr.sdk.all@201.0.0"]`, `"input": ["com.unity.inputsystem@1.19.0"]`, and `"other": ["com.custom.thing@1.0.0"]`
- **AND** empty categories SHALL be absent from the output

### Requirement: unity-list-packages tool

The TypeScript extension SHALL register a second tool named `unity-list-packages` that returns the full unfiltered package manifest.

#### Scenario: Full manifest dump on demand

- **WHEN** the LLM invokes `unity-list-packages`
- **THEN** the tool SHALL return all `dependencies` from `Packages/manifest.json` with no filtering or categorization applied

#### Scenario: Tool called outside Unity project

- **WHEN** `unity-list-packages` is called from a directory without `Packages/manifest.json`
- **THEN** the tool SHALL return an error message indicating no manifest was found

