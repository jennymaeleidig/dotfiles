---
name: setup-pi-lens
description: Set up and verify language servers (LSP) for a repository. Use when initializing LSP, when a language has no diagnostics or navigation, when adding a language, or when a server resolves the wrong project root.
---

# LSP setup

Take a repository from no LSP to **every source language verified by a probe, or reported as
`unsupported`**. This skill changes configuration only; it writes no repository document.

Host mechanics: [hosts/pi-lens.md](hosts/pi-lens.md).

A **probe** is one temporary file carrying one unambiguous error, queried through the host.
**Attribution** is the finding tagged with the server that answered, not its registry id; a
dispatch runner's tag is not attribution. Silence is never clean.

Vocabulary: **bucket** (one language's tracked files), **root marker** (the file that anchors a
server's project root), **project-local** (install owned by the repo), **unsupported** (no
server definition covers the language).

## Process

### 1. Inventory buckets

Walk tracked source files. Exclude dependencies, build output, vendor, caches, and binary assets.

```bash
git ls-files | sed 's|.*/||' |
  awk '{ n = match($0, /\.[^.]+$/); print (n ? substr($0, RSTART + 1) : $0) }' |
  sort | uniq -c | sort -rn   # extensions, plus extensionless names such as Dockerfile
```

Done: every tracked source file maps to a bucket; each excluded path is named with its reason.

### 2. Map buckets to servers

Use [servers.md](servers.md) and the host's server registry. Record the server id, binary or
package, supported extensions, and root markers for each bucket. Add a missing matrix row and
continue.

Done: every bucket has a candidate server, or an explicit `unsupported` line naming why.

### 3. Choose install ownership

Default to **project-local**: a devDependency with a lockfile entry, so a fresh clone resolves
the same server. When the repo or user instructions name a runtime manager (mise, asdf, nix) as
owner of runtimes and language servers, that manager owns them instead of a project-local
package; step 5 makes it the launcher. The machine manifest tracks `latest`; a repo that needs
reproducible versions pins them in its own manifest, which overrides the machine default.

Done: every server has one declared owner; every non-project-local owner states its reason in
the commit message.

### 4. Anchor the root

Place the marker that anchors the server: `tsconfig.json` / `jsconfig.json`, `pyproject.toml`,
`go.mod`, `Cargo.toml`, `Gemfile`, `.marksman.toml`, etc. For monorepos, one marker per
subproject, not one at the top. Turn checking on deliberately: a `jsconfig.json` without
`checkJs` diagnoses nothing.

Done: every server resolves to the intended root; a missing marker is named, not silently passed.

### 5. Wire the host

Write only what differs from the host default: ignore build and asset directories, disable
irrelevant scanners, declare overrides and custom servers. Put an owner launcher override in the
machine config (see [hosts/pi-lens.md](hosts/pi-lens.md)). Validate against the host schema and
commit.

Done: the host's selection record names each intended server and why; none reports `spawn-failed`.

### 6. Probe every supported bucket

Use [probes.md](probes.md). For each bucket, write the probe, query diagnostics through the host,
confirm attribution, then delete the probe. Report the verified and `unsupported` buckets, with
reasons, in the run summary. Do not create `docs/agents/lsp.md` or add a language-servers section
to `AGENTS.md`; the config files are the record.

Done: every supported bucket answers with attribution; every `unsupported` bucket is reported
with its reason.

## After a failure

Read [troubleshooting.md](troubleshooting.md) before changing configuration. It separates
`spawn-failed` from `tool-not-found`, PATH from project-local, and a wrong root from a dead server.

## Adding a host

Add `hosts/<name>.md`: config paths and schema, discovery order, how to read the selected-server
state, the exact probe call, and how the host reports `unsupported`. Keep the six steps above
unchanged; only the mechanics differ.
