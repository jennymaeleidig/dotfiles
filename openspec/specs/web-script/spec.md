# web-script Specification

## Purpose
Defines web-specific mode extensions on the `pi-mode-script` general launcher template. Covers the web mode's replace-mode invocation, model selection (claude-haiku-4.5), thinking level (off, hardcoded), required extensions, and terminal-only query requirement. General script structure requirements are delegated to `pi-mode-script`.

## ADDED Requirements

### Requirement: Script file location and role

The web launcher script SHALL reside at `scripts/web` relative to the chezmoi source root. It SHALL be a bash script starting with `#!/bin/bash`. It SHALL invoke pi in replace mode with the `search-web.md` prompt.

#### Scenario: Script is executable

- **WHEN** user runs `web` from a terminal
- **THEN** the `scripts/web` script SHALL be found and executed (via PATH or chezmoi script directory)
- **AND** the script SHALL start with `#!/bin/bash`

### Requirement: Prompt file reference

The script SHALL reference the web prompt file via a variable `SEARCH_PROMPT_FILE` pointing to `${HOME}/.pi/agent/prompts/search-web.md`. On the target system after `chezmoi apply`, the chezmoi source path `dot_pi/agent/prompts/search-web.md` SHALL resolve to `${HOME}/.pi/agent/prompts/search-web.md`.

#### Scenario: Prompt file variable defined

- **WHEN** the script is read
- **THEN** it SHALL define `SEARCH_PROMPT_FILE="${HOME}/.pi/agent/prompts/search-web.md"`
- **AND** the variable name SHALL indicate it holds the web search prompt path

### Requirement: Terminal-only mode with query requirement

Bare invocation of `web` (no query, no `--continue`) SHALL display usage information and exit with code 1. The script SHALL NOT launch interactive mode on bare invocation — it is a terminal-only tool that requires a query or the `--continue` flag.

#### Scenario: Bare invocation shows usage

- **WHEN** user runs `web` with no arguments
- **THEN** the script SHALL display "Usage: web [OPTIONS] [query]"
- **AND** the script SHALL display "web -c        continue most recent session interactively"
- **AND** exit with code 1

#### Scenario: Continue flag without query is valid

- **WHEN** user runs `web -c` with no query
- **THEN** the script SHALL NOT error on missing query
- **AND** the script SHALL launch `pi -c` interactively

### Requirement: No thinking level override

Unlike `ask`, the `web` script SHALL NOT support a `--thinking` flag. The thinking level SHALL be hardcoded to `off`. This is because web search is a retrieval task that benefits from speed over deep reasoning.

#### Scenario: Thinking is hardcoded off

- **WHEN** user runs `web "query"`
- **THEN** the script SHALL set `--thinking off` in the pi invocation
- **AND** there SHALL be no `--thinking` option in the help output

#### Scenario: Help output excludes thinking flag

- **WHEN** user runs `web --help`
- **THEN** the help output SHALL NOT list a `--thinking` option
- **AND** the help output SHALL only list `-h`, `--help`, `-c`, and `--continue`

### Requirement: Replace-mode pi invocation

The script SHALL invoke pi in replace mode. It SHALL pass `--system-prompt` with the contents of `search-web.md`. It SHALL pass `--no-extensions` and selectively re-add required extensions via `-e`. It SHALL pass `--no-builtin-tools --no-prompt-templates --no-skills`.

#### Scenario: Replace mode with stripped defaults

- **WHEN** the script launches pi
- **THEN** it SHALL pass `--system-prompt` with the web prompt content
- **AND** it SHALL pass `--no-extensions --no-builtin-tools --no-prompt-templates --no-skills`
- **AND** it SHALL pass `-p` for print mode (terminal tool)

#### Scenario: Required extensions are re-added

- **WHEN** the script launches pi
- **THEN** it SHALL pass `-e` for each required extension
- **AND** the extensions SHALL be: `pi-search-hub`, `pi-island`, `@dreki-gg/pi-context7`
- **AND** extension paths SHALL be under `${HOME}/.pi/agent/npm/node_modules/`

### Requirement: Model configuration

The script SHALL use the model `github-copilot/claude-haiku-4.5`. This model is chosen for speed and efficiency in retrieval tasks, in contrast to the deep reasoning model used by `ask` and `unity`.

#### Scenario: Model is claude-haiku-4.5

- **WHEN** user runs `web "query"`
- **THEN** the script SHALL invoke pi with `--model "github-copilot/claude-haiku-4.5"`

### Requirement: Continue mode

The script SHALL support `-c` / `--continue`. When `-c` is provided without a query, the script SHALL launch `pi -c` with no mode-specific configuration (bare continue, inheriting prior session state). When `-c` is provided with a query, the script SHALL launch `pi -c -p "query"` with the full web configuration.

#### Scenario: Continue without query

- **WHEN** user runs `web -c`
- **THEN** the script SHALL launch `pi -c` with no additional flags
- **AND** the prior session's model, thinking, and prompt SHALL be restored by pi

#### Scenario: Continue with query

- **WHEN** user runs `web -c "follow-up question"`
- **THEN** the script SHALL launch `pi -c -p "follow-up question"` with the full web configuration

### Requirement: Output pipeline

For print mode (all invocations since web requires a query), the script SHALL pipe pi's output through the Markdown-to-terminal rendering pipeline: `mq -I markdown '.' | txc-safe -f - -c -n | glow`.

#### Scenario: Print mode output is formatted

- **WHEN** the script launches in print mode
- **THEN** output SHALL be piped through `mq | txc-safe | glow`

### Requirement: Cross-spec compliance

The `scripts/web` script SHALL comply with `pi-mode-script` for general shell launcher structure. Web-specific behavior (model selection, thinking off, replace mode, terminal-only requirement) SHALL be defined here as domain extensions.

#### Scenario: Web script passes cross-spec validation

- **WHEN** `scripts/web` is validated against `pi-mode-script` and `web-script`
- **THEN** it SHALL pass both validations
- **AND** all file path references SHALL match the target system paths (post `chezmoi apply`)
