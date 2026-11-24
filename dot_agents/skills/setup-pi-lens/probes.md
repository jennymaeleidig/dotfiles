# Probes

One file per bucket, one unambiguous error, queried through the host. Delete the file after
the probe; it is not a fixture. These snippets are starting points — replace them with an
error that is idiomatic for the repo when one exists. They cover the common buckets; for any
other supported language, write an equivalent one-error probe.

| Language | Probe file | Content | Expected |
| --- | --- | --- | --- |
| TypeScript | `p.ts` | `export const n: number = "s";` | `[typescript]` 2322, *string is not assignable to number* |
| JavaScript | `p.js` + `jsconfig.json` with `"checkJs": true` | `const n = 1; n.missing();` | `[typescript]` 2339, *property 'missing' does not exist* |
| Python | `p.py` | `def f():\n    return missing_name` | `[Pyright]` *"missing_name" is not defined* |
| Go | `p.go` | `package main\nfunc main() { x := }` | `[go]` syntax error, *expected operand* |
| Rust | `p.rs` | `fn main() { let n: i32 = "s"; }` | `[rust]` E0308, *mismatched types* |
| Ruby | `p.rb` | `def f\n  missing_name\nend` | `[ruby]` undefined local variable or method |
| Bash | `p.sh` | `#!/usr/bin/env bash\nf() { echo hi;` (missing `}`) | a parse error tagged by the bash server — only when `bash-language-server` runs |
| JSON | `p.json` | `{"a":1,}` | `[json]` 519, *Trailing comma* |
| YAML | `p.yaml` | `a: 1\n b: 2` | `[yaml]` bad indentation |
| TOML | `p.toml` | `a =` | `[toml]` parse error, expected value |
| CSS | `p.css` | `a { color: ; }` | `[css]` property value expected |
| HTML | `p.html` | `<div><span></div>` | `[html]` mismatched closing tag |
| C/C++ | `p.cpp` | `int main() { int x = "s"; }` | `[cpp]` invalid conversion |
| Lua | `p.lua` | `local x =` | `[lua]` unexpected end of input |
| Markdown | `p.md` | `[broken](no-such-file.md)` | `[marksman]` broken link — or probe by navigation |
| Dockerfile | `Dockerfile` | `FROM\n` | `[docker]` invalid instruction |

## When the server has no error diagnostics

Markdown, CSS, HTML, and some config servers may report nothing for a snippet. Probe by
navigation instead: add a known symbol and require `documentSymbol` (or `references`) to
return it with the intended server.

```json
lsp_navigation { "operation": "documentSymbol", "path": "probe/p.css",
                 "maxResults": 20 }
```

`kinds` takes LSP SymbolKind names (`class`, `function`, …); omit it when you do not need a
filter.

## Reading the result

- The tag names the diagnostic source (`[Pyright]`, `[Lua Diagnostics.]`), not a registry id. A
  dispatch runner's finding is not attribution.
- Explicit-path queries bypass ignore rules: a finding on an ignored file proves the server is
  up, not that the file is in scope.

## Probe hygiene

- Put probes under an ignored path (`tmp/`) and delete each after reading its result.
- Re-run after changing a root marker or server config; a warm server keeps the old root.
