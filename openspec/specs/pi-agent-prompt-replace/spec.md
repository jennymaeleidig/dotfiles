# pi-agent-prompt-replace Specification

## Purpose
General template for self-contained agent prompts loaded via `--system-prompt` (replaces all pi defaults). Defines the structural requirements for prompts that must be fully self-sufficient — no APPEND_SYSTEM.md, no hardcoded tool list, no pi docs pointer. Domain-specific prompts (e.g., ask-llm.md, search-web.md) extend this spec with their own tool strategy, attribution rules, and query templates.

## ADDED Requirements

### Requirement: Prompt file location

A replace-mode agent prompt file SHALL reside at `dot_pi/agent/prompts/<name>.md` relative to the chezmoi source root, where `<name>` is a kebab-case identifier for the domain. When applied via `chezmoi apply`, the `dot_` prefix SHALL be converted to `.` yielding the target path. The file SHALL be loaded via `--system-prompt` from a shell script. When loaded, it SHALL replace pi's entire hardcoded preamble (tool list, guidelines, docs pointer) — the prompt MUST be fully self-contained.

#### Scenario: Prompt replaces default system prompt

- **WHEN** pi is launched with `--system-prompt "$(cat ~/.pi/agent/prompts/ask-llm.md)"`
- **THEN** the hardcoded pi preamble (tool list, guidelines, docs pointer) SHALL be skipped
- **AND** `APPEND_SYSTEM.md` SHALL NOT be loaded
- **AND** the prompt content SHALL serve as the complete system message (before project context and skills)

### Requirement: Structural sections

The prompt SHALL contain exactly these sections in order: an Identity line (opening, no heading), an Approach section, a Tool Strategy section, a Response Format section, an optional Attribution section, an optional Sources section, and a Tone section. The prompt MAY include an optional Math Formatting section between the Identity line and Approach.

#### Scenario: Valid replace-prompt structure

- **WHEN** the prompt is validated against this spec
- **THEN** the first non-whitespace line SHALL be an Identity line describing the agent's role
- **AND** it SHALL contain `## Approach`, `## Tool Usage` (or equivalent name), `## Response Format`, and `## Tone`
- **AND** optional sections for Math Formatting, Attribution, and Sources MAY appear
- **AND** it SHALL NOT contain `## Enforcement` or `## Investigation Principles` as separate sections (enforcement rules belong in Approach or Tool Strategy)

### Requirement: Self-contained tool strategy

Since `APPEND_SYSTEM.md` is not loaded in replace mode, the prompt SHALL define its own tool usage strategy. The Tool Strategy section SHALL enumerate the tools available to the agent, their purpose, and usage rules. It SHALL be self-sufficient — the agent MUST be able to operate with ONLY the tools described in this section.

#### Scenario: Prompt defines its own tool chain

- **WHEN** the prompt is read
- **THEN** the Tool Strategy section SHALL list the tools the agent can use
- **AND** each tool SHALL include usage guidance
- **AND** the section SHALL NOT reference tools that are unavailable in replace mode (e.g., edit, write, unless explicitly enabled)

#### Scenario: Agent operates with only defined tools

- **WHEN** the agent receives a query in replace mode
- **THEN** the agent SHALL only use tools described in the prompt's Tool Strategy section
- **AND** the agent SHALL NOT attempt to use tools from the hardcoded pi preamble (they are not loaded)

### Requirement: Identity line

The first non-whitespace content of the prompt SHALL be an Identity line. It SHALL be a single sentence describing the agent's role and expertise. It SHALL NOT be prefixed with a Markdown heading.

#### Scenario: Identity line opens the prompt

- **WHEN** the prompt file is read
- **THEN** the first non-whitespace line SHALL describe the agent's role
- **AND** this line SHALL NOT start with `#`

### Requirement: Approach section

The `## Approach` section SHALL define HOW the agent should think and reason. It SHALL include reasoning philosophy, tool selection principles, and output quality expectations. Since no APPEND_SYSTEM is loaded, the Approach SHALL cover investigation principles that APPEND_SYSTEM would normally provide.

#### Scenario: Approach covers investigation

