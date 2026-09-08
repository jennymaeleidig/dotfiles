---
status: amended — dormant: the repo carries no slash prompts or workflows today; this decision applies again if they return
---

# Slash prompts dispatch workflows; loops live in workflow scripts

Two earlier ADRs shaped prompt runs — Mermaid state machines dispatching ralph-runner loops, then thin prompt dispatchers over saved workflow scripts — and both mechanisms are since retired from the repo. The surviving decision, if slash prompts return: a prompt is a **thin dispatcher** — a dispatch state that runs a named saved workflow, an inline collect state, and one terminal report-back state — and all loop machinery (iteration caps, repair rounds, completion verification) lives in the workflow script.

Workflows won over an in-prompt loop on three points: verification is a `gate` that actually runs and fails the stage on non-zero exit (not self-attestation), bubble-up is a runtime-validated `schema` (not prose instruction), and each stage is individually inspectable live. What survives regardless: isolation (substantive work never runs in the orchestrator — the workflow sandbox enforces it, the script can only spawn agents), questions are bubbled artifacts relayed to the user, never answered or dropped, and effort runs resume from disk state, not a journal.
