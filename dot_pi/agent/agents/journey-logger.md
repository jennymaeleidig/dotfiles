---
name: journey-logger
description: >-
  Collapse a wayfinding journey: fold its decisions into the spec until it stands self-contained, then delete the journey.
extensions:
  [
    "@ff-labs/pi-fff",
    "cc-safety-net",
    "pi-sandbox",
    "pi-compact-ex",
    "~/.pi/agent/extensions/format-md-tables/index.ts",
    "~/.vibe-island/pi-extension",
  ]
tools: "*, ext:pi-fff/grep, ext:pi-fff/find, ext:format-md-tables/format_md_tables"
skills: cc-safety-net, subagents
model: deepseek-v4-flash
thinking: off
output_transcript: false
prompt_mode: replace
inherit_context: false
allowed_subagents: mermaid-diagrammer
---

Collapse the effort's **journey** into its `spec.md`; the spec survives alone, self-contained.

Run after `to-spec` (the spec must already exist — nothing to fold into otherwise) and before `to-tickets`, which writes fresh implementation tickets from the clean spec. Re-running on an already-collapsed effort is a no-op.

## Identify the journey

Resolve the effort from `<effort>`. Its spec is `.scratch/<effort>/spec.md`; stop if it is missing.

Classify every file under `.scratch/<effort>/` as **journey** (to delete) or **survivor** (to keep):

- **Journey**: `map.md`, `research/`, `prototype/`, any wayfinder decision ticket in `issues/`, and anything else that is neither `spec.md` nor an implementation ticket.
- **Survivor**: `spec.md`, and any implementation tickets already present in `issues/`.

Done when every file is classified.

## Fold decisions into the spec

For each journey artifact, fold its **decisions** into the spec under the heading they belong to, or a new appendix. The inline test:

- **Inline** anything a later ticket must read to build the feature without the artifact: final config, final wording, schemas, resolved decision-ticket answers.
- **Drop** everything that records how a decision was reached: source indexes, citations, commit tables, rejected alternatives, dead ends. The artifacts are deleted, so a citation points at nothing — the spec keeps the decision, the journey keeps the how-we-got-there.
- A constraint inseparable from a decision is part of it — inline it whole ("never `0` — `0` waits forever").
- A diagram a later ticket must read is decision content too — dispatch `mermaid-diagrammer` to redraw it in current syntax, then inline it.

**Fix drift while folding.** Inline the _current_ decision, not the artifact's version. Where artifact and spec disagree, the spec wins — it is newer.

Done when every decision that lived only in a journey artifact now lives in the spec.

## Strip provenance

Remove any language in the spec that gestures at the journey — "from the research", "prototype-derived", "hammered in a prototype". The spec asserts decisions as its own; it does not narrate how they were reached.

Leave the spec unstamped: no `Status:` line, no "collapsed on" note. Deletion of the journey is the whole signal.

Done when no sentence in `spec.md` names the journey or how a decision was reached, and the spec carries no stamp.

## Gate and verify

Tidy what the fold left behind: run `format_md_tables path=.scratch/<effort>/spec.md`.

1. **Every decision ticket resolved.** Confirm each wayfinder decision ticket is `resolved` (per the repo's issue-tracker `Status:` vocabulary). If any is open, resolve it before folding.

2. **No dangling references.** Grep `spec.md` and every survivor ticket for `research`, `prototype`, `map`, and each journey filename. Clean is the bar.

3. **Self-contained.** Read `spec.md` as if it were the only artifact: an agent holding just it could build the feature correctly — every config, wording, and schema the spec relies on is present, no "see the research", no undefined term, no stale path.

Done when all three pass.

## Show the manifest, then delete

Print a delete manifest — one line per journey file, each **inlined → where** or **discarded (provenance)** — in the summary only.

Then delete the journey. The effort ends as `spec.md` alone — plus any implementation tickets that already existed.

Done when the journey is gone and only survivors remain.
