# 08 — VS Code pi launcher via onchange script

**What to build:** A minimal VS Code extension that launches pi in the integrated terminal with a single command — no terminal interception or file-reference injection. It is installed by a hashed-input onchange script so it re-installs when its inputs change, and it uses a pi-specific environment marker so it never collides with the retired opencode extension. From a user's perspective: pi starts in the integrated terminal with one command, and the launcher stays fresh when its inputs change.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The launcher command starts pi in the integrated terminal.
- [ ] The extension is installed by a hashed-input onchange script and re-installs when its inputs change.
- [ ] The extension performs no terminal interception and no file-reference injection — it only launches pi.
- [ ] A pi-specific environment marker distinguishes the launcher from the retired opencode extension.
