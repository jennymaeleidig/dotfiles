# unity-script Specification

## Purpose
Defines Unity-specific mode extensions on the `pi-mode-script` general launcher template. Covers Unity's model selection (deepseek-v4-pro), thinking level (high), append mode, interactive default, and chezmoi path resolution. General script structure requirements are delegated to `pi-mode-script`.
## Requirements
### Requirement: Bare invocation launches interactive Unity session

When `unity` is called with no arguments, the script SHALL launch pi in interactive mode with the Unity base prompt appended and all default pi configurations preserved (extensions, built-in tools, skills, prompt templates). The script SHALL conform to the `pi-mode-script` specification for general shell launcher structure.

#### Scenario: User runs unity with no arguments

- **WHEN** user executes `unity` in a terminal
- **THEN** pi launches in interactive mode with `--append-system-prompt` set to the contents of `dot_pi/agent/prompts/unity-base.md` (chezmoi source path)
- **AND** the model is `opencode-go/deepseek-v4-pro` with `--thinking high`
- **AND** no `--no-extensions`, `--no-builtin-tools`, `--no-prompt-templates`, or `--no-skills` flags are passed

### Requirement: One-shot query mode

When `unity` is called with a query argument, the script SHALL launch pi in print mode (`-p`) with the Unity base prompt appended, process the query, and exit. The output pipeline SHALL follow the pattern defined in `pi-mode-script`.

#### Scenario: User asks a one-shot question

- **WHEN** user executes `unity "how do I configure URP settings"`
- **THEN** pi launches with `-p` flag and the query is processed non-interactively
- **AND** output is piped through `mq -I markdown '.' | txc-safe -f - -c -n | glow`

### Requirement: Continue flag preserves behavior

When `unity` is called with `-c` (or `--continue`), the script SHALL follow the pattern defined in `pi-mode-script`: if no query is provided, launch `pi -c` with no mode-specific configuration (delegating to prior session state); if a query is provided, continue the session in print mode with the Unity base prompt appended.

#### Scenario: Continue without query

- **WHEN** user executes `unity -c`
- **THEN** `pi -c` is launched with no mode-specific configuration, restoring the previous session's state from the session store

#### Scenario: Continue with follow-up question

- **WHEN** user executes `unity -c "what about normal maps"`
- **THEN** pi launches with `-c -p` and the Unity base prompt appended

### Requirement: Help flag provides usage information

When `unity` is called with `--help` or `-h`, the script SHALL display usage information and exit. The argument parsing SHALL follow the pattern defined in `pi-mode-script`.

#### Scenario: User requests help

- **WHEN** user executes `unity --help`
- **THEN** the script displays usage, options, and examples
- **AND** exits with code 0

### Requirement: Cross-spec compliance

The `scripts/unity` script SHALL comply with `pi-mode-script` for general shell launcher structure. Unity-specific behavior (model selection, thinking level, append mode, interactive default) SHALL be defined here as domain extensions. All file paths SHALL use chezmoi source conventions (`dot_` prefix for dotfiles).

#### Scenario: Unity script passes cross-spec validation

- **WHEN** `scripts/unity` is validated against `pi-mode-script` and `unity-script`
- **THEN** it SHALL pass both validations
- **AND** any path references SHALL use chezmoi source conventions (e.g., `dot_pi/agent/prompts/unity-base.md` not `~/.pi/agent/prompts/unity-base.md`)

