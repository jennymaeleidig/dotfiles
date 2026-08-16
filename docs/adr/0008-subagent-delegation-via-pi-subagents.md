# Subagent delegation via pi-subagents

Decision: delegate bounded reasoning to subagents (`npm:@tintinweb/pi-subagents`) instead of running it in the main context. The main session orchestrates; five agent types cover the three areas — vision, validate, and the mattpocock skills (wayfinder/research/code-review).

## Agents

Defined in `dot_pi/agent/agents/*.md` → `~/.pi/agent/agents/` (global):

- `researcher` — background, writes a findings file; research skill + wayfinder research tickets.
- `validate` — foreground, `inherit_context: true`, read-only; validate skill's compare step.
- `code-review-standards` / `code-review-spec` — background parallel, read-only; code-review's two axes.
- `vision` — foreground leaf, read-only, vision model; vision skill.

All five set `skills: false` — a subagent must never inherit the orchestrator-side skill that spawned it (a `validate` subagent re-reading the validate skill would try to spawn another validate subagent; recursion). All five set `extensions: false` — no extension surface (`context7`, `preview_export`, fff tools) leaks into subagent sessions; their runtime tool set is exactly the builtins declared in `tools:`.

`tools:` policy per agent:

- `code-review-spec` / `code-review-standards` / `validate` — `read, grep, find, ls, bash`. "Read-only" is a directive, not a sandbox: shell access stays available, but the edit/write builtins are omitted, so in-place file mutation is not offered.
- `researcher` — all seven builtins (`read, write, edit, grep, find, ls, bash`); it writes only its findings file.
- `vision` — `read, grep, find, ls` only: no bash, no edit/write, no extensions. The only agent whose runtime set is genuinely non-write-capable.

## Vision: delegation is the whole path

The vision subagent is the sole image-processing path. A visual task flows: the orchestrator detects visual intent (explicit language, image path or attachment, image in a tool result) → spawns `vision` (foreground) with image paths and a response template → the subagent reads the images with the built-in `read` tool (image blocks) and reasons on the vision-capable model `opencode-go/mimo-v2.5` (native `text,image` input) → returns one structured JSON verdict that stays in the main context.

Rejected: pi-vision-handoff as a passive transport layer (the former ADR 0007 decision). It registered zero tools — its image→text swap only fired for text-only models and gave the subagent nothing callable. With it removed, visual work is explicit: images must reach the orchestrator as paths (inline base64 is written to a temp file first), and the active main model either sees them natively (`kimi-k2.6`, `mimo-v2.5`) or delegates on visual intent. A pasted image with no path or text on a text-only main model is not seen at all — accepted tradeoff.

Rejected: the hypa toolchain (`hypa_read` / `hypa_ls` / `hypa_shell`) as the vision image path — it never materialized in the package set and was never registered anywhere; references were dropped.

## Main session tool routing

No launch wrapper: the previous `--exclude-tools bash,ls,hypa_grep,hypa_find,hypa_read` wrapper (the former ADR 0006 decision) is removed. Main and subagent sessions were already independent — pi-subagents builds a fresh per-session tool registry per subagent, so the exclusion never reached subagents. The main session now runs all seven builtins (`read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`) plus the extension surface. Shell work stays delegable but is no longer forced out of context.

## Enforcement points

- **validate**: the mandate lives in `dot_pi/agent/skills/validate/SKILL.md` (steps 3–4 run in the `validate` subagent), not APPEND_SYSTEM.md — APPEND_SYSTEM is the global tool-routing layer, the wrong home for a per-skill mandate.
- **mattpocock skills**: not forked. Their "sub-agent"/"background agent" language resolves against a mapping block in `dot_pi/agent/APPEND_SYSTEM.md`, so upstream `~/.agents/skills` stays pullable.

## Consequences

- pi materializes pi-subagents on next startup: declared in `settings.json` `packages` per ADR 0004; peers `>=0.80.0` vs pi 0.84.1 — in range, no smoke test required.
- Agent definitions are Source state (`dot_pi/agent/agents/`), applied like skills; `.chezmoiignore` must not sweep them.
- Foreground subagents return inline; background ones notify + group-join. Vision and validate are foreground (their result is consumed inline); research and code-review are background (fire-and-join).