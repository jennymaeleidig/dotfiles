# 09 — opencode removal (gated final phase)

**What to build:** Only after the machine owner explicitly confirms pi works, the opencode app config, its theme external, ignore entries, onchange script, and VS Code extension are removed together from Source state, so Apply stops managing dead config and no orphaned provisioning material remains. From a fresh host's perspective: Apply reproduces the entire pi setup with no manual steps beyond pi fetching packages, in one command.

**Blocked by:** 01 — Declare and materialize the sixteen pi packages; 02 — Monokai Pro pi theme as an external source; 03 — Pi keybindings: defaults-first, interrupt relocated off bare escape; 04 — `create-obsidian-reference` prompt template and skill discoverability; 05 — Vision handoff to pi; 06 — Quota visibility for opencode-go and neuralwatt; 07 — `setup-pi-repo` skill; 08 — VS Code pi launcher via onchange script.

**Status:** ready-for-agent

- [ ] The opencode app config is removed from Source state and Apply no longer manages dead config.
- [ ] The opencode theme external, its ignore entries, and its onchange script are removed — no orphaned provisioning material remains.
- [ ] The retired opencode VS Code extension is removed.
- [ ] Removal only happens after the machine owner explicitly confirms pi works.
- [ ] A fresh host reproduces the full pi setup via Apply plus pi fetching packages, with no manual steps.
