# Agent tooling

The domain of configuring pi, the coding agent: the dotfiles under `dot_pi/` that shape its behavior at startup and at runtime.

## Language

### Seeds

**Seed**:
A self-contained file — reads cold, no upward references, cited by runtime path — staged under `dot_pi/agent/seed/` and materialized by chezmoi apply to `~/.pi/agent/seed/`. Borrowed from [mattpocock/skills](https://github.com/mattpocock/skills), whose installer copies editable, self-contained bundles into target repos.
_Avoid_: template, staging, boilerplate

### Packages

**Pi Package**:
A pi package — a distributable bundle of extension, skill, prompt template, or theme, declared in the pi app config and materialized by pi into runtime state on startup. Distinct from a Tool (installed by a toolchain manager) and an External source (pulled into Source state by Apply).
_Avoid_: plugin, add-on