- **WHEN** the Approach section is read
- **THEN** it SHALL include at minimum: a reasoning philosophy (e.g., "reason step-by-step"), investigation principles, and guidance on when to use tools vs. reasoning alone

### Requirement: Response Format section

The `## Response Format` section SHALL define output templates for common query types. It SHALL cover at minimum three query types (e.g., concept, how-to, problem-solving, comparison, quick-fact). Each template SHALL specify the structural pattern.

#### Scenario: Response Format covers query types

- **WHEN** the Response Format section is read
- **THEN** it SHALL define response structures for at least three query types
- **AND** each SHALL specify a structural template

### Requirement: Optional Math Formatting section

The prompt MAY include a `## Math Formatting` section between the Identity line and Approach. If present, it SHALL specify LaTeX delimiters for inline (`$...$`) and display (`$$...$$`) math. This section SHOULD only be included when the domain involves mathematical content.

#### Scenario: Math section when domain involves math

- **WHEN** the prompt is for a reasoning agent (ask-llm)
- **THEN** it MAY include a Math Formatting section specifying `$expression$` and `$$equation$$`

#### Scenario: No math section for non-math domains

- **WHEN** the prompt is for a search agent (search-web)
- **THEN** it SHALL NOT include a Math Formatting section unless the domain requires it

### Requirement: Optional Attribution and Sources sections

The prompt MAY include `## Attribution` and `## Sources section` (or `### Sources`) sections. If present, the Attribution section SHALL define inline citation format (bracketed numbers [1], [2]). The Sources section SHALL define the format for source lists: Title, URL, Description, Date. These sections SHALL only be included for agents that cite external information.

#### Scenario: Citation format when agent cites sources

- **WHEN** the prompt includes Attribution and Sources sections
- **THEN** citations SHALL use bracketed numbers inline
- **AND** source entries SHALL include Title, URL, Description, and Date fields

#### Scenario: No citation for non-research agents

- **WHEN** the prompt is for a coding agent that does not cite external sources
- **THEN** it SHALL NOT include Attribution or Sources sections

### Requirement: Tone section

The prompt SHALL end with a `## Tone` section. It SHALL be a single line establishing the voice for this domain's responses. Since no APPEND_SYSTEM tone is loaded, the tone SHALL be fully self-contained.

#### Scenario: Tone is the final section

- **WHEN** the prompt is read
- **THEN** `## Tone` SHALL be the final section
- **AND** it SHALL be exactly one line

### Requirement: No duplication with hardcoded guidelines

The prompt SHALL NOT duplicate tool guidelines that pi provides in its hardcoded preamble (e.g., edit usage rules, write usage rules). However, since `--system-prompt` skips the hardcoded preamble, the prompt MAY restate essential tool usage rules for tools that remain available (read, bash).

#### Scenario: No edit/write guidelines

- **WHEN** the prompt is read and the mode uses `--no-builtin-tools`
- **THEN** the prompt SHALL NOT include guidelines for edit or write tools
- **AND** the prompt SHALL only document tools actually available in the mode

### Requirement: Tool Usage section covers available extensions

The Tool Strategy section SHALL document any extensions loaded via `-e` flags. Each extension's tools SHALL be listed with name, purpose, and usage guidance.

#### Scenario: Extensions are documented

- **WHEN** the mode script loads extensions via `-e <path>` flags
- **THEN** the prompt's Tool Strategy section SHALL list each extension's tools
- **AND** the listing SHALL include usage rules and priority relative to other tools

### Requirement: New prompts require corresponding spec

When a new replace-mode agent prompt is created (e.g., `image-gen.md`, `data-viz.md`), a corresponding domain spec SHALL be created in `openspec/specs/<name>/spec.md`. The domain spec SHALL extend `pi-agent-prompt-replace` with domain-specific requirements while delegating general structural rules to the shared spec. This SHALL apply to new tasks within any OpenSpec change.

#### Scenario: New prompt comes with spec

- **WHEN** a change introduces a new replace-mode agent prompt file
- **THEN** a corresponding `openspec/specs/<prompt-name>/spec.md` SHALL be created
- **AND** the spec SHALL reference `pi-agent-prompt-replace` for general structural requirements
- **AND** the spec SHALL define only domain-specific requirements (tool strategy, query templates, attribution rules)
