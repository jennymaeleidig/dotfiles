# pi-mode-script Specification

## Purpose
General template for shell launcher scripts that invoke pi in domain-specific modes. Defines the structural requirements for scripts that handle argument parsing, mode dispatch (interactive/print/continue), pi flag assembly (append vs replace), model/thinking configuration, and output pipeline. Domain-specific scripts (e.g., scripts/unity) extend this spec with their own model, flags, and pipeline choices.

## ADDED Requirements

### Requirement: Script file location

A mode launcher script SHALL reside at a path accessible in the user's `$PATH` (e.g., `~/bin/` or a chezmoi-managed `scripts/` directory). The script SHALL be named with the mode's command name (e.g., `ask`, `web`, `unity`). It SHALL be a bash script starting with `#!/bin/bash`.

#### Scenario: Script is executable and in PATH

- **WHEN** user runs `<mode-name>` from a terminal
- **THEN** the corresponding script SHALL be found and executed
- **AND** the script SHALL start with `#!/bin/bash`

### Requirement: Prompt file reference

The script SHALL reference its associated prompt file via a variable pointing to `~/.pi/agent/prompts/<prompt-name>.md`. The prompt name SHALL match the mode name or clearly indicate the domain.

#### Scenario: Prompt file variable

- **WHEN** the script is read
- **THEN** it SHALL define a variable referencing the prompt file path under `~/.pi/agent/prompts/`
- **AND** the variable name SHALL indicate it holds prompt content (e.g., `UNITY_BASE_PROMPT`, `SEARCH_PROMPT_FILE`)

### Requirement: Argument parsing

The script SHALL parse command-line arguments using a `while` / `case` loop. It SHALL support at minimum: `--help` / `-h` (display usage), `--continue` / `-c` (continue previous session). Domain-specific options (e.g., `--thinking`) MAY be added. Unknown options SHALL be treated as the query argument.

#### Scenario: Help flag

- **WHEN** user runs `<mode> --help` or `<mode> -h`
- **THEN** the script SHALL display usage information including options and examples
- **AND** exit with code 0

#### Scenario: Continue flag without query

- **WHEN** user runs `<mode> -c` with no additional arguments
- **THEN** the script SHALL launch `pi -c` with no mode-specific configuration (no model, thinking, system prompt, or extension flags)
- **AND** `pi -c` SHALL restore the previous session's configuration from the session store

#### Scenario: Continue flag with query

- **WHEN** user runs `<mode> -c "follow-up question"`
- **THEN** the script SHALL launch pi in continue mode with the mode's prompt configuration and the query

#### Scenario: Unknown options become the query

- **WHEN** user runs `<mode> "some query text"`
- **THEN** the script SHALL treat the text as the query argument after all flags are consumed

### Requirement: Mode dispatch

The script SHALL dispatch based on arguments as follows:

1. **Default mode (bare invocation)**: No query, no `--continue`. Behavior is domain-specific and SHALL be declared by the domain spec. Append-mode scripts (development tools) SHOULD launch interactive `pi` with the mode's prompt configuration. Replace-mode scripts (terminal tools) SHOULD display usage information and exit with code 1.
2. **Print mode**: Query provided (with or without `--continue`). Launch `pi -p` with the query and the mode's full configuration (prompt, model, thinking, extensions).
3. **Continue mode**: `--continue` without query. Launch `pi -c` with NO mode-specific configuration. `pi -c` SHALL restore the previous session's model, thinking, system prompt, and extensions from the session store. The domain prompt SHALL NOT be injected (it would overwrite the restored session context).

#### Scenario: Append mode defaults to interactive

- **WHEN** a domain spec declares that bare invocation SHALL launch interactive mode (e.g., unity)
- **THEN** the script SHALL launch `pi` interactively with the mode's prompt appended
- **AND** the model and thinking settings SHALL match the mode's configuration

#### Scenario: Terminal mode requires a query

- **WHEN** a domain spec declares that bare invocation SHALL error (e.g., ask, web)
- **THEN** the script SHALL display usage information and exit with code 1
- **AND** the usage message SHALL indicate that a query or `--continue` is required

#### Scenario: Print mode with query

- **WHEN** user runs `<mode> "a query"`
- **THEN** the script SHALL launch `pi -p` with the query and mode configuration
- **AND** output SHALL be piped through the mode's output pipeline

#### Scenario: Continue without query delegates to prior session

