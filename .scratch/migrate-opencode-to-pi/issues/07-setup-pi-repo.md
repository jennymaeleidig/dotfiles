# 07 — `setup-pi-repo` skill

**What to build:** A single `setup-pi-repo` skill brings any repo to the pi setup in one step, replacing the opencode setup quartet: it explores a repo, installs the engineering skill set into the repo's `.agents/skills`, scaffolds only a minimal project settings marker, and relies on pi-lens defaults (on by default, language auto-detecting) instead of enabling per-language LSP servers or formatters. From a user's perspective: one skill call sets up a repo for pi, and there is no per-language registry to keep in sync.

**Blocked by:** 01 — Declare and materialize the sixteen pi packages.

**Status:** resolved

- [x] Exercised against a throwaway repo, `setup-pi-repo` installs the engineering skill set into the repo's `.agents/skills`.
- [x] It scaffolds only a minimal project settings marker — no noisy defaults.
- [x] It relies on pi-lens defaults for language tooling; no per-language LSP or formatter setup is performed.
- [x] The opencode setup quartet is no longer used to bring a repo to pi.

## Answer

Built the single `setup-pi-repo` skill at `private_dot_pi/private_agent/skills/setup-pi-repo/` (applied to `~/.pi/agent/skills/setup-pi-repo/`), collapsing the opencode setup quartet into one prompt-driven skill:

- **`SKILL.md`** — explore the repo, install the engineering skill set into `.agents/skills/` per the registry, scaffold the minimal `.pi/settings.json` marker, and skip per-language LSP/formatter setup (pi-lens is on by default and auto-detects languages).
- **`config.md`** — the registry: mattpocock/skills (25) + no-ai-slop installed via `npx skills add ... --agent universal --copy -y` (the universal agent targets `.agents/skills/`, the project-scope dir pi searches), seed-local `validate` skill + prompt template, and the `create-obsidian-reference` exclusion.
- **`seed/`** — `settings.json` (`{}`, the minimal marker), `skills/validate/SKILL.md`, and `prompts/validate.md` (the opencode `validate` command reborn as a pi prompt template, since pi reads `.pi/prompts/*.md`).

Skill seam exercised against a throwaway repo: the resulting repo had all 27 skills in `.agents/skills/`, the `{}` `.pi/settings.json` marker, `.pi/prompts/validate.md`, no `create-obsidian-reference`, and no LSP/formatter config. `--agent universal` verified to install into `.agents/skills/`. `disable-model-invocation: true` is valid in pi (hidden from the system prompt; `/skill:setup-pi-repo` to invoke).
