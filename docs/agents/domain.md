# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

This is a **multi-context** repo. Read **`GLOSSARY-MAP.md`** at the repo root — it points at one `GLOSSARY.md` per context. Read the glossary for the context you're working in:

- **`GLOSSARY.md`** (root) — machine config: dotfiles, shell, editors, and the host itself.
- **`dot_pi/GLOSSARY.md`** — pi / agent tooling: skills, extensions, warden, MCP, sandbox.

Read ADRs that touch the area you're about to work in: `docs/adr/` for system-wide decisions, `dot_pi/docs/adr/` for pi-specific ones. For cross-cutting work, read both glossaries.

If any of these files don't exist yet, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── GLOSSARY-MAP.md                    ← points at the two contexts
├── GLOSSARY.md                        ← machine-config context
├── docs/adr/                          ← system-wide decisions
└── dot_pi/
    ├── GLOSSARY.md                    ← pi / agent-tooling context
    └── docs/adr/                      ← pi-specific decisions
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-000X (…), but worth reopening because…_
