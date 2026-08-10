# Onchange scripts encode input hashes in their rendered content

Onchange scripts must re-run when their inputs change, but chezmoi only notices that a script's rendered content changed. We render a `config-hash:` comment built from the sha256 of each input file (e.g. `dot_config/mise/config.toml`, the extension's `package.json`) into the script template, so any input change changes the script content and triggers re-execution. Alternatives — running scripts on every apply and trusting idempotency, or wiring up chezmoi's watch mechanism — either burn time on every apply or require per-script machinery.

**Consequences**: adding an input to a script means adding its hash to the template — the list must stay in sync with the script body.
