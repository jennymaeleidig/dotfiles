---
status: amended — the prompts and workflows this ADR governs are retired from the repo; dormant, and applies again if slash prompts return
---

# Slash prompts dispatch workflows; loops live in workflow scripts

_(Amended: the repo no longer carries slash prompts — `dot_pi/agent/prompts/` and
`dot_pi/agent/workflows/` are gone, and `dot_pi/CODING_STANDARDS.md` covers
agent files only. The decision stands dormant: if prompts return, they return as
thin dispatchers per this ADR.)_

ADR 0010 made every slash prompt a Mermaid state machine whose substantive states dispatch `ralph-runner` loops. pi-subagents' `SubagentWorkflow` offers the same orchestration as executable script — `agent()` calls with `agentType`, structured `schema` results, `gate` verification, and a journal — and every primitive the ralph loop provided has a workflow-native equivalent. We therefore supersede 0010: a prompt is now a **thin dispatcher** — a dispatch state that runs a named saved workflow (`dot_pi/agent/workflows/<name>.js`), an inline collect state, and one terminal report-back state — and the loop machinery (iteration caps, repair rounds, completion verification, question collection) lives inside the workflow script.

The workflow version is stronger at three points where the ralph loop was weakest. Verification is a `gate` — a shell command that actually runs and fails the stage on non-zero exit — replacing the `<promise>COMPLETE</promise>` self-attestation. The bubble-up protocol is a `schema` field the runtime validates, replacing prose instruction. And each stage is individually inspectable live (pause, skip, retry) from `/agents → Workflows`, replacing a single opaque `state.json`. What is lost: the workflow journal does not survive a session restart, where `.ralph/<name>.state.json` did. Crash recovery moves from iteration-granularity to ticket-granularity — the ticket tracker's `Status:` lines are the durable state, so a relaunched workflow re-discovers the remaining frontier from disk and loses only in-flight iteration context.

## What survives from 0010

- **Isolation.** Substantive work still never runs in the orchestrator. The enforcement point moves from the run preamble to the workflow sandbox itself: the script cannot do work, only spawn agents that can.
- **Bubble up.** Questions remain delivered artifacts relayed to the user, never answered or dropped; now collected into the workflow's return value.
- **The prompt lifecycle.** wayfind → to-effort-spec → log-journey → to-impl-tickets → implement → close is unchanged, as is `implement`'s two entry modes (automated `/implement-effort`, supervised per-ticket) and `reviewer` last in every dispatch label.
- **The wayfind exception.** `/wayfind` remains the one interactive inline prompt — no workflow, no dispatch — unchanged in both letter and sanction.

## Considered options

- **Keep 0010 and layer workflows beside ralph-runner** (rejected): two loop engines with one job is the ambiguity the 0010 preamble and dispatch fingerprint existed to prevent; an orchestrator could reach for either, and nothing would say which was authoritative.
- **Wrap ralph-runner inside workflow stages** (`agentType: 'ralph-runner'` per stage) (rejected): a workflow child running a ralph loop forfeits `gate`/`schema` on resumed calls and pays loop-in-subagent complexity for no verification gain — the loop would verify itself with the promise tag inside a machine built to verify externally.

## Consequences

- The migration is total: every prompt is a dispatcher with a same-named workflow in `dot_pi/agent/workflows/`, and the `ralph-runner` agent file is retired. The prompt lifecycle and `implement`'s two entry modes carry over unchanged — `/implement-effort` composes the per-ticket workflows and `close-effort` via `workflow()` composition.
- One run preamble serves all prompts; the workflow name and args live in the dispatch node label, not the preamble. Verification budgets (repair rounds, iteration caps) are script constants — `MAX` in each workflow — checked by reading the script, not a `.ralph` state file.
- Effort runs are resumable by relaunching the workflow — the tracker, not the journal, is the source of truth for what remains.
- pi-ralph-wiggum remains installed but unused; nothing calls `ralph_start` anymore.
- The workflow owns the fan-out, and every agent file is a leaf — no `allowed_subagents`. What agents used to delegate from inside a run (code-review axes, design-it-twice variants, mermaid redraws) is either script-level `parallel()` stages — visible, skippable, retryable inspector rows — a script stage (the seam-design dispatch in `implement-ticket`), or a bubbled question. Nested delegation is retired, which also removes the depth-cap failure mode. `output_transcript` stays on everywhere: the per-agent JSONL transcript is the forensic trail that replaces the visibility nesting lost.
