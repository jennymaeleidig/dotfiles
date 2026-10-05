# Borrowed code carries a citation block
Every block taken from an external source — code, config, or a doc snippet — has a full citation
block directly above it: creator, title, a resolvable source (URL, DOI, or repo plus version), and
license. A comment that names a source without all four is an incomplete citation and a violation.
Original code carries no block. A modification appends `Modified by {name} on {date} — {changes}`
under the existing block.

# Borrowed code updates CITATION.cff
when: turn
A run that adds borrowed code updates the project's CITATION.cff in the same run, with only fields
verifiable from the source and the original license. A run that adds none makes this rule
inapplicable.

# Files cite no records
A record is a point-in-time document: an ADR (`docs/adr/`, `ADR-0002`), a ticket, a spec, a plan, a
wayfinder map, or a research note. No code, config, or prose cites a specific one as the reason for a
change. The code and its tests state the behaviour; `CONTEXT.md` supplies vocabulary. Reasoning worth
keeping is captured deliberately — in an ADR or the documentation, case by case — never narrated into
a comment. A placeholder that defines the convention (`.scratch/<feature-slug>/spec.md`), a bare
generic filename (`spec.md`, `map.md`), and an ignore-list entry are not citations of one.
