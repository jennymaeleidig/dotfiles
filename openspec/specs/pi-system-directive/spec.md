# pi-system-directive Specification

## Purpose
General template for cross-cutting system directives loaded via pi's auto-append mechanism (APPEND_SYSTEM.md). Defines the structural requirements for directives that provide tool chain priority, enforcement rules, and investigation principles applicable to all pi sessions. Domain-specific system directives extend this spec with additional content requirements.

## ADDED Requirements

### Requirement: Directive file location and role

A system directive file named `APPEND_SYSTEM.md` SHALL reside at `dot_pi/agent/APPEND_SYSTEM.md` relative to the chezmoi source root. When applied via `chezmoi apply`, the `dot_` prefix SHALL be converted to `.` yielding `~/.pi/agent/APPEND_SYSTEM.md` on the target system. It SHALL be auto-appended to pi's system prompt after the hardcoded preamble and before any mode-specific prompts. It SHALL provide cross-cutting operational guidance that applies to all sessions: search strategy, enforcement rules, and investigation principles.

#### Scenario: Directive is loaded in append mode

- **WHEN** pi starts in a mode that uses `--append-system-prompt` (or default pi with no replace)
- **THEN** the content of `APPEND_SYSTEM.md` SHALL appear in the system prompt after the hardcoded preamble
- **AND** the content SHALL appear before any mode-specific prompt appended via `--append-system-prompt`

#### Scenario: Directive is NOT loaded in replace mode

- **WHEN** pi starts in a mode that uses `--system-prompt` to replace the default prompt (ask, web)
- **THEN** `APPEND_SYSTEM.md` SHALL NOT be included in the system prompt
- **AND** the mode-specific prompt SHALL be fully self-contained

### Requirement: Structural sections

The directive SHALL contain exactly these sections in order: a top-level heading with a descriptive name, a Tool Chain Priority section, an Enforcement section, an Investigation Principles section, and a Tone section. The directive SHALL NOT contain Response Format, Attribution, or Sources sections — those belong to agent prompts.

#### Scenario: Valid directive structure

- **WHEN** `APPEND_SYSTEM.md` is validated
- **THEN** it SHALL begin with a `# <name>` heading
- **AND** it SHALL contain a section describing tool chain priority (ranked, numbered categories)
- **AND** it SHALL contain an Enforcement section with Never/Always rules
- **AND** it SHALL contain an Investigation Principles section
- **AND** it SHALL contain a Tone section
- **AND** it SHALL NOT contain sections titled `## Response Format`, `## Attribution`, or `## Sources`

### Requirement: Tool Chain Priority section

The Tool Chain Priority section SHALL define a numbered, ranked list of tool categories that the agent SHALL apply in order. Each entry SHALL include the tool name, its purpose, and usage guidance. The section MAY use sub-bullets for detailed instructions. The chain SHALL cover at minimum: primary documentation lookup, local search, and web search.

#### Scenario: Tool chain is ranked and numbered

- **WHEN** the Tool Chain Priority section is read
- **THEN** tool categories SHALL be presented as a numbered list (1, 2, 3, ...)
- **AND** the numbering SHALL reflect the priority order the agent should apply

#### Scenario: Each chain entry includes usage guidance

- **WHEN** an entry in the tool chain is read
- **THEN** it SHALL state the tool name and its purpose
- **AND** it SHALL include at least one usage rule or pattern

### Requirement: Enforcement section

The Enforcement section SHALL contain two subsections: "Never" and "Always". Each SHALL be a bullet list of hard rules the agent MUST follow. Rules SHALL use imperative language and reference specific tool names when applicable.

#### Scenario: Enforcement has Never and Always subsections

- **WHEN** the Enforcement section is read
- **THEN** it SHALL contain a `### Never` subsection with a bullet list of prohibited actions
- **AND** it SHALL contain a `### Always` subsection with a bullet list of required actions

#### Scenario: Enforcement rules are specific

- **WHEN** an enforcement rule is read
- **THEN** it SHALL reference specific tool names (e.g., `ffgrep`, `context7_resolve_library_id`) rather than vague categories
- **AND** rules SHALL use imperative form: "Never use X", "Always do Y before Z"

### Requirement: Investigation Principles section

The Investigation Principles section SHALL instruct the agent to investigate before proposing solutions. It SHALL include directives to read docs, examples, and existing code; verify APIs and flags against documentation; ask for clarity rather than guessing; and show investigation work.

#### Scenario: Investigation section exists

- **WHEN** the directive is read
- **THEN** it SHALL contain a section that mandates investigation before solution
- **AND** it SHALL include at minimum: read existing code, verify against docs, ask rather than guess, show work

### Requirement: Tone section

The Tone section SHALL be a single line establishing the cross-cutting voice for all agent responses. It SHALL be placed at the end of the directive.

#### Scenario: Tone is a single line

- **WHEN** the Tone section is read
- **THEN** it SHALL consist of exactly one line (possibly one sentence)
- **AND** it SHALL appear as the final section of the directive

### Requirement: Directive does not define response format

The system directive SHALL NOT include response format templates, attribution rules, or source citation formats. These are the responsibility of agent prompts. The directive governs HOW the agent finds and validates information, not HOW it presents answers.

#### Scenario: Directive excludes output formatting

- **WHEN** `APPEND_SYSTEM.md` is read
- **THEN** it SHALL NOT contain query-type adaptation templates (how-to, debug, concept, etc.)
- **AND** it SHALL NOT contain citation format rules or Sources section templates

### Requirement: New directives require corresponding spec

When a new system directive is created (e.g., `safety-rules.md`, `memory-strategy.md`), a corresponding domain spec SHALL be created in `openspec/specs/<name>/spec.md`. The domain spec SHALL extend `pi-system-directive` with domain-specific requirements while delegating general structural rules to the shared spec. This SHALL apply to new tasks within any OpenSpec change.

#### Scenario: New directive comes with spec

- **WHEN** a change introduces a new system directive file
- **THEN** a corresponding `openspec/specs/<directive-name>/spec.md` SHALL be created
- **AND** the spec SHALL reference `pi-system-directive` for general structural requirements
- **AND** the spec SHALL define only domain-specific requirements (content, constraints, scenarios)

### Requirement: Terseness

The directive SHALL use concise, directive language. Sections SHALL favor bullet points and fragments over prose paragraphs. The entire directive SHOULD fit within 50 lines.

#### Scenario: Directive is concise

- **WHEN** `APPEND_SYSTEM.md` is measured
- **THEN** each section (except the tool chain) SHALL be no more than 10 lines
- **AND** bullet points SHALL be preferred over prose paragraphs
