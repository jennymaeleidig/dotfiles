# pi-agent-prompt-append Specification

## Purpose
General template for domain-specific agent prompts loaded via `--append-system-prompt`. Defines the structural requirements for prompts that layer domain guidance on top of pi defaults and APPEND_SYSTEM.md. Domain-specific prompts (e.g., unity-base.md) extend this spec with their own conventions and query type templates.

## ADDED Requirements

### Requirement: Prompt file location

An append-mode agent prompt file SHALL reside at `dot_pi/agent/prompts/<name>.md` relative to the chezmoi source root, where `<name>` is a kebab-case identifier for the domain. When applied via `chezmoi apply`, the `dot_` prefix SHALL be converted to `.` yielding the target path. The file SHALL be loaded via `--append-system-prompt` from a shell script or directly via CLI.

#### Scenario: Prompt is loaded as append

- **WHEN** pi is launched with `--append-system-prompt "$(cat ~/.pi/agent/prompts/unity-base.md)"`
- **THEN** the prompt content SHALL be appended after the hardcoded preamble and `APPEND_SYSTEM.md`
- **AND** the prompt SHALL add domain-specific guidance on top of all default pi tools and extensions

### Requirement: Structural sections

The prompt SHALL contain exactly these sections in order: an Identity line (opening, no heading), an Approach section, a Domain Tooling section (name may vary by domain), a Response Format section, and a Tone section. The prompt MAY include additional domain-specific sections between Response Format and Tone. The prompt SHALL NOT duplicate content already covered by `APPEND_SYSTEM.md`.

#### Scenario: Valid append-prompt structure

- **WHEN** the prompt is validated against this spec
- **THEN** the first non-whitespace line SHALL be an Identity line describing the agent's role
- **AND** it SHALL contain `## Approach`, a domain tooling section, `## Response Format`, and `## Tone`
- **AND** optional domain sections MAY appear between Response Format and Tone
- **AND** it SHALL NOT contain sections for Tool Chain Priority, Enforcement, or Investigation Principles (delegated to APPEND_SYSTEM)

#### Scenario: No APPEND_SYSTEM duplication

- **WHEN** the prompt is read
- **THEN** it SHALL NOT reference Context7, fffind, ffgrep, edit, write, web_search, or other tool strategy that APPEND_SYSTEM already covers
- **AND** it SHALL NOT include Never/Always enforcement rules (APPEND_SYSTEM covers these)

### Requirement: Identity line

The first non-whitespace content of the prompt SHALL be an Identity line. It SHALL be a single sentence describing the agent's domain role and expertise. It SHALL NOT be prefixed with a Markdown heading.

#### Scenario: Identity line is first content

- **WHEN** the prompt file is read
- **THEN** the first non-whitespace line SHALL describe the agent's role (e.g., "Unity C# development assistant. Expert in scripting...")
- **AND** this line SHALL NOT start with `#`

### Requirement: Approach section

The `## Approach` section SHALL define HOW the agent should think and reason within the domain. It SHALL include investigation principles specific to the domain, tool usage philosophy, and output quality expectations. If the domain has a required initialization step (e.g., calling a context tool), it SHALL be stated here.

#### Scenario: Approach includes domain-specific investigation

- **WHEN** the Approach section is read
- **THEN** it SHALL include at minimum: an instruction to investigate existing code/config before acting, a philosophy on solution quality, and domain-specific initialization steps if applicable

#### Scenario: Approach delegates tool strategy to APPEND_SYSTEM

- **WHEN** the Approach section is read
- **THEN** it SHALL NOT enumerate tool chains or search priority (APPEND_SYSTEM covers this)
- **AND** it MAY reference domain-specific tools but SHALL NOT re-teach general search strategy

### Requirement: Domain Tooling section

The prompt SHALL contain a section that defines domain-specific tools, conventions, or code patterns. The section name SHALL reflect the domain (e.g., "Code" for programming domains, "Tool Usage" for general reasoning, "Editor Guidance" for IDE-based domains). The section SHALL cover patterns that general LLMs frequently get wrong in this domain.

