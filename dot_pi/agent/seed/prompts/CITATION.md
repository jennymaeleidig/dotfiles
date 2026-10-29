# Citation policies

Policies for external code incorporated into a project. New, original
code is CC0-1.0 (SPDX `CC0-1.0`) and needs no citation.

Every block taken from an external source — code, config, or a doc snippet — cites: creator, title, a resolvable source (URL, DOI, or repo plus version), and license.

Two layers apply to every borrow: a citation block above the code
(humans read) and a `CITATION.cff` in the project root (tools parse).

The access date to use: `date +%Y-%m-%d`.

## Code Citation Policy (human-readable block)

Borrowing or adapting external code — verbatim or adapted, any external
source — adds a citation block immediately above it, per the
[FORCE11 Software Citation Primer](https://raw.githubusercontent.com/force11/force11-sciwg/master/guidance/software_citation_primer.md):
cite the software itself — Creator, Title, resolvable Identifier (DOI
preferred) — plus Version, Date, and license as available.

Adapt the comment syntax to the target language. Python example:

```python
# Citation: {Creator} — {Title} (v{version}) [{License}]
# Source: {resolvable permalink or DOI}
# Accessed: {date}
```

- Cite every borrowed or adapted block, with a specific version — tag,
  commit hash, or access date.
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
