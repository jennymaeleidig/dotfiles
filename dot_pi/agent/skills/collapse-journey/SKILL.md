---
name: collapse-journey
description: Collapse a wayfinding journey into its spec — fold the map, resolved decision tickets, research, and prototype artifacts into the spec until it is the single self-contained source of truth, then delete them. Run after `to-spec` and before `to-tickets`, or to re-collapse an effort still carrying stale artifacts.
argument-hint: "<effort> — the .scratch slug to collapse"
disable-model-invocation: true
---

Collapse an effort's **journey** into its `spec.md`: fold the decision content of the wayfinder map, its decision tickets, `research/`, `prototype/`, and any loose intermediate note into the spec, so the spec becomes the single **self-contained** source of truth — then delete the journey. The spec survives; the journey does not.

Run after `to-spec` (the spec must already exist — there is nothing to fold into otherwise) and before `to-tickets` (which writes fresh implementation tickets from the clean spec). Re-running on an already-collapsed effort is a no-op.

## Identify the journey

Resolve the effort from `<effort>` or the conversation context. Its spec is `.scratch/<effort>/spec.md`; stop if it is missing.

Classify every file under `.scratch/<effort>/` as **journey** (to delete) or **survivor** (to keep):

- **Journey**: `map.md`, `research/`, `prototype/`, any wayfinder decision ticket in `issues/`, and anything else that is neither `spec.md` nor an implementation ticket.
- **Survivor**: `spec.md`, and any implementation tickets already present in `issues/`.

**Decision ticket vs implementation ticket.** Both live in `issues/`; only their shape differs. A wayfinder decision ticket carries a `Type:` line (`research` / `prototype` / `grilling` / `task`) and a `## Question` body. An implementation ticket carries `What to build` + `Blocked by` + a `Status:` line and checkbox acceptance criteria. Collapse deletes decision tickets only.

Done when every file is classified and the journey inventory is complete.

## Fold decisions into the spec

For each journey artifact, fold its **decisions** into the spec under the heading they belong to, or a new appendix. The inline test:

- **Inline** anything a later ticket must read to build the feature without the artifact: final config, final wording, schemas, resolved decision-ticket answers.
- **Drop** everything that records how a decision was reached: source indexes, citations, commit tables, rejected alternatives, dead ends. The artifacts are deleted, so a citation points at nothing — the spec keeps the decision, the journey keeps the how-we-got-there.
- A constraint inseparable from a decision is part of it — inline it whole ("never `0` — `0` waits forever").

**Fix drift while folding.** Inline the *current* decision, not the artifact's version. Where artifact and spec disagree, the spec wins — it is newer.

Done when every decision that lived only in a journey artifact now lives in the spec.

## Strip provenance

Remove any language in the spec that gestures at the journey — "from the research", "prototype-derived", "hammered in a prototype". The spec asserts decisions as its own; it does not narrate how they were reached.

Leave the spec unstamped — no `Status:` line, no "collapsed on" note. Deletion of the journey is the whole signal; the spec carries no trace of the collapse.

Done when no sentence in `spec.md` names the journey or how a decision was reached, and the spec carries no marker — no `Status:` line, no stamp.

## Gate and verify

1. **Every decision ticket resolved.** Confirm each wayfinder decision ticket is `resolved` (the `Status:` vocabulary from the repo's issue-tracker doc). If any is open, stop and resolve it first.
2. **No dangling references.** Grep `spec.md` and every survivor ticket for `research`, `prototype`, `map`, and each journey filename. Clean is the bar.
3. **Self-contained.** Read `spec.md` as if it were the only artifact: an agent holding just it could build the feature correctly — every config, wording, and schema the spec relies on is present, no "see the research", no undefined term, no stale path.

Done when all three pass.

## Show the manifest, then delete

Print a delete manifest — one line per journey file, each annotated **inlined → where** or **discarded (provenance)**. Print it in the summary; never write it to disk.

Then delete the journey. The effort ends as `spec.md` alone — plus any implementation tickets that already existed.

Done when the journey is gone and only survivors remain.
