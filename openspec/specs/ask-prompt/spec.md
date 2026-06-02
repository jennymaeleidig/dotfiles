# ask-prompt Specification

## Purpose
Defines ask-specific domain extensions on the `pi-agent-prompt-replace` general prompt template. Covers the reasoning assistant's tool strategy (Context7 primary, web fallback), response format (4 query types: Concept, How-to, Problem-solving, Open-ended), attribution rules, and tone. General structural requirements are delegated to `pi-agent-prompt-replace`.

## ADDED Requirements

### Requirement: Prompt file location and role

The ask prompt file (`ask-llm.md`) SHALL provide the LLM with reasoning assistant guidance. It SHALL be stored at `dot_pi/agent/prompts/ask-llm.md` relative to the chezmoi source root. It SHALL be a replace-mode prompt loaded via `--system-prompt` from the `scripts/ask` launcher. It SHALL conform to the `pi-agent-prompt-replace` specification for structural requirements.

#### Scenario: Prompt is loaded in replace mode

- **WHEN** `scripts/ask` launches pi with `--system-prompt "$(cat ~/.pi/agent/prompts/ask-llm.md)"`
- **THEN** the prompt SHALL replace pi's entire hardcoded preamble
- **AND** `APPEND_SYSTEM.md` SHALL NOT be loaded
- **AND** the prompt SHALL be fully self-contained

#### Scenario: Prompt conforms to replace spec

- **WHEN** `ask-llm.md` is validated
- **THEN** it SHALL satisfy all requirements of the `pi-agent-prompt-replace` specification
- **AND** it SHALL NOT duplicate structural requirements already defined in `pi-agent-prompt-replace`

### Requirement: Identity line

The first non-whitespace content of the prompt SHALL be an Identity line. It SHALL describe the agent as a reasoning assistant that answers thoughtfully with clear explanations, concrete examples, and practical guidance. It SHALL instruct step-by-step reasoning. It SHALL NOT be prefixed with a Markdown heading.

#### Scenario: Identity line describes reasoning assistant

- **WHEN** `ask-llm.md` is read
- **THEN** the first non-whitespace line SHALL describe the agent's role as a reasoning assistant
- **AND** it SHALL include the instruction to think step-by-step
- **AND** it SHALL NOT start with `#`

### Requirement: Math Formatting section

The prompt SHALL include a `## Math Formatting` section between the Identity line and Approach. It SHALL specify standard LaTeX delimiters: `$expression$` for inline math and `$$equation$$` for display math. It SHALL include at least one example of each delimiter.

#### Scenario: Math formatting section present

- **WHEN** `ask-llm.md` is read
- **THEN** it SHALL contain a `## Math Formatting` section
- **AND** it SHALL specify `$...$` for inline and `$$...$$` for display math
- **AND** it SHALL include at least one example of each delimiter form

### Requirement: Approach section

The `## Approach` section SHALL define the agent's reasoning philosophy. It SHALL instruct the agent to reason step-by-step, explain the why not just the what, use concrete examples and code where helpful, be practical and actionable, prefer working solutions over exhaustive theory, and use current information when needed. It SHALL direct the agent to check Context7 first for library and framework questions.

#### Scenario: Approach covers reasoning philosophy

- **WHEN** the Approach section is read
- **THEN** it SHALL include: step-by-step reasoning, explain why, use concrete examples, be practical, prefer working solutions
- **AND** it SHALL not duplicate tool strategy already covered in the Tool Usage section

#### Scenario: Approach directs Context7-first for libraries

- **WHEN** the Approach section is read
- **THEN** it SHALL instruct the agent to check Context7 first for library or framework questions
- **AND** it SHALL not enumerate specific Context7 tools (delegated to Tool Usage)

### Requirement: Tool Usage section

The `## Tool Usage` section SHALL define the agent's tool strategy. It SHALL list Context7 tools as primary: `context7_resolve_library_id`, `context7_get_library_docs`, and `context7_get_cached_doc_raw`. It SHALL document web tools (`web_search`, `web_read`) as secondary — only when Context7 does not cover the topic or recency matters. It SHALL instruct the agent to skip unnecessary lookups and prioritize reasoning over gathering.

