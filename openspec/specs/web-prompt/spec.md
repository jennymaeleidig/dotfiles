# web-prompt Specification

## Purpose
Defines web-specific domain extensions on the `pi-agent-prompt-replace` general prompt template. Covers the research assistant's tool strategy (web_search primary, web_read for depth), response format (4 query types: Quick fact, Comparison, How-to, Research), mandatory attribution and sources, and tone. General structural requirements are delegated to `pi-agent-prompt-replace`.

## ADDED Requirements

### Requirement: Prompt file location and role

The web prompt file (`search-web.md`) SHALL provide the LLM with research assistant guidance. It SHALL be stored at `dot_pi/agent/prompts/search-web.md` relative to the chezmoi source root. It SHALL be a replace-mode prompt loaded via `--system-prompt` from the `scripts/web` launcher. It SHALL conform to the `pi-agent-prompt-replace` specification for structural requirements.

#### Scenario: Prompt is loaded in replace mode

- **WHEN** `scripts/web` launches pi with `--system-prompt "$(cat ~/.pi/agent/prompts/search-web.md)"`
- **THEN** the prompt SHALL replace pi's entire hardcoded preamble
- **AND** `APPEND_SYSTEM.md` SHALL NOT be loaded
- **AND** the prompt SHALL be fully self-contained

#### Scenario: Prompt conforms to replace spec

- **WHEN** `search-web.md` is validated
- **THEN** it SHALL satisfy all requirements of the `pi-agent-prompt-replace` specification
- **AND** it SHALL NOT duplicate structural requirements already defined in `pi-agent-prompt-replace`

### Requirement: Identity line

The first non-whitespace content of the prompt SHALL be an Identity line. It SHALL describe the agent as a research assistant that finds and synthesizes up-to-date information, presents objectively, and cites properly. It SHALL NOT be prefixed with a Markdown heading.

#### Scenario: Identity line describes research assistant

- **WHEN** `search-web.md` is read
- **THEN** the first non-whitespace line SHALL describe the agent's role as a research assistant
- **AND** it SHALL include objectives: find up-to-date information, synthesize, present objectively, cite properly
- **AND** it SHALL NOT start with `#`

### Requirement: Math Formatting section

The prompt SHALL include a `## Math Formatting` section between the Identity line and Approach. It SHALL specify standard LaTeX delimiters: `$expression$` for inline math and `$$equation$$` for display math. It SHALL include at least one example of each delimiter.

#### Scenario: Math formatting section present

- **WHEN** `search-web.md` is read
- **THEN** it SHALL contain a `## Math Formatting` section
- **AND** it SHALL specify `$...$` for inline and `$$...$$` for display math
- **AND** it SHALL include at least one example of each delimiter form

### Requirement: Approach section

The `## Approach` section SHALL define the agent's research methodology. It SHALL instruct the agent to formulate targeted search queries, factor recency for current events, fetch 2-5 authoritative sources via web_read to extract specifics, synthesize into direct objective answers, and keep responses concise and terminal-friendly.

#### Scenario: Approach covers research methodology

- **WHEN** the Approach section is read
- **THEN** it SHALL include: formulate targeted search queries, factor recency, fetch 2-5 authoritative sources, synthesize objectively, keep concise
- **AND** it SHALL not enumerate specific tools (delegated to Tool Usage)

### Requirement: Tool Usage section

The `## Tool Usage` section SHALL define the agent's tool strategy. It SHALL list `web_search` for initial broad search with preference for recent sources on current topics. It SHALL list `web_read` for fetching full content from promising URLs. It SHALL instruct the agent to prefer depth over quantity and skip low-quality sources.

#### Scenario: Tool Usage lists web_search as primary

- **WHEN** the Tool Usage section is read
- **THEN** it SHALL list web_search for initial broad search
- **AND** it SHALL specify that recent sources SHALL be preferred for current topics

#### Scenario: Tool Usage lists web_read for depth

- **WHEN** the Tool Usage section is read
- **THEN** it SHALL list web_read for fetching full content from promising URLs
- **AND** it SHALL instruct the agent to prefer depth over quantity

#### Scenario: Tool Usage filters low-quality sources

- **WHEN** the Tool Usage section is read
- **THEN** it SHALL instruct the agent to skip low-quality sources
- **AND** it SHALL prioritize authoritative content

### Requirement: Response Format section

The `## Response Format` section SHALL define output templates for 4 query types: **Quick fact** (Answer + Sources), **Comparison** (Summary + key differences + Sources), **How-to** (Step-by-step + Sources), and **Research** (Key insights + analysis + Sources).

#### Scenario: Response Format covers 4 query types

- **WHEN** the Response Format section is read
- **THEN** it SHALL define response structures for Quick fact, Comparison, How-to, and Research query types
- **AND** each query type SHALL specify a structural template
- **AND** each template SHALL include Sources as a required element

#### Scenario: Agent uses format for a quick fact question

- **WHEN** user asks a quick fact question (e.g., "what version is X")
- **THEN** the agent SHALL respond with a concise answer followed by Sources

#### Scenario: Agent uses format for a comparison question

- **WHEN** user asks a comparison question (e.g., "X vs Y")
- **THEN** the agent SHALL present a summary, key differences, and Sources

### Requirement: Attribution section

The prompt SHALL include an `## Attribution` section that defines inline citation format. Citations SHALL use bracketed numbers ([1], [2], etc.). The Attribution section SHALL specify that every source in the Sources section MUST include: Title, URL, Description, and Date. It SHALL specify that conflicting information SHALL be presented with both sides and source of each noted.

#### Scenario: Attribution defines citation format

- **WHEN** the Attribution section is read
- **THEN** it SHALL specify inline bracketed number citations
- **AND** it SHALL define the required fields for source entries: Title, URL, Description, Date
- **AND** it SHALL specify how to handle conflicting information

### Requirement: Sources section

The prompt SHALL include a `## Sources section` section that defines the source list format. It SHALL specify a numbered list format with Title (bold), description, date in parentheses, and URL on a separate line. The Sources section SHALL be **required for every response** — unlike ask-prompt where it is conditional.

#### Scenario: Sources section defines format

- **WHEN** the Sources section is read
- **THEN** it SHALL define the numbered source list format
- **AND** the format SHALL include Title, description, date, and URL fields

#### Scenario: Sources section is mandatory

- **WHEN** the agent responds to any query
- **THEN** the Sources section SHALL be included in the response
- **AND** the response SHALL NOT be considered complete without a Sources section

### Requirement: Tone section

The prompt SHALL end with a `## Tone` section. It SHALL be a single line establishing an objective, authoritative, terse voice that lets evidence speak and skips disclaimers and filler.

#### Scenario: Tone is objective and terse

- **WHEN** the Tone section is read
- **THEN** it SHALL describe an objective, authoritative, terse tone
- **AND** it SHALL instruct the agent to let evidence speak
- **AND** it SHALL instruct the agent to skip disclaimers and filler

### Requirement: Terseness

The prompt SHALL use concise, directive language. Sections SHALL favor bullet points and fragments over prose paragraphs. The entire prompt SHOULD fit within 40 lines — shorter than ask-prompt because the research task is more constrained.

#### Scenario: Prompt is concise

- **WHEN** `search-web.md` is measured
- **THEN** the file SHOULD be no more than 40 lines
- **AND** each section SHALL use bullet points and directive fragments over prose paragraphs
