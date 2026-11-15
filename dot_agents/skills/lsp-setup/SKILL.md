---
name: lsp-setup
description: Set up and verify language servers (LSP) for a repository. Use when initializing LSP, when a language has no diagnostics or navigation, when adding a language, or when a server resolves the wrong project root.
---

# LSP setup

Take a repository from no LSP to **every source language verified by a probe, or recorded as `unsupported`**.

The host adapter holds the configuration and probing mechanics. For pi-lens, read [hosts/pi-lens.md](hosts/pi-lens.md).

A **probe** is a temporary file carrying one unambiguous error, queried through the host.
**Attribution** is the finding naming the server that produced it: the tag is the server's
diagnostic source (`[Pyright]`, `[Lua Diagnostics.]`), not its registry id. A finding from
another tool is not attribution. Silence is never clean.

Vocabulary used throughout: **bucket** (one language's tracked files), **root marker**
(the file that anchors a server's project root), **project-local** (install owned by the
repo, e.g. a devDependency), **unsupported** (terminal outcome: no server exists, or none can run here).

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
package, supported extensions, and root markers for each bucket. A language the registry
defines but the matrix omits is supported: add a row, then continue.

Done: every bucket has a candidate server, or an explicit `unsupported` line naming why
(no server in the ecosystem, or a server the host cannot launch).

### 3. Choose install ownership

Default to **project-local**: a devDependency with a lockfile entry, so a fresh clone
resolves the same server without depending on the user's PATH. Use a global or host-managed
install only where the ecosystem makes project-local impossible; record that reason in the
matrix row.

Done: every server has one declared owner, every non-project-local owner has its reason
recorded, and step 7 records the version the verification ran against.

### 4. Anchor the root

Place the marker that anchors the server: `tsconfig.json` / `jsconfig.json`, `pyproject.toml`,
`go.mod`, `Cargo.toml`, `Gemfile`, `.marksman.toml`, etc. For monorepos, one marker per
subproject, not one at the top. Turn checking on deliberately: a `jsconfig.json` without
`checkJs` diagnoses nothing.

Done: each server resolves to the repo root or the intended subproject. A probe inside a
nested package reports that package's own findings, and a server with no root for that package
names the missing marker instead of passing silently.

### 5. Wire the host

Write only settings that differ from the host default: ignore build and asset directories,
disable scanners irrelevant to this repo, declare overrides and custom servers. Validate the
file against the host schema and commit it.

Done: the host's selection record names each intended server and the reason it was selected,
and none reports `spawn-failed`.

### 6. Probe every supported bucket

Use [probes.md](probes.md). For each bucket: write the probe file, query diagnostics through
the host, confirm **attribution**, then delete the probe file.

Done: every supported bucket produced a result naming the server that answered. Every
`unsupported` bucket has its reason recorded.

### 7. Record

Update the one document that owns editor and tooling setup (`docs/agents/lsp.md`, or a
section of `AGENTS.md`). Record the install command per language, the excluded path patterns,
the verified buckets, the `unsupported` buckets with reasons, and how to re-probe after an
upgrade. Do not restate values the config files already carry.

Done: a fresh checkout can follow that document and reach the same verified state without
this conversation; every config file it relies on is committed.

## After a failure

Read [troubleshooting.md](troubleshooting.md) before changing configuration. It separates
`spawn-failed` from `tool-not-found`, PATH from project-local, and a wrong root from a dead server.

## Adding a host

Add `hosts/<name>.md`: config paths and schema, discovery order, how to read the selected-server
state, the exact probe call, and how the host reports `unsupported`. Keep the seven steps above
unchanged; only the mechanics differ.
