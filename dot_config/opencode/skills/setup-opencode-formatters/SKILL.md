---
name: setup-opencode-formatters
description: Configure OpenCode formatters for a repo by reading the codebase — enables built-in formatters only when the project declares one (a formatter config or dependency), adds a custom entry only for a declared formatter no built-in covers, and leaves formatters off otherwise so a project's files aren't reformatted into git noise. Use when setting up a repo, when a language's formatter is missing, or as invoked by setup-opencode-repo.
---

# Setup Formatters

Enable formatters only when the project already wants them. Enabling a formatter for a language the project doesn't format rewrites files on every write — churn that shows up as git noise. So `formatter` stays off unless the codebase declares a formatter; when it does, built-ins (prettier, shfmt, gofmt, ruff, …) cover most languages and opencode applies the one matched to each file's extension. A custom formatter is the exception, written only for a declared formatter that no built-in covers.

## Process

### 1. Explore the codebase

Walk the repo — root layout, manifest files, file tree — and note two things: the languages actually present, and any formatter the project already declares. Ignore `node_modules`, build output, and generated code.

A project declares a formatter when the codebase carries its config or dependency, e.g.:

- prettier: `.prettierrc*` / `prettier.config.*`, or `prettier` in `package.json`
- biome: `biome.json` / `biome.jsonc`, or `@biomejs/biome` in `package.json`
- C/C++: `.clang-format`
- Python: `ruff` / `black` (or their config in `pyproject.toml`)
- shfmt, gofmt, rustfmt: whatever the project's convention declares

When a signal is ambiguous, check with the user rather than guessing.

### 2. Decide — does the project require formatters?

If the codebase declares none of these (and no other formatter signal), leave `formatter` off: do not enable it, and say so. Enabling formatters without a project declaration would reformat files the project never formatted — churn and git noise, not setup.

If the project declares one or more formatters, proceed.

### 3. Enable the built-ins

Set `"formatter": true` in the repo's `opencode.jsonc` (create from `setup-opencode-repo`'s seed if absent). This turns on every built-in formatter; opencode applies the one matched to each file's extension. Merge into any existing section — never replace unrelated keys.

### 4. Add custom formatters for the gaps

For each declared formatter that no built-in covers (checked against opencode's built-in registry at setup time), plan a custom entry using a mise-managed tool: command + `extensions`, plus `environment` where the tool needs it (e.g. `DOTNET_ROOT`). Show the planned entry and confirm before writing.

### 5. Verify

- Each custom formatter resolves through mise (e.g. `mise x -- shfmt --version`); flag anything missing — `mise install` may be needed — rather than writing config for a tool that isn't there.
- The resulting `opencode.jsonc` parses as valid JSONC.

Completion: `formatter` is enabled iff the project declares a formatter, every declared formatter is covered by a built-in or a runtime-verified custom entry, and no formatter runs for a language the project didn't ask to be formatted.

## Troubleshooting

- Formatter doesn't run: some built-ins need a project dependency or config to fire (e.g. `prettier` in `package.json`); startup-dependent — restart after config changes.
- Command not found: the mise backend syntax may differ — check `mise registry <tool>`, then `mise install`.
