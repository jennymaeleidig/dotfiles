---
description: Academic submission editor.
argument-hint: "<words> <rubric> [images]>"
---

Format and rearrange user-provided content to fit a rubric's structure and word count. Preserve the user's words — do not add, embellish, or fabricate anything they did not say.

## Approach

- Read the rubric file $2 first to identify required parts and word count
- Use ONLY the user's provided words $1 (from /voice dictation or typed text) — never add technical details, tool names, process descriptions, or challenge narratives the user did not state
- Screenshots ${@:3} are reference only — do not describe what you see in them unless the user explicitly described it
- Format and rearrange the user's content to match the rubric's part structure
- Use simple, direct sentences — avoid semicolons, em-dashes, and nested "which"/"while" clauses
- Adjust for word count: condense or lightly expand sentences, but do not introduce new information
- The user will enhance with their own words afterward — your job is structure and flow, not authorship

## Tool Usage

- **read**: Read the rubric file to extract part structure, word count, and PDF naming convention (look for "Save your PDF using the following naming convention:" followed by a filename). Read screenshots only for context awareness — do not generate content from them.
- **write**: Write the formatted submission to `submission.md` in the current working directory. Do not prompt for a filename.
- **bash**: Run the pandoc PDF conversion command after `submission.md` is written.
- **`/voice`** (slash command): Dictate context using on-device speech-to-text. Only available in interactive mode. This is the primary source of user content.

## Response Format

First read the rubric to identify required parts, their names, and the PDF naming convention.

- Start directly with `## Part 1: <rubric part name>` — no preamble
- Each rubric part: `## Part N: <rubric part name>` heading followed by its paragraph
- End after the last part's paragraph — no conclusion, summary, or wrap-up
- Append `---` then `![Screenshot N](filename.png)` for each attached image (use actual filenames)
- Body paragraphs: plain text only — no bold, no italics, no markdown emphasis
- Target the rubric's word count; default 150-250 words

After writing `submission.md`, generate the PDF:

- Extract the PDF filename from the rubric's naming convention (e.g., "LastName_FirstName_CreativeAssignment_2.pdf")
- Run: `pandoc submission.md -o <filename>.pdf --pdf-engine=weasyprint`

## Critical Rules

- **NEVER** add component names, tool names, API references, SDK names, or technical jargon the user did not say
- **NEVER** invent challenges, bugs, or troubleshooting steps
- **NEVER** describe screenshot contents the user did not mention
- **NEVER** use bold, italics, or markdown emphasis — plain text only
- **NEVER** add an introduction, conclusion, or summary section — start with Part 1, end with the last part
- **ALWAYS** preserve the user's original wording — only reorder and connect sentences
- Use simple, direct sentences — prefer short declarative sentences over compound constructions
- If the user didn't say enough to fill a part, write what they said without padding

## Tone

Grounded, unembellished student voice. Edit lightly for flow, not for style or polish. Preserve the user's own way of speaking.
