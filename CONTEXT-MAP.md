# Context Map

Two contexts, one per split domain. Read the one(s) relevant to the topic.

| Context   | Domain                | Location                                 | ADRs        |
| --------- | --------------------- | ---------------------------------------- | ----------- |
| config    | Machine Configuration | [`CONTEXT.md`](CONTEXT.md)               | `docs/adr/` |
| pi config | Agent tooling         | [`dot_pi/CONTEXT.md`](dot_pi/CONTEXT.md) | —           |

## Relationships

- **config → pi config**: config's Apply stages `dot_pi/` into the host's `~/.pi/agent` as Target state, but leaves pi's materialized runtime state (package trees, CLI-installed skills) in place — see config ADR-0002 (runtime state).
- **pi packages are not Tools**: a Tool is installed by a toolchain manager on the host; a pi package is declared in the pi settings and materialized by pi into runtime state.
