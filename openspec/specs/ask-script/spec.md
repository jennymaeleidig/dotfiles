# ask-script Specification

## Purpose
Defines ask-specific mode extensions on the `pi-mode-script` general launcher template. Covers the ask mode's replace-mode invocation, model selection (deepseek-v4-pro), thinking level (high, user-configurable), required extensions, and terminal-only query requirement. General script structure requirements are delegated to `pi-mode-script`.

## ADDED Requirements

### Requirement: Script file location and role

The ask launcher script SHALL reside at `scripts/ask` relative to the chezmoi source root. It SHALL be a bash script starting with `#!/bin/bash`. It SHALL invoke pi in replace mode with the `ask-llm.md` prompt.

#### Scenario: Script is executable

- **WHEN** user runs `ask` from a terminal
- **THEN** the `scripts/ask` script SHALL be found and executed (via PATH or chezmoi script directory)
- **AND** the script SHALL start with `#!/bin/bash`

### Requirement: Prompt file reference

The script SHALL reference the ask prompt file via a variable `ASK_PROMPT_FILE` pointing to `${HOME}/.pi/agent/prompts/ask-llm.md`. On the target system after `chezmoi apply`, the chezmoi source path `dot_pi/agent/prompts/ask-llm.md` SHALL resolve to `${HOME}/.pi/agent/prompts/ask-llm.md`.

#### Scenario: Prompt file variable defined

- **WHEN** the script is read
- **THEN** it SHALL define `ASK_PROMPT_FILE="${HOME}/.pi/agent/prompts/ask-llm.md"`
- **AND** the variable name SHALL indicate it holds the ask prompt path

### Requirement: Terminal-only mode with query requirement

Bare invocation of `ask` (no query, no `--continue`) SHALL display usage information and exit with code 1. The script SHALL NOT launch interactive mode on bare invocation — it is a terminal-only tool that requires a query or the `--continue` flag.

#### Scenario: Bare invocation shows usage

- **WHEN** user runs `ask` with no arguments
- **THEN** the script SHALL display "Usage: ask [OPTIONS] [query]"
- **AND** the script SHALL display "ask -c        continue most recent session interactively"
- **AND** exit with code 1

#### Scenario: Continue flag without query is valid

- **WHEN** user runs `ask -c` with no query
- **THEN** the script SHALL NOT error on missing query
- **AND** the script SHALL launch `pi -c` interactively

### Requirement: Thinking level flag

The script SHALL support a `--thinking <level>` option that sets the thinking level for pi. The default thinking level SHALL be `high`. The thinking level SHALL accept values: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`. This flag is unique to ask among terminal-only modes — web does not support it.

#### Scenario: Default thinking is high

- **WHEN** user runs `ask "query"` without `--thinking`
- **THEN** the script SHALL set `--thinking high` in the pi invocation

#### Scenario: User overrides thinking level

- **WHEN** user runs `ask --thinking xhigh "complex architecture question"`
- **THEN** the script SHALL set `--thinking xhigh` in the pi invocation

#### Scenario: Invalid thinking level is rejected

- **WHEN** user runs `ask --thinking invalid "query"`
- **THEN** the script SHALL pass the value to pi (validation is pi's responsibility)

#### Scenario: Thinking flag documented in help

- **WHEN** user runs `ask --help`
- **THEN** the help output SHALL list `--thinking <level>` with valid level names and default value

### Requirement: Replace-mode pi invocation

The script SHALL invoke pi in replace mode. It SHALL pass `--system-prompt` with the contents of `ask-llm.md`. It SHALL pass `--no-extensions` and selectively re-add required extensions via `-e`. It SHALL pass `--no-builtin-tools --no-prompt-templates --no-skills`.

#### Scenario: Replace mode with stripped defaults

- **WHEN** the script launches pi
- **THEN** it SHALL pass `--system-prompt` with the ask prompt content
- **AND** it SHALL pass `--no-extensions --no-builtin-tools --no-prompt-templates --no-skills`
- **AND** it SHALL pass `-p` for print mode (terminal tool)

#### Scenario: Required extensions are re-added

- **WHEN** the script launches pi
- **THEN** it SHALL pass `-e` for each required extension
- **AND** the extensions SHALL be: `pi-search-hub`, `pi-island`, `@dreki-gg/pi-context7`
- **AND** extension paths SHALL be under `${HOME}/.pi/agent/npm/node_modules/`

### Requirement: Model configuration

The script SHALL use the model `opencode-go/deepseek-v4-pro`. This is the same model as `unity` but with replace-mode invocation (unity uses append mode).

#### Scenario: Model is deepseek-v4-pro

- **WHEN** user runs `ask "query"`
- **THEN** the script SHALL invoke pi with `--model "opencode-go/deepseek-v4-pro"`

### Requirement: Continue mode

The script SHALL support `-c` / `--continue`. When `-c` is provided without a query, the script SHALL launch `pi -c` with no mode-specific configuration (bare continue, inheriting prior session state). When `-c` is provided with a query, the script SHALL launch `pi -c -p "query"` with the full ask configuration.

#### Scenario: Continue without query

- **WHEN** user runs `ask -c`
- **THEN** the script SHALL launch `pi -c` with no additional flags
- **AND** the prior session's model, thinking, and prompt SHALL be restored by pi

#### Scenario: Continue with query

- **WHEN** user runs `ask -c "follow-up question"`
- **THEN** the script SHALL launch `pi -c -p "follow-up question"` with the full ask configuration

### Requirement: Output pipeline

For print mode (all invocations since ask requires a query), the script SHALL pipe pi's output through the Markdown-to-terminal rendering pipeline: `mq -I markdown '.' | txc-safe -f - -c -n | glow`.

#### Scenario: Print mode output is formatted

- **WHEN** the script launches in print mode
- **THEN** output SHALL be piped through `mq | txc-safe | glow`

### Requirement: Cross-spec compliance

The `scripts/ask` script SHALL comply with `pi-mode-script` for general shell launcher structure. Ask-specific behavior (model selection, thinking configuration, replace mode, terminal-only requirement) SHALL be defined here as domain extensions.

#### Scenario: Ask script passes cross-spec validation

- **WHEN** `scripts/ask` is validated against `pi-mode-script` and `ask-script`
- **THEN** it SHALL pass both validations
- **AND** all file path references SHALL match the target system paths (post `chezmoi apply`)
