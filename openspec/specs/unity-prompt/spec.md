# unity-prompt Specification

## Purpose
Defines Unity-specific domain extensions on the `pi-agent-prompt-append` general prompt template. Covers Unity development conventions (Code section), Editor guidance patterns, and unity-context initialization. General structural requirements are delegated to `pi-agent-prompt-append`.
## Requirements
### Requirement: Prompt file location and role

A single base prompt file (`unity-base.md`) SHALL provide the LLM with Unity development domain guidance. It SHALL be stored at `dot_pi/agent/prompts/unity-base.md`. It SHALL be an appending prompt — loaded after `APPEND_SYSTEM.md` via the `unity` script's `--append-system-prompt`. It SHALL conform to the `pi-agent-prompt-append` specification for structural requirements. It SHALL NOT duplicate content covered by `pi-system-directive` (tool strategy, search strategy, enforcement rules) or `pi-agent-prompt-append` (general structural requirements).

#### Scenario: Base prompt conforms to append spec

- **WHEN** `unity-base.md` is validated
- **THEN** it SHALL satisfy all requirements of the `pi-agent-prompt-append` specification
- **AND** it SHALL NOT duplicate structural requirements already defined in `pi-agent-prompt-append`

#### Scenario: Base prompt does not duplicate system directive

- **WHEN** `unity-base.md` is read
- **THEN** it SHALL NOT contain any reference to Context7, fffind, ffgrep, edit, write, or web search
- **AND** it SHALL NOT contain tool chain priority, enforcement rules, or investigation principles (delegated to `pi-system-directive`)

### Requirement: Prompt structure

The base prompt SHALL conform to the `pi-agent-prompt-append` specification. It SHALL contain an Identity line, Approach section, Domain Tooling section (titled "Code"), Response Format section, and a domain-specific Editor Guidance section — in that order. A Tone section is OPTIONAL per `pi-agent-prompt-append`; if absent, the APPEND_SYSTEM.md tone applies. It SHALL NOT include fact-enumeration tables — the `unity-context` tool provides project facts at runtime.

#### Scenario: Prompt conforms to append spec

- **WHEN** `unity-base.md` is validated
- **THEN** it SHALL satisfy the structural requirements defined in `pi-agent-prompt-append`
- **AND** the Domain Tooling section SHALL be titled `## Code` (Unity's domain convention)
- **AND** it SHALL include a domain-specific `## Editor Guidance` section between Response Format and Tone

#### Scenario: Prompt defers facts to unity-context

- **WHEN** `unity-base.md` is read
- **THEN** it SHALL NOT contain render pipeline → shader name mappings, Unity version → API mappings, or capability → guidance mappings
- **AND** it SHALL instruct the LLM to call `unity-context` and adapt to whatever it reports

#### Scenario: Prompt excludes tool strategy

- **WHEN** `unity-base.md` is read
- **THEN** it SHALL NOT contain any reference to Context7, fffind, ffgrep, edit, write, or web search

### Requirement: Approach section

The `## Approach` section SHALL instruct the LLM to call `unity-context` first, adapt all advice to the reported context, investigate existing project code before writing new scripts, and explain WHY patterns work rather than just describing what they do.

#### Scenario: Approach section content

- **WHEN** `unity-base.md` is read
- **THEN** the Approach section SHALL include: call `unity-context` first, adapt to reported context, investigate existing code, explain reasoning

### Requirement: Code section

The `## Code` section SHALL cover essential Unity gotchas that general LLMs get wrong: `[SerializeField] private` over public fields, `GetComponent` caching in Awake/Start, TextMeshPro for all text, New Input System for input, coroutines over `async void`, `FixedUpdate` for physics, `Mathf` over `System.Math`, single-responsibility components, and `ScriptableObject` for shared config.

#### Scenario: Code section covers Unity gotchas

- **WHEN** `unity-base.md` is read
- **THEN** the Code section SHALL include guidance on SerializeField, GetComponent caching, TextMeshPro, Input System, coroutines, FixedUpdate, Mathf, single-responsibility, and ScriptableObject

### Requirement: Response Format section

The `## Response Format` section SHALL provide format templates for common Unity query types: how-to (step-by-step + code + explanation), debug (root cause → fix → prevention), architecture (options → trade-offs → recommendation), and concept (explanation + example + when to use).

#### Scenario: LLM uses format template for a how-to question

- **WHEN** user asks "how do I set up URP"
- **THEN** the LLM SHALL respond with step-by-step instructions, code where applicable, and explanation of each step

#### Scenario: LLM uses format template for a debug question

- **WHEN** user asks "why isn't my OnTriggerEnter firing"
- **THEN** the LLM SHALL identify the root cause, provide the fix, and explain how to prevent similar issues

### Requirement: Editor Guidance section

The `## Editor Guidance` section SHALL be no more than 5 lines. It SHALL instruct the LLM to guide the user through the Unity Editor UI for scene setup, material creation, and component configuration — never generating scripts for these tasks. It SHALL cover: pipeline-aware instructions (qualify shader/material steps with detected render pipeline), warnings at mistake points (not in afterword), and verification (end with expected outcome and diagnostic check).

#### Scenario: Editor guidance section exists and is brief

- **WHEN** `unity-base.md` is read
- **THEN** it SHALL contain a section titled `## Editor Guidance`
- **AND** the section SHALL be no more than 6 lines
- **AND** it SHALL cover pipeline-awareness, mistake-point warnings, and verification

#### Scenario: LLM gives Editor guidance instead of scripting Editor tasks

- **WHEN** user asks to add a Rigidbody to a GameObject
- **THEN** the LLM SHALL respond with Editor instructions: select the GameObject, click Add Component, search for Rigidbody
- **AND** SHALL NOT generate code like `gameObject.AddComponent<Rigidbody>()` in a script

### Requirement: Terseness

The base prompt SHALL use terse, directive language matching the ask/web prompt style. It SHALL be no more than 25 lines.

#### Scenario: Base prompt is concise

- **WHEN** `unity-base.md` is measured
- **THEN** the file SHALL be no more than 25 lines
- **AND** each section SHALL use bullet points and directive fragments over prose paragraphs

### Requirement: Session initialization

The prompt SHALL instruct the LLM to ALWAYS call the `unity-context` tool at the beginning of any Unity session. This instruction SHALL appear in the `## Approach` section.

#### Scenario: LLM starts a Unity session

- **WHEN** a `unity` session begins
- **THEN** the LLM SHALL call the `unity-context` tool before answering any user questions about the Unity project

### Requirement: Educational tone

The prompt SHALL establish an educational tone. Responses SHALL explain WHY patterns and approaches are used. The LLM SHALL teach Unity development principles through each interaction — code first, then explain the reasoning.

#### Scenario: LLM explains a code pattern

- **WHEN** the LLM provides a code example
- **THEN** the response SHALL include an explanation of WHY the chosen pattern works, not just a description of what the code does

### Requirement: Cross-spec compliance

The `unity-base.md` prompt SHALL comply with both `pi-system-directive` (for what it MUST NOT duplicate) and `pi-agent-prompt-append` (for what it MUST include). Validation SHALL check that Unity-specific sections (Code, Editor Guidance) are domain extensions that do not conflict with general structural rules.

#### Scenario: Unity prompt passes cross-spec validation

- **WHEN** `unity-base.md` is validated against `pi-system-directive`, `pi-agent-prompt-append`, and `unity-prompt`
- **THEN** it SHALL pass all three validations
- **AND** conflicts between specs SHALL be resolved in favor of the most specific spec (unity-prompt > pi-agent-prompt-append > pi-system-directive)

