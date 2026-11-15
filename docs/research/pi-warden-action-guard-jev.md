# pi-warden Action guard with Jev: what enabling it actually takes

Research date: 2026-11-08. Version studied: pi-warden 2.7.0 (upstream `main` at `c583cc3`, `Unreleased` empty, so the
installed copy and upstream agree). No research-notes convention exists in this repo yet, so this file is a standalone
note; there is no index to update.

Sources (primary only):

- Upstream repo: <https://github.com/DevMortimer/pi-warden>, cloned to a temp dir; `src/…:line` refs below are from that
  clone at `c583cc3`.
- Docs: [guards.md](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/guards.md),
  [configuration.md](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/configuration.md),
  [data-handling.md](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/data-handling.md),
  [README.md](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/README.md).
- Installed copies inspected: `~/.pi/agent/npm/node_modules/pi-warden` (2.7.0), `~/.pi/agent/npm/node_modules/pi-typesafe`
  (0.14.0).
- This repo: `dot_pi/agent/settings.json`, `dot_pi/agent/pi-warden/config.json.tmpl`, `.chezmoidata.toml`,
  `dot_bash_exports.tmpl`.

## 0. The premise needs correcting: there is no warden block in `settings.json`

pi-warden reads exactly two config files, both JSON files of its own:
`~/.pi/agent/pi-warden/config.json` (user) and `<project>/.pi/pi-warden.json` (project, only when pi trusts the project)
— [configuration.md § User config](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/configuration.md).
The only `settings.json` in the source is (a) the file pi-warden's write guard protects from the agent
(`src/guard.ts:1198-1200`) and (b) Claude Code's `.claude/settings.json` used by `pi-warden init claude`. Nothing in
`src/` reads pi's `settings.json` (grep for `settings.json` across `src/` and `dist/` returns only those two meanings).

So:

- **`dot_pi/agent/settings.json` needs no change at all** to turn on the Action guard, with or without Jev. Its
  `packages` entry already installs the extension; its `toolsetDefaults` entry only hides the tbox *toolset* for
  pi-warden's three tools (`warden_remember`, `warden_loops`, `warden_recall`; `src/extension.ts:3076-3097`) and has no
  effect on the guard, which runs from `tool_call` hooks.
- The file to edit is **`dot_pi/agent/pi-warden/config.json.tmpl`** (chezmoi source for `~/.pi/agent/pi-warden/config.json`).
- That template already grants Jev consent (`"typesafe": true`) and points at the TypeSafe backend, so "is Jev on?" is
  already yes for every guard that asks; only the Action guard itself is off.

Current effective state (rendered `~/.pi/agent/pi-warden/config.json`, identical to the template):

```json
"action": { "enabled": false, "tools": [], "ask": { "enabled": false }, "traceSample": 0, "feedbackLog": false }
```

Two independent switches keep the guard silent, and this matters: **an empty `action.tools` guards nothing even with
`enabled: true`.** `applyAction` takes the user's list verbatim (`src/config.ts:855-860`, installed
`dist/config.js:355-361`), so `"tools": []` yields `tools = []`, and the hook returns early on
`!config.action.tools.includes(toolName)` (`src/extension.ts:1942`). Default is
`["bash","powershell","ctx_execute","ctx_batch_execute","ctx_execute_file","write","edit"]`
(`COMMAND_TOOLS + write,edit`, `src/config.ts:553-555`, `src/tools.ts:42`).

## 1. What the Action guard does, and what Jev changes

It runs on `tool_call`, **before** the tool executes ([guards.md § Action guard](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/guards.md)):

1. Read-only tools and read-only shell lines are skipped: no request, no trace line.
2. **Pattern pass, offline, in code.** So same set (non-exhaustive): force pushes, `git reset --hard`, `git clean`,
   recursive `rm` on absolute/home/variable/parent paths, SQL `DROP`/`TRUNCATE`/`DELETE FROM`, block-device writes,
   `chmod -R 777`, fork bombs, `curl | sh`, `kill -1`, shutdown, package publishing, infra destroys, printing a
   credential variable. Also a classifier for `rm` targets (project/scratch → `risky` warn; elsewhere → `destructive`
   hold), SQL host/loopback checks, script-body scanning one level deep, and `warden-config-write`.
