# Citation policies

Policies for external code incorporated into a project. New, original
code is CC0-1.0 (SPDX `CC0-1.0`) and needs no citation.

Two layers, per the [FORCE11 Software Citation
Principles](https://force11.org/info/software-citation-principles-published-2016/):
a citation block above the code that humans read, and a `CITATION.cff`
in the project root that tools parse. The block cites the borrowed code
in place; the `CITATION.cff` records every external source the project
incorporates. Both layers apply to the same borrow.

## Code Citation Policy (human-readable block)

Borrowing or adapting external code adds a citation block immediately
above it — verbatim or adapted, any external source.

Adapt the comment syntax to the target language. Python example:

```python
# Citation: {Authors} — {Title} (v{version}) [{License}]
# Source: {URL or DOI}
# Accessed: {date}
```

- Cite every borrowed or adapted block, with a unique identifier
  (permalink URL or DOI) and a specific version — tag, commit hash, or
  access date.
- Name the original license; when unknown, write `Unknown` and flag for
  verification.
- Modifying borrowed code appends
  `# Modified by {name} on {date} — {changes}`; earlier citations stay.

## Machine-Readable Citation Policy (`CITATION.cff`)

Keep a `CITATION.cff` (CFF 1.2.0 spec) in the project root for all
external code incorporated.

- Generate or update it when the project incorporates external code with
  available citation metadata.
- Only fields verifiable from the source; fabricate nothing.
- Include DOI (preferred), version, all authors (ORCID where
  available), and original license.
- Multiple external sources go under the `references` key.
- Never remove existing `CITATION.cff` content without explicit
  instruction.

Reference: [Citation File Format (CFF)](https://github.com/citation-file-format/citation-file-format)
