# Low-frequency tools lazy-load via `pi-lazy-tools`

Tool declarations and the prompt guidelines attached to them are serialized into
every request. The session's six non-builtin tools cost ~19.2 KB of the tools
array, and the guideline-bearing ones add to the system prompt as well. Most of
that text is for tools a given task never touches.

We adopt the `@wolido/pi-lazy-tools` pi package and keep a curated lazy list in
`~/.pi/lazy-tools.json` (staged as `dot_pi/lazy-tools.json`). The package
removes listed tools from the active set at `session_start`, leaves them
registered, and exposes them on demand: `load_tools` injects a tool's
description, JSON Schema, and guidelines as plain text after a confirmation
call, and `call_tool` invokes it. The current list is `resolve-library-id`,
`query-docs`, and `recall`.

Pi has no supported way to mark a third-party tool `deferred`: exposure is read
off the registering extension's own `ToolDefinition`, and `tool_search` only
ranks `codemode`/`deferred` tools, so extension tools cannot be enrolled in the
built-in deferred path without patching each package. `pi-lazy-tools` sidesteps
this by proxying: `call_tool` replays the target extension's factory against a
fake `pi` to capture the real `execute`. That replay relies on jiti's require
cache, so it must be re-checked when pi or a target extension is upgraded.

The lazy list is chosen by measured frequency, not by declaration size alone.
Across ~7 weeks of session logs the calls were: `fetch_content` ~46/day,
`subagent` ~4.8/day, `system_one` ~3.6/day, `query-docs` ~1/day,
`resolve-library-id` ~0.6/day, `recall` ~0.4/day. `fetch_content`, `subagent`,
and `system_one` stay declared; hiding a hot tool costs a two-step
`load_tools` confirmation plus a `call_tool` indirection on every use, which
outweighs the per-request saving. Measured end to end, the current list removes
5,193 bytes (~1,300 tokens) from every request.

Considered options: native `deferred` exposure (rejected — only MCP servers
expose it as config; extension tools would need a patch per package); a custom
orchestrator using `prepareLoadout` hidden declarations plus `setActiveTools`
to reactivate matches (rejected — reactivating a tool that carries
`promptGuidelines` rebuilds the system prompt and invalidates the cache prefix);
`codemode` with `mode: "only"` (rejected — it hides the built-in tools too and
routes everything through JavaScript rather than first-class tool calls).

Consequences: the context saving is fixed per request and cache-safe, because
lazy tools are never activated and the tools field and system prompt are frozen
after `session_start`. The price is latency and turns on the tools that do get
used, so the list is a living choice — re-measure and prune as usage shifts.