3. **Jev**, when consent + key + budget allow: one request per asked call, questions `irreversible`, `mutates`,
   `visible`, `intent_mismatch` (+ per-violation ones). Ask gate (`action.ask`, default on) decides in code whether the
   answer could change anything the agent sees; otherwise the call is decided offline.
4. **Act** by `mode`: `steer` (default) — the hold blocks the call and returns the judgment to the agent as the tool
   result, with "find a recoverable alternative, or explain and wait"; `confirm` — a `ctx.ui.confirm` dialog; `advise` —
   never holds, reports only.

### Warn vs hold, precisely

Severities map to levels in `src/guard.ts:3346-3394`: `destructive` → `confirm` (a hold), `risky`/`sensitive` → `warn`
(notice, call proceeds), `deny` → blocked with no dialog and no request.

| Situation | Jev **off** (or request failed, `failOpen: true`) | Jev **on** (`action.floor: "evidence"`, the default) |
| --- | --- | --- |
| Built-in destructive hit (`git push --force`, `rm -rf ~/x`, `DROP TABLE`, `printenv-secret`, …) | floors at **hold** | listed as `floor_hits` evidence only; level = judge's `irreversible` score |
| Built-in risky hit (`rm -rf build/`, `git branch -D`, `sudo`, `gh pr merge`, …) | **warn** | evidence only; judge decides |
| `write` that overwrites an existing file outside the project | **hold** | evidence only; judge decides |
| `write` creating/editing outside the project, `sensitive-path` (.env, SSH, AWS, npm, kube) | **warn** | deferred to the judge for bash (does this command *write*?), immediate warn for `write`/`edit` |
| Write to `.pi/pi-warden.json` or `<agent dir>/pi-warden/**` (`warden-config-write`) | **hold** | **hold** — pushed after the verdict, unconditionally (`src/extension.ts:2058-2071`) |
| User `commandRules` `confirm`/`deny`/`warn`, `pathRules`, armed rules | as declared | as declared (user rules keep their action in both modes) |
| `irreversible` score ≥ 0.9 | n/a | **hold** |
| `irreversible` 0.5–0.9 | n/a | **warn** |
| `intentMismatch` ≥ 0.9 (with a plan) | n/a | warn + status line/trace, never sent to the agent |
| `visibleMismatch` ≥ 0.8 (commit/push/publish/install/launch) | n/a | warn + status line/trace |
| off-task / `scope` / `should_proceed` | n/a | report only, **never hold**; only asked on the `traceSample` call |

The load-bearing sentence, quoted ([guards.md:51](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/guards.md)):

> In **evidence mode** (`action.floor: "evidence"`, the default), built-in pattern hits listed above are fed to the
> judge as `floor_hits` in the request state and traced as `(evidence)` in reasons, but they do not set the hold level.
> The judge's `irreversible` score against the configured thresholds decides warn and confirm. … Without a judge
> (TypeSafe unavailable, consent off, request failed), or in **level mode** (`action.floor: "level"`), the floor applies
> as before: destructive hits hold, risky/sensitive hits warn, outside-project existing-file writes hold.

Consequence people miss: **turning Jev on makes the built-in patterns *weaker*, not stronger.** With Jev on and the
default floor, `git push --force` on a branch you asked to force-push scores below 0.9 and merely warns
(`git reset --hard HEAD~1` after "undo commit" scores 0.68, `npm publish` after "publish package" 0.56 —
[guards.md:68](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/guards.md)). Jev adds coverage patterns
cannot reach (`db:reset` after "add a column") and removes holds the task justified. `action.floor: "level"` keeps the
patterns authoritative while still letting Jev raise the level.

## 2. Exact configuration, documented defaults

Everything lives in `~/.pi/agent/pi-warden/config.json`. Defaults from
[configuration.md § User config](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/configuration.md)
verbatim (`src/config.ts:553-578`):

```json
"action": {
  "enabled": true,
  "tools": ["bash", "powershell", "ctx_execute", "ctx_batch_execute", "ctx_execute_file", "write", "edit"],
  "failOpen": true,
  "irreversible": { "warn": 0.5, "confirm": 0.9 },
  "offTask": { "warn": 0.6 },
  "intentMismatch": 0.9,
  "visibleMismatch": 0.8,
  "shouldProceed": { "threshold": 0.6 },
  "ask": { "enabled": true },
  "traceSample": 0.05,
  "feedbackLog": true,
  "floor": "evidence",
  "commandRules": [], "commandDenyRules": [], "exemptRules": [], "pathRules": [], "armingRules": []
}
```

