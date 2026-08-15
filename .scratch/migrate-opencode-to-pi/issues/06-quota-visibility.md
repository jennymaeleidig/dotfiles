# 06 — Quota visibility for opencode-go and neuralwatt

**What to build:** `pi-quotas` surfaces spend for the opencode-go and neuralwatt providers, so the machine owner can watch spend the way they did in opencode. From a user's perspective: quota is visible in pi for both providers without leaving the tool.

**Blocked by:** 01 — Declare and materialize the sixteen pi packages.

**Status:** ready-for-human

- [x] Quota is visible in pi for the opencode-go provider.
- [x] Quota is visible in pi for the neuralwatt provider.
- [x] The provider configuration the quota reads is owned by the machine owner (self-serve), not hardcoded by this migration.

## Comments

Implemented on top of 01's package declaration — both quota mechanisms are
self-configuring once the packages are declared, so no Source-state config
change was needed (adding one would violate the self-serve constraint).

- **opencode-go** — `@latentminds/pi-quotas` exposes `/quotas` and
  `/opencode-go:quotas`. Verified with pi-quotas' own code (bun against
  `src/providers/opencode-go-config.ts` + `opencode-go.ts`): config resolves
  from the machine owner's existing `~/.config/opencode/opencode-quota/opencode-go.json`
  (`workspaceId` + `authCookie`) and the dashboard query succeeds, returning
  rolling (0% used), weekly (0%), and monthly (100%, resets ~13 min) windows.
- **neuralwatt** — `@aliou/pi-neuralwatt` exposes `/neuralwatt:quota` (enabled
  by default; `quotaCommand.enabled: true`). It reads the API key from
  `~/.pi/agent/auth.json` (`{"neuralwatt": {"type": "api_key", "key": ...}}`)
  or `NEURALWATT_API_KEY`. That credential is not yet configured (auth.json is
  empty), so the command warns until the machine owner adds it — the expected
  self-serve step.
- **Self-serve** — no provider config or credentials were added to Source
  state; the decision is recorded in `docs/adr/0005-quota-providers-are-machine-owner-owned.md`.
  Note for the opencode-removal issue: pi-quotas' opencode-go credential file
  lives under `~/.config/opencode/opencode-quota/`; once opencode is removed,
  the env-var path (`OPENCODE_GO_WORKSPACE_ID` + `OPENCODE_GO_AUTH_COOKIE`) is
  the durable self-serve route.