- **WHEN** user runs `<mode> -c` with no query
- **THEN** the script SHALL launch only `pi -c` with no additional flags (no model, thinking, system prompt, or extension flags)
- **AND** `pi -c` SHALL restore the previous session's model, thinking, system prompt, and extensions from the session store
- **AND** the mode's domain prompt SHALL NOT be injected (it would overwrite the restored session configuration)

#### Scenario: Continue with query preserves domain config

- **WHEN** user runs `<mode> -c "follow-up question"`
- **THEN** the script SHALL launch pi with both the `-c` flag and the mode's full configuration
- **AND** pi SHALL restore prior session context
- **AND** the domain prompt SHALL be active for the new query

### Requirement: Pi invocation flags

The script SHALL determine which pi flags to use based on whether the mode appends or replaces the system prompt:

- **Append mode**: Use `--append-system-prompt "$PROMPT_CONTENT"`. Preserve all pi defaults (no `--no-builtin-tools`, `--no-extensions`, `--no-skills`, `--no-prompt-templates`).
- **Replace mode**: Use `--system-prompt "$PROMPT_CONTENT"`. Use `--no-extensions` and selectively re-add needed extensions with `-e`. Use `--no-builtin-tools --no-prompt-templates --no-skills` if the mode does not need them.

#### Scenario: Append mode preserves defaults

- **WHEN** the mode uses `--append-system-prompt`
- **THEN** the script SHALL NOT pass `--no-builtin-tools`, `--no-extensions`, `--no-prompt-templates`, or `--no-skills`
- **AND** all default pi tools, extensions, and skills SHALL be available

#### Scenario: Replace mode strips and selectively adds

- **WHEN** the mode uses `--system-prompt`
- **THEN** the script SHALL pass `--no-extensions` and selectively re-add required extensions with `-e <path>`
- **AND** the script SHALL pass `--no-builtin-tools --no-prompt-templates --no-skills` if those are not needed
- **AND** the extension paths SHALL reference installed npm packages at dot-prefixed chezmoi paths (e.g., `dot_pi/agent/npm/node_modules/`) resolved relative to the chezmoi source root

### Requirement: Model and thinking configuration

The script SHALL specify the model and thinking level for the mode. Replace-mode scripts SHALL set thinking to `off` or `low` (terminal-first, fast responses). Append-mode scripts SHALL set thinking to `high` (development, deep reasoning). The model SHALL be a valid pi provider/model string.

#### Scenario: Replace mode uses fast thinking

- **WHEN** the mode is a terminal-only query tool (web)
- **THEN** the script SHALL set `--thinking off` or an equivalent fast setting
- **AND** the model SHALL be optimized for quick responses

#### Scenario: Append mode uses deep thinking

- **WHEN** the mode is a development tool (unity)
- **THEN** the script SHALL set `--thinking high`
- **AND** the model SHALL be optimized for reasoning quality

### Requirement: Output pipeline

For print mode, the script SHALL pipe pi's output through a Markdown-to-terminal rendering pipeline. The pipeline SHALL use `mq -I markdown '.' | txc-safe -f - -c -n | glow` or an equivalent chain that renders formatted output in the terminal.

#### Scenario: Print mode output is formatted

- **WHEN** the script runs in print mode (`-p`)
- **THEN** pi's output SHALL be piped through `mq | txc-safe | glow` (or equivalent rendering chain)

#### Scenario: Interactive mode has no pipeline

- **WHEN** the script runs in interactive mode (no `-p`)
- **THEN** pi's output SHALL go directly to the terminal with no additional piping

### Requirement: New scripts require corresponding spec

When a new mode launcher script is created (e.g., `scripts/python`, `scripts/devops`), a corresponding domain spec SHALL be created in `openspec/specs/<name>/spec.md`. The domain spec SHALL extend `pi-mode-script` with domain-specific requirements (model, thinking level, append/replace mode, domain options) while delegating general structural rules to the shared spec. This SHALL apply to new tasks within any OpenSpec change.

#### Scenario: New script comes with spec

- **WHEN** a change introduces a new mode launcher script
- **THEN** a corresponding `openspec/specs/<script-name>/spec.md` SHALL be created
- **AND** the spec SHALL reference `pi-mode-script` for general structural requirements
- **AND** the spec SHALL define only domain-specific requirements (model, thinking, flags, extensions, pipeline)
