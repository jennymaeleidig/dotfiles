# Formatters & LSPs with mise + OpenCode

## Pattern

**Formatters** need a custom entry in `opencode.jsonc` pointing at the mise-managed binary.

**LSPs** are built into opencode and auto-detect — no custom entry needed unless the server requires special env vars (e.g., `DOTNET_ROOT` for csharp).

## Adding a new language

1. Add the tool to mise `~/.config/mise/config.toml`:

```toml
[tools]
prettier = "latest"                        # npm backend
"npm:typescript-language-server" = "latest" # npm backend for scoped names
shfmt = "latest"                           # aqua backend
```

2. Add a formatter entry in `~/.config/opencode/opencode.jsonc`:

```jsonc
"formatter": {
  "shfmt": {
    "command": ["shfmt", "-w", "$FILE"],
    "extensions": [".sh", ".bash"]
  }
}
```

3. Run `mise install` to pull the binary. The `run_once_setup-mise-tools.sh` chezmoi script handles this automatically on `chezmoi apply`.

## PATH

Ensure mise shims are in PATH before the interactive guard in your shell rc:

```bash
export PATH="$HOME/.local/share/mise/shims:$PATH"
```

## Troubleshooting

- **Formatter doesn't run**: opencode reads config at startup — restart after changes
- **LSP doesn't start**: most LSPs need a proper project context (e.g., `tsconfig.json`, `go.mod`)
- **Command not found**: the tool's mise backend syntax may differ — check with `mise registry <tool>`