Plus the session-wide keys that gate Jev, from the same table:

- `typesafe` — "Consent to send requests to TypeSafe. Set by `/warden enable`; only the user file or
  `PI_WARDEN_ENABLED=1` can grant it." Default `false`; this repo sets `true`.
- `typesafeBackend` — `"typesafe"` (default) → `https://api.typesafe.ai`, model `jev-latest`
  (`pi-typesafe/dist/backends.js:92`, sent as `~typesafe/jev-latest`). Alternatives: `openrouter`, `commandcode`,
  `liquid`, `subq`, `nace`, or an endpoint object that serves the same decisions protocol.
- `mode` — `steer` | `confirm` | `advise`, default `steer`, user file only (`PI_WARDEN_MODE` overrides).
- `timeoutMs` 5000 per request, `maxRequests` 500 per session (shared with compaction and the other guards).
- `judge.cooldownMs` 60000 / `judge.failuresBeforeCooldown` 3 — a failing backend goes quiet rather than costing a
  timeout per call.

Env vars that matter ([configuration.md § Environment](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/configuration.md)):
`PI_WARDEN_ENABLED=1` (headless consent), `PI_WARDEN_MODE`, `PI_WARDEN_HOST_PATHS` (dirs outside the project the agent
may write without the outside-project hold/warn), `PI_WARDEN_SCRATCH_PATHS` (roots where `rm -rf` warns instead of
holds), `PI_WARDEN_DB`, `PI_WARDEN_TRACE_DIR`, `PI_WARDEN_STEER_STATS`, `PI_WARDEN_INDEX_DIR`. The key itself is
`TYPESAFE_API_KEY` (default backend) or the `keyEnv` of an endpoint object.

### Is Jev a local model? No.

- Jev is **TypeSafe's hosted System One model** (`jev-latest`): "it returns calibrated probabilities to fixed questions
  in about a quarter of a second, for a fraction of a cent" ([guards.md:123](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/guards.md)).
  It is not an LLM prompt loop and there is nothing to download; there is no bundled weights file, no `ollama`/`mlx`
  integration, and no "local mode" in the source.
- Judgements leave the machine to `api.typesafe.ai` unless you point `typesafeBackend` at an **endpoint object that
  speaks the same protocol**: `{ label, host, path, keyEnv, defaultModel? }`, host must be `https:` except loopback
  (`http:` allowed only for localhost/127.0.0.0/8/[::1]) — `pi-typesafe/dist/backends.js:136`. The protocol is
  `POST <host>/v1/systemone` carrying Noul/Choice/Score questions (`pi-typesafe/dist/schema.js`,
  `dist/client.js:11`). The oMLX server in this repo's `localllm` block is OpenAI *chat completions* (`/v1`), not that
  protocol, so it cannot serve as a judge as-is. A truly local judge would need a System One-compatible gateway in
  front of a local model; pi-warden does not ship one.
- No local LLM server is needed for the Action guard itself — only for Jev-off ("pattern floor only") do you need
  nothing at all.

### What leaves the machine per judged call

[data-handling.md](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/data-handling.md), Action row:
latest prompt (1500 chars), task spine (≤1200), the agent's plan text for the call (500 redacted chars), tool name,
the command (2000 chars) or the file path (relative inside the project, `~`-shortened outside) + existence, up to a
1500-char head/middle/tail sample of a `write` body (or of content a bash heredoc/echo writes), the first three edit
pairs (400 chars each), `script_lines` when the command runs a script, and — on the first guarded call after your
reply — the commands/paths of up to six allowed calls from the previous turn. Calls the ask gate decides offline send
nothing; with `action.traceSample: 0` there is no second sampled request, so no earlier messages and no rules content
ride along. Redaction covers credential *shapes* only (`Authorization`, `TOKEN=`, `sk-`, `ghp_`, `AKIA`, JWTs, PEM,
URL passwords) — "it is not a path scrubber, so hostnames, IP addresses, and file paths travel as written."

