# 08 — VS Code pi launcher via onchange script

**What to build:** A minimal VS Code extension that launches pi in the integrated terminal with a single command — no terminal interception or file-reference injection. It is installed by a hashed-input onchange script so it re-installs when its inputs change, and it uses a pi-specific environment marker so it never collides with the retired opencode extension. From a user's perspective: pi starts in the integrated terminal with one command, and the launcher stays fresh when its inputs change.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] The launcher command starts pi in the integrated terminal.
- [x] The extension is installed by a hashed-input onchange script and re-installs when its inputs change.
- [x] The extension performs no terminal interception and no file-reference injection — it only launches pi.
- [x] A pi-specific environment marker distinguishes the launcher from the retired opencode extension.

## Answer

Built the minimal `pi-launcher` extension at `tools/extensions/vs-code/pi-launcher/` (source-only provisioning material, mirroring the retired opencode-panel-redirect layout) plus the onchange script at `.chezmoiscripts/run_onchange_install-vscode-pi-launcher.sh.tmpl`:

- **`package.json`** — command `pi.launch` ("Launch pi"), activated only on `onCommand:pi.launch` (no startup registration).
- **`src/extension.js`** — `pi.launch` creates a terminal named `pi` (cwd = workspace root when one is open), env `PI_CALLER=vscode`, sends `pi`. No `onDidOpenTerminal` interception, no HTTP port/file-reference injection — it only launches pi, unlike the opencode extension it replaces.
- **`install.sh`** — copies `package.json` + `src/extension.js` into `$HOME/{.vscode,.cursor,.windsurf}/extensions/pi-launcher-<version>`, same editor-arg pattern as opencode-panel-redirect.
- **Env marker** — `PI_CALLER=vscode` is the pi-specific analog of the retired extension's `OPENCODE_CALLER=vscode`, so pi terminals are identifiable and never collide with opencode-owned ones.
- **Onchange script** — hashes `package.json`, `src/extension.js`, and `install.sh` into the `config-hash:` comment per ADR-0001; any input change re-renders the script and re-triggers install.

Verified: `node --check` and `bash -n` pass; install.sh exercised against a temp `$HOME` (tree `pi-launcher-0.0.1/{package.json,src/extension.js}`); `chezmoi apply --dry-run` shows the new script being created; mutating an input flips the rendered config-hash.