#### Scenario: Tool Usage lists Context7 as primary

- **WHEN** the Tool Usage section is read
- **THEN** it SHALL list Context7 tools (resolve, get docs, cached raw) as the primary lookup strategy
- **AND** each Context7 tool SHALL include its purpose and usage guidance

#### Scenario: Tool Usage lists web as secondary

- **WHEN** the Tool Usage section is read
- **THEN** it SHALL list web_search and web_read as secondary tools
- **AND** it SHALL specify that web tools SHALL only be used when Context7 does not cover the topic or recency is required

#### Scenario: Tool Usage prioritizes reasoning

- **WHEN** the Tool Usage section is read
- **THEN** it SHALL instruct the agent to skip unnecessary lookups
- **AND** it SHALL prioritize reasoning over information gathering

### Requirement: Response Format section

The `## Response Format` section SHALL define output templates for 4 query types: **Concept** (Explanation + reasoning + examples), **How-to** (Step-by-step + code + explanations), **Problem-solving** (Analyze → Options → Recommend → Rationale), and **Open-ended** (Perspectives + trade-offs + reasoning).

#### Scenario: Response Format covers 4 query types

- **WHEN** the Response Format section is read
- **THEN** it SHALL define response structures for Concept, How-to, Problem-solving, and Open-ended query types
- **AND** each query type SHALL specify a structural template

#### Scenario: Agent uses format for a how-to question

- **WHEN** user asks a how-to question (e.g., "how do I set up X")
- **THEN** the agent SHALL respond with step-by-step instructions, code where applicable, and explanations of each step

#### Scenario: Agent uses format for an open-ended question

- **WHEN** user asks an open-ended question (e.g., "what's the best way to structure X")
- **THEN** the agent SHALL present perspectives, trade-offs, and reasoning

### Requirement: Attribution section

The prompt SHALL include an `## Attribution` section that defines inline citation format. Citations SHALL use bracketed numbers ([1], [2], etc.). The Attribution section SHALL specify that every source in the Sources section MUST include: Title, URL, Description, and Date. It SHALL specify that conflicting information SHALL be presented with both sides and source of each noted.

#### Scenario: Attribution defines citation format

- **WHEN** the Attribution section is read
- **THEN** it SHALL specify inline bracketed number citations
- **AND** it SHALL define the required fields for source entries: Title, URL, Description, Date
- **AND** it SHALL specify how to handle conflicting information

### Requirement: Sources section

The prompt SHALL include a `## Sources section` section that defines the source list format. It SHALL specify a numbered list format with Title (bold), description, date in parentheses, and URL on a separate line. The Sources section SHALL be required when sources are used, but is optional otherwise (unlike web-prompt where it is mandatory).

#### Scenario: Sources section defines format

- **WHEN** the Sources section is read
- **THEN** it SHALL define the numbered source list format
- **AND** the format SHALL include Title, description, date, and URL fields

#### Scenario: Sources section is conditional

- **WHEN** a response uses external sources
- **THEN** the Sources section SHALL be included
- **AND** when no sources are used, the Sources section MAY be omitted

### Requirement: Tone section

The prompt SHALL end with a `## Tone` section. It SHALL be a single line establishing a conversational, helpful voice that is honest about trade-offs, builds understanding over citation count, and skips disclaimers and filler.

#### Scenario: Tone is conversational and honest

- **WHEN** the Tone section is read
- **THEN** it SHALL describe a conversational, helpful tone
- **AND** it SHALL instruct the agent to be honest about trade-offs
- **AND** it SHALL instruct the agent to skip disclaimers and filler

### Requirement: Terseness

The prompt SHALL use concise, directive language. Sections SHALL favor bullet points and fragments over prose paragraphs. The entire prompt SHOULD fit within 50 lines.

#### Scenario: Prompt is concise

- **WHEN** `ask-llm.md` is measured
- **THEN** the file SHOULD be no more than 50 lines
- **AND** each section SHALL use bullet points and directive fragments over prose paragraphs