Local residue even with `feedbackLog: false`: an owner-only SQLite DB `~/.pi/agent/pi-warden/holds.db` keeps redacted
hold context and judge data for both held and allowed calls (365/90-day retention); `feedbackLog` only controls the
JSONL file under `~/.pi/agent/pi-warden/holds/`. Both files already exist in this setup (`holds.db`, 74 KB WAL).

## 3. Ready-to-paste config

### (a) Action guard on, Jev OFF (offline pattern floor only)

Consent is global, so "Jev off" means consent off — and that silences every other judged guard, including the rules
guard this repo currently relies on (rule verdicts are Jev scores; with `judge === undefined` the rules guard produces
no verdict, `src/extension.ts:1986`, `3346`). There is no per-guard consent switch.

Changes in `dot_pi/agent/pi-warden/config.json.tmpl`:

```json
{
  "typesafe": false,
  "action": {
    "enabled": true,
    "tools": ["bash", "write", "edit"]
  }
}
```

That is the whole requirement. `failOpen`, `irreversible`, `floor` etc. are inert without a judge. Delete
`"tools": []`, or replace it — an empty list guards nothing.

### (b) Action guard on, Jev ON (recommended shape for this repo)

```json
{
  "typesafe": true,
  "typesafeBackend": "typesafe",
  "mode": "steer",
  "action": {
    "enabled": true,
    "tools": ["bash", "write", "edit"],
    "ask": { "enabled": true },
    "traceSample": 0,
    "feedbackLog": false
  }
}
```

Required vs optional:

