# CODING STANDARDS

## Paths

- Use `$HOME` instead of hardcoded absolute paths (e.g. `/Users/<username>/...`).
- This extends to all paths when possible — not just home directories, but any path that can reference the user's home (`$HOME/.config`, `$HOME/.local/share`, etc.).
- Hardcoded absolute paths are only acceptable when no portable variable exists.