#### Scenario: Domain section exists with appropriate name

- **WHEN** the prompt is read
- **THEN** it SHALL contain at least one section between Approach and Response Format that covers domain-specific tools or conventions
- **AND** the section name SHALL reflect the domain context (not a generic "Tool Usage" if the domain has a more specific convention)

#### Scenario: Domain section covers gotchas

- **WHEN** the domain tooling section is read
- **THEN** it SHALL include patterns, conventions, or API rules that general LLMs commonly mishandle
- **AND** it SHALL prioritize actionable rules over exhaustive reference material

### Requirement: Response Format section

The `## Response Format` section SHALL define output templates for common query types in the domain. It SHALL cover at minimum three query types (e.g., how-to, debug, architecture, concept). Each template SHALL specify the structure the agent should follow.

#### Scenario: Response Format covers query types

- **WHEN** the Response Format section is read
- **THEN** it SHALL define response structures for at least three query types relevant to the domain
- **AND** each query type SHALL specify a structural template (e.g., "Step-by-step + code + explanation")

#### Scenario: Agent uses format for domain queries

- **WHEN** a user asks a domain-specific question matching a defined query type
- **THEN** the agent SHALL structure its response according to the corresponding template

### Requirement: Tone section (optional)

The prompt MAY end with a `## Tone` section. If present, it SHALL be a single line that refines or overrides the cross-cutting tone in APPEND_SYSTEM.md for this domain. If absent, the agent SHALL default to the APPEND_SYSTEM.md tone. The prompt SHALL NOT duplicate the APPEND_SYSTEM tone verbatim — only add a Tone section if the domain requires a different voice.

#### Scenario: Tone is present and refines cross-cutting tone

- **WHEN** the prompt is read and contains `## Tone`
- **THEN** it SHALL be a single line that is more specific than the APPEND_SYSTEM tone
- **AND** it SHALL appear as the final section (after domain-specific sections if any)

#### Scenario: Tone is absent and delegates to APPEND_SYSTEM

- **WHEN** the prompt is read and does NOT contain `## Tone`
- **THEN** the agent SHALL default to the tone defined in APPEND_SYSTEM.md
- **AND** this SHALL be the expected behavior for append-mode prompts that don't need a distinct voice

### Requirement: No Attribution or Sources section

The append-mode prompt SHALL NOT include Attribution or Sources sections. These are only relevant for replace-mode prompts that handle external citations. If the domain requires citing sources, it SHOULD be a replace-mode prompt instead.

#### Scenario: No citation infrastructure

- **WHEN** the prompt is read
- **THEN** it SHALL NOT contain `## Attribution` or `## Sources` sections or subsections

### Requirement: Terseness

The prompt SHALL use concise, directive language. Sections SHALL favor bullet points and fragments over prose paragraphs. The entire prompt SHOULD fit within 30 lines.

#### Scenario: Prompt is concise

- **WHEN** the prompt is measured
- **THEN** the file SHOULD be no more than 30 lines
- **AND** each section SHALL use bullet points and directive fragments over prose paragraphs

### Requirement: New prompts require corresponding spec

When a new append-mode agent prompt is created (e.g., `python-expert.md`, `devops.md`), a corresponding domain spec SHALL be created in `openspec/specs/<name>/spec.md`. The domain spec SHALL extend `pi-agent-prompt-append` with domain-specific requirements while delegating general structural rules to the shared spec. This SHALL apply to new tasks within any OpenSpec change.

#### Scenario: New prompt comes with spec

- **WHEN** a change introduces a new append-mode agent prompt file
- **THEN** a corresponding `openspec/specs/<prompt-name>/spec.md` SHALL be created
- **AND** the spec SHALL reference `pi-agent-prompt-append` for general structural requirements
- **AND** the spec SHALL define only domain-specific requirements (content, conventions, query type templates)