- **Required:** `action.enabled: true`, a non-empty `action.tools`, and consent + a key for the backend
  (`typesafe: true` here already, plus `TYPESAFE_API_KEY` in pi's environment or `/typesafe login`).
- **Required if you want today's deliberate minimisation kept:** `ask.enabled: true` — the current template has
  `false`, which means *every* guarded call is sent to Jev, including every `write`/`edit`, roughly double the requests
  of the default. `traceSample: 0` (keep 0: no second sampled request, no earlier messages leaving the machine),
  `feedbackLog: false` (keep false: no `holds/` JSONL; `holds.db` is written either way).
- **Optional tuning:** `irreversible.warn`/`confirm` (0.5/0.9), `intentMismatch` 0.9, `visibleMismatch` 0.8,
  `floor: "level"` if you want patterns to hold regardless of the judge, `exemptRules` (e.g.
  `["warden-config-write"]`), `commandRules` to re-tighten something Jev lets through (e.g. `npm publish` at
  `confirm`), `timeoutMs`, `maxRequests`.

In `dot_pi/agent/settings.json`: **no change needed**. The only optional edit is removing
`"toolset-state:tbox.tool@npm:pi-warden": { "enabled": false }` from `toolsetDefaults` if you also want warden's agent
tools (`warden_recall`, `warden_loops`, `warden_remember`) available; the action guard does not need them.

## 4. Surprises and risks

- **`"tools": []` is a silent no-op.** The single most likely way to "enable" this and see nothing happen.
- **Jev on weakens the offline floor** (evidence mode, §1). Add `commandRules` with `severity: "confirm"` for anything
  you want held regardless (the docs' own example is `npm publish`).
- **Jev off disables more than the action guard** — the rules guard too, since consent is global. Today's config has
  `rules.enabled: true` and `typesafe: true`; flipping consent off to get a Jev-free action guard would quietly stop
  the rules judging as well.
- **`warden-config-write` holds unconditionally, even in evidence mode.** A `write`/`edit` tool call (or a `bash`
  redirect/`cp`/`sed -i`/`tee`) targeting `~/.pi/agent/pi-warden/config.json` or anything else under
  `<agent dir>/pi-warden/` is held (`src/extension.ts:2058-2071`, `src/guard.ts:2120-2137`). Practical effect in this
  repo: edit `dot_pi/agent/pi-warden/config.json.tmpl` and run `chezmoi apply` — `chezmoi apply` is not one of the
  write shapes the reader parses (redirect, `tee`, `cp`/`mv`/`ln`/`install`/`rsync`, `sed -i`, `dd of=`, `truncate`,
  `touch`, `curl -o`, `git apply`/patch, a script read one level deep), so it is not held.
- **Dotfiles work touches `$HOME`.** `bash` writes outside the project (`echo >> ~/.zshrc`, `sed -i` on a home file)
  warn, and with a judge present are decided by it; `write`/`edit` on an existing file outside the project can hold.
  `PI_WARDEN_HOST_PATHS=$HOME` exempts the outside-project rule (nothing else) if that noise is unwelcome — but it also
  exempts genuinely dangerous home writes from that one check.
- **Latency:** one request before the tool call, ~250 ms claimed, `timeoutMs` 5000, `failOpen: true` (a failed request
  allows the call with a warning). The ask gate halves request count; a held call in `steer` mode costs the agent a
  full re-plan turn. Judged calls run before the tool, so a slow/unreachable backend adds latency until the cooldown
  trips after 3 failures (60 s quiet).
- **Cost:** `pi-typesafe` prices TypeSafe at `DEFAULT_USD_PER_MTOK = 0.042` (`dist/usage.js:8`) → a ~1.3k-token acting
  request is ~$0.00006. The real limit is `maxRequests: 500` per session, shared with the rules guard and compaction;
  with `ask.enabled: false` a long session can exhaust it.
- **No restart of pi is needed for the package, but the config is read once per session**
  ([configuration.md:219-221](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/configuration.md)):
  after `chezmoi apply`, start a new session (`/new`, `/resume`, `/fork`, reload). A mid-session edit shows a notice and
  applies next session.
- **Minimum pi:** peer dependency `@earendil-works/pi-coding-agent >=0.85.1 <2` (`package.json:75-78`); this repo runs
  1.5.0.
- **`codemode` is not in `action.tools`,** so a script's own text is never inspected — but pi emits `tool_call` for
  nested calls (`dist/core/agent-session.js:337-358` sets `parentToolCallId` for "calls another tool made") and
  pi-warden does not filter on it (no `parentToolCallId` in `src/`), so the inner `tools.bash(...)`/`write` calls are
  judged normally. Since this user's `defaultTools` and AGENTS.md favour `codemode`, that is the behaviour you want;
  worth re-checking after a pi upgrade.
- **`toolsetDefaults` interaction: none.** `toolset-state:tbox.tool@npm:pi-warden` is pi-tbox's persist key for a
  toolset built from a package source (`pi-tbox/src/registry.ts:83-85`); it gates tools, not extension hooks.
- **Project trust:** `defaultProjectTrust: "always"` in settings.json means a repo's `.pi/pi-warden.json` is applied, but
  project files can only make the action guard *stricter*, never weaker, and cannot set `floor`, `exemptRules`,
  `commandRules`, `mode`, or consent ([configuration.md:235-243](https://raw.githubusercontent.com/DevMortimer/pi-warden/main/docs/configuration.md)).

## 5. What I'd actually do in this repo

1. Edit `dot_pi/agent/pi-warden/config.json.tmpl`: flip `action.enabled` to `true`, replace `"tools": []` with
   `["bash", "write", "edit"]`, and flip `action.ask.enabled` to `true`. Leave `traceSample: 0` and
   `feedbackLog: false` as they are. Keep `typesafe: true` (Jev on) — the repo already pays for the rules guard, and a
   Jev-off action guard would take the rules guard down with it.
2. Keep `action` where it is (right after `typesafeBackend`, before `rules`). Key order in the JSON is cosmetic; the
   template renders the whole object and pi-warden reads parsed JSON.
3. Do **not** add anything to `dot_pi/agent/settings.json`. Do not re-enable the tbox toolset unless you want the
   `warden_*` tools.
4. Optionally add one `commandRules` entry for whatever you want held even when the task asks for it (e.g.
   `npm publish`, `git push --force`), since evidence mode downgrades those to warns.
5. Commit it: it is user config, carries no secret (the key is `TYPESAFE_API_KEY` in the unmanaged
   `~/.secrets/systemone.env`), and `chezmoi apply` is not caught by the warden's own config-write hold. Then start a
   fresh pi session and check `/warden status` — it prints `guarding bash, write, edit (…actions…)`, the mode, and
   whether TypeSafe judgments are consented, and `/warden trace` shows per-call `jev: irreversible nn%` lines.
