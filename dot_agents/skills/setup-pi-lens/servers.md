# Server matrix

Per-language data for step 2. `id` is the pi-lens server id; other hosts name servers
differently. `install` says who owns the binary: **auto** (host-managed install),
**project-local** (devDependency), **PATH** (toolchain ships it), **archive** (host downloads a
release). `PATH/auto` and `PATH/archive` mean a PATH tool is preferred and the host can also
install one. **trust** means the server executes project code at startup and the host refuses it
without project trust.

The host registry is the authority on ids, extensions, and root markers; this table is the
working snapshot. A language absent here but present in the registry is supported — add a row.
A language absent from both is `unsupported`. The Install column names the default owner only;
an `lsp.serverOverrides` launcher can move any row to a runtime manager (see
[hosts/pi-lens.md](hosts/pi-lens.md)).

| Language | Extensions | id | Binary / package | Root markers | Install | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| JavaScript/TypeScript | `.js .mjs .cjs .jsx .ts .mts .cts .tsx` | `typescript` | `typescript-language-server` (or project `tsc --lsp`) | `tsconfig.json`, `jsconfig.json`, then `package.json` + lockfile | project-local | JS diagnostics need `checkJs`; TS 7 project compiler and `@effect/tsgo` (TS 7 only) win when present |
| Python | `.py .pyi` | `python` | `pyright` (alt: `jedi-language-server`) | `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements.txt`, `Pipfile`, `poetry.lock`, `.git` | auto | Launches from the project's `.venv`/`VIRTUAL_ENV`; reads target version from ruff/pyright config |
| Go | `.go` | `go` | `gopls` | `go.work`, then `go.mod` + `go.sum`, then `.git` | PATH | |
| Rust | `.rs` | `rust` | `rust-analyzer` | `Cargo.toml` | PATH/auto | trust: executes `build.rs` and proc macros |
| Ruby | `.rb .rake .gemspec .ru` | `ruby` | `ruby-lsp` (alt: `solargraph`) | `Gemfile`, `.ruby-version`, then `.git` | auto | trust: executes the bundle |
| PHP | `.php` | `php` | Intelephense | `composer.json`, `composer.lock` | auto | |
| Shell | `.sh .bash` | `bash` | `bash-language-server` | file's directory | auto | `.zsh` excluded (dialect); `shuck` owns zsh |
| Zsh | `.zsh` | `shuck` | `shuck` | file's directory | PATH | No LSP fallback: without `shuck`, zsh is `unsupported`; the shellcheck runner may still lint it |
| PowerShell | `.ps1 .psm1 .psd1` | `powershell` | PowerShell Editor Services (bundle, runs on `pwsh`) | `.git` | auto | trust |
| JSON | `.json .json5` | `json` | `vscode-json-language-server` | file's directory | auto | |
| YAML | `.yaml .yml` | `yaml` | `yaml-language-server` | file's directory | auto | Add `# yaml-language-server: $schema=` for schema checking |
| CSS/SCSS/Less | `.css .scss .sass .less` | `css` | `vscode-css-language-server` | file's directory | auto | |
| HTML | `.html .htm` | `html` | `vscode-html-language-server` | file's directory | auto | |
| TOML | `.toml` | `toml` | `taplo` | file's directory | PATH/archive | |
| Markdown | `.md .mdx` | `marksman` | `marksman` | `.marksman.toml`, `.git` | PATH | Diagnostics are mostly link and heading checks |
| Lua | `.lua` | `lua` | `lua-language-server` | `.luarc.json`, `.luacheckrc` | archive | |
| C/C++ | `.c .h .cc .cpp .cxx .hpp` | `cpp` | `clangd` | `compile_commands.json`, `CMakeLists.txt`, `.clangd`, `.git` | PATH/archive | Without `compile_commands.json` includes resolve poorly |
| Java | `.java` | `java` | Eclipse JDT LS | `pom.xml`, `build.gradle(.kts)` | archive | Lombok needs a jar on the host env |
| Kotlin | `.kt .kts` | `kotlin` | `kotlin-language-server` | `build.gradle(.kts)`, `pom.xml` | PATH | |
| C# | `.cs` | `csharp` | `csharp-ls` (alt: `omnisharp`) | `*.csproj`, `*.sln`, `*.slnx` | PATH | trust; no directory fallback: needs a solution or project |
| F# | `.fs .fsx` | `fsharp` | `fsautocomplete` | `*.fsproj`, `*.sln` | PATH | |
| Swift | `.swift` | `swift` | SourceKit-LSP | `Package.swift`, `buildServer.json` | PATH | trust: executes SwiftPM plugins |
| Dart | `.dart` | `dart` | `dart language-server` | `pubspec.yaml` | PATH | |
| Elixir | `.ex .exs` | `expert` / `elixir` | Expert / ElixirLS | `mix.exs` | PATH | trust: runs `mix compile` |
| Gleam | `.gleam` | `gleam` | `gleam lsp` | `gleam.toml` | PATH | |
| Zig | `.zig .zon` | `zig` | `zls` | `build.zig` | PATH | |
| Nix | `.nix` | `nix` | `nixd` | `flake.nix` | PATH | trust: evaluates the flake |
| Terraform | `.tf .tfvars` | `terraform` | `terraform-ls` | `.terraform`, `.terraform.lock.hcl` | PATH | |
| Dockerfile | `Dockerfile`, `.dockerfile` | `docker` | `dockerfile-language-server-nodejs` | file's directory | auto | Alt `docker-official` (`docker-language-server`) |
| Prisma | `.prisma` | `prisma` | `@prisma/language-server` | `prisma/schema.prisma` | auto | |
| Vue / Svelte | `.vue` / `.svelte` | `vue` / `svelte` | `@vue/language-server` / `svelte-language-server` | `package.json` + lockfile | auto | |
| OCaml | `.ml .mli` | `ocaml` | `ocamllsp` | `dune-project`, `opam` | PATH | trust |
| Clojure | `.clj .cljc .cljs .edn` | `clojure` | `clojure-lsp` | `deps.edn`, `project.clj` | PATH | |
| CMake | `CMakeLists.txt`, `.cmake` | `cmake` | `cmake-language-server` | `CMakeLists.txt`, `.git` | PATH | |
| Fish | `.fish` | `fish` | `fish-lsp` | `.git` | auto | |
| Typst | `.typ .typc` | `tinymist` | `tinymist` | `typst.toml`, `.git` | auto | trust |
| CUE | `.cue` | `cue` | `cue lsp serve` | `cue.mod`, `.git` | auto | |
| Groovy | `.groovy .gvy .gy .gsh` | `groovy` | `groovy-language-server` | `build.gradle`, `settings.gradle` | PATH | trust |
| Haskell | `.hs .lhs` | `haskell` | `haskell-language-server-wrapper` | `stack.yaml`, `cabal.project`, `*.cabal` | PATH | trust |
| Lean | `.lean` | `lean` | `lake` | `lakefile.lean`, `lakefile.toml`, `lean-toolchain` | PATH | trust; toolchain-bundled, PATH-only |
| Deno | `.js .mjs .jsx .ts .mts .tsx` | `deno` | `deno lsp` | `deno.json`, `deno.jsonc` | auto | |

## Explicitly unsupported

Not every file is a bucket. Record these when they appear, so absence of a probe is never read
as a pass.

| Language | Why | What still runs |
| --- | --- | --- |
| SQL | No language server in the matrix | `sqlfluff` runner for lint and format |
| Twee / TiddlyWiki | No server exists | Nothing |
| CSV, plain text, `.env` | Not source languages | Nothing |

Add a row when a new language appears. A language the host registry defines with no row here is
supported, not `unsupported`.
