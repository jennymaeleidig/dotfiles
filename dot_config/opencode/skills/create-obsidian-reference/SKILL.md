---
name: create-obsidian-reference
description: Create a structured reference document in journal/ai-reference-docs/ from the current conversation.
compatibility: opencode
---

# Create Obsidian Reference Doc

Create a structured reference document from the current conversation and save it to the Obsidian vault. This skill is triggered by explicit user command only — the agent does not auto-invoke it.

## Vault

```
$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Vault
```

Destination: `journal/ai-reference-docs/`. Notes are raw format — no `---` separator and no tags. The skill defines the output structure.

## Workflow

1. Derive a **descriptive kebab-case title** from the conversation topic (lowercase, hyphens only, strip special characters).
2. **Ask the user to confirm** the derived filename before writing.
3. If a note at the same path already exists, **ask** — overwrite, skip, or new name.
4. Assemble the document from conversation context using the template below.
5. **No-AI-slop pass.** Load `skill("no-ai-slop")`, then apply its **Edit** job
   to the assembled document. Apply the rules: cut banned words, tighten empty
   phrases, unwrap colon reveals and binary contrasts, replace weak verbs,
   rewrite throat-clearing openers. Return the cleaned document. Keep the
   "What changed" section internal — do not write it into the output file.
6. Write to `<vault>/journal/ai-reference-docs/<filename>.md`.
7. Report the full path to the user.

## Template

```markdown
# <Title>

## Summary

[One or two paragraphs of narrative context — what was discussed, how the
conversation progressed, and the key takeaways. Do not repeat detail that
belongs in Content.

**For complex conversations spanning multiple stages**, prefer a compact table
that names each stage and its one-line focus, followed by a brief closing
paragraph with the core takeaway:

| Stage | Focus |
| ----- | ----- |
| ...   | ...   |

The table makes the progression scannable without repeating Content detail.
Keep each Focus cell to one line — Content carries the substance.]

## Content

[Structured explanation, analysis, comparisons, and findings. When a diagram
would clarify the content, first use `skill("ascii-art-diagrams")` to load
it, then follow its PLAN -> DRAW -> VERIFY workflow. Always wrap diagrams in
code fences so editors do not mangle the alignment.
```

ASCII diagram

```

This section carries the substance. Prefer tables for comparisons. Prefer lists
for sequences. Prefer concrete examples over abstract descriptions.

Content must be self-contained — assume referential transparency. A reader
should understand everything from this document alone; do not rely on external
pages or prior conversation context.]

## Sources

| Source | URL | Relevance |

[Every referenced URL from the conversation. "Source" is a short human-readable
label (e.g., "Reddit comment", "Numina paper", "CACM article"). "Relevance" is
one sentence about why this source matters to the topic. If a URL was discussed
but could not be accessed (paywall, 404), note it and leave the cell empty or
state the access issue.]

## Glossary

| Term | Definition | Source |

[Every domain-specific term used in the document that a reader might not know.
"Source" points back to the Source, Tool, or conversation context that
introduced the term. Prefer reusing definitions from prior reference docs when
the term appears in multiple documents — keep vocabulary consistent across the
vault.]

## Tools

| Tool | Description | Source |

[Every tool, library, or project referenced. "Source" is where the tool entered
the conversation (the paper, article, or context that discussed it).]

## Open Questions

- [Unresolved questions raised during the conversation. These are boundaries
  of current knowledge — not todos or action items. Each line is a single
  question that points at an unknown worth investigating.]
```
