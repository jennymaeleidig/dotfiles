# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One effort per directory: `.scratch/<effort>/`
- The spec is `.scratch/<effort>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<effort>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first) — never a single combined tickets file
- Current state is recorded as a `Status:` line near the top of each issue file
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## Status

Used by the `effort-specifier`, `ticket-creator`, and `effort-implementer` agents. A ticket's `Status:` line holds exactly one of three states:

- `open` — a published, unclaimed ticket. A missing `Status:` line also means `open`.
- `claimed` — a session has picked the ticket up. Set before any work so concurrent sessions skip it.
- `resolved` — terminal: hand-off and close are the same state. Never `done`.

Lifecycle: publish → `open`; claim → `claimed`; hand-off/close → `resolved`.

- `effort-specifier` publishes the **spec** at `.scratch/<effort>/spec.md` — no `Status:` line; publishing is the whole signal.
- `ticket-creator` publishes one **ticket** file per `.scratch/<effort>/issues/<NN>-<slug>.md`, each `Status: open`.

## When a skill says "publish to the issue tracker"

- `effort-specifier` → write `.scratch/<effort>/spec.md`
- `ticket-creator` → write one file per ticket at `.scratch/<effort>/issues/<NN>-<slug>.md`

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Created by the `/wayfind` prompt (wraps the `wayfinder` skill) — the map and its child tickets live here, resolved at the end of the journey. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` — the Notes / Decisions-so-far / Fog body.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`).
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
