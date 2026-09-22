# Local coding agent: gpt-oss-20b on llama.cpp

Host-owner material for the local-only coding model: a 20B GGUF served by a
pinned `llama-server`, wired into pi's built-in `llama.cpp` provider, verified
by one gate script. Nothing here runs on Apply and nothing starts at login —
the server is up when you start it, and not otherwise.

Everything that names a build or a model lives in `pins.json`, and this
document reads it rather than repeating it, so a pin bump is a one-line diff:

```bash
cd <dotfiles checkout>
eval "$(python3 tools/local-llm/pins.py)"
echo "$LLAMA_CPP_RELEASE $LLAMA_CPP_COMMIT"
echo "$MODEL_REPO@$MODEL_REVISION $MODEL_FILE ($MODEL_BYTES bytes)"
```

Run that `eval` once per shell. Every command below assumes those variables,
which is why no path, port or window appears twice in this document.

The llama.cpp release is an upstream prerelease; it is pinned because it is the
build whose flags were verified against the notes below.

## 1. Memory: read the wired limit before changing anything

The Metal wired limit on a 24 GB machine defaults to roughly **18,186 MiB**
(`iogpu.wired_limit_mb` is in MiB and sets Metal's
`recommendedMaxWorkingSetSize`).

```bash
sysctl iogpu.wired_limit_mb
```

The model weights plus a KV cache of roughly 0.8 GiB at the pinned
`$CONTEXT_WINDOW`-token window with q8_0 KV fit comfortably under **15 GiB**.
Do not lower this value. A value of
`14336` (14 GiB, about 15.03 GB) *lowers* the limit below the default by
~3.8 GiB and is exactly the kind of change a handoff like this gets inverted.

- If the printed value is **at or above 15360**, stop here. There is nothing to
  do.
- If it is below 15360, raise it to a value **above the observed default** —
  16384 is a reasonable target. `/etc/sysctl.conf` does *not* persist this key
  (boot-order race); the working mechanism is a LaunchDaemon that calls
  `sysctl -w` at load. Install it as root, then read the value back to confirm
  it took — the plist fires once per boot and retries nothing:

  ```bash
  sudo tee /Library/LaunchDaemons/local.iogpu-wired-limit.plist >/dev/null <<'PLIST'
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0">
  <dict>
    <key>Label</key><string>local.iogpu-wired-limit</string>
    <key>ProgramArguments</key>
    <array>
      <string>/usr/sbin/sysctl</string>
      <string>-w</string>
      <string>iogpu.wired_limit_mb=16384</string>
    </array>
    <key>RunAtLoad</key><true/>
  </dict>
  </plist>
  PLIST
  sudo launchctl bootstrap system /Library/LaunchDaemons/local.iogpu-wired-limit.plist
  sysctl iogpu.wired_limit_mb   # confirm the read-back
  ```

## 2. Install the pinned runtime

```bash
mkdir -p "$HOME/$RUNTIME_ROOT"
cd "$HOME/$RUNTIME_ROOT"
curl -fL --retry 3 -O "$LLAMA_CPP_ASSET_URL"
echo "$LLAMA_CPP_ASSET_SHA256  $(basename "$LLAMA_CPP_ASSET_URL")" | shasum -a 256 -c -
tar -xzf "$(basename "$LLAMA_CPP_ASSET_URL")"
ls -d "$HOME/$RUNTIME_DIR"                         # the archive's only top-level directory
find "$HOME/$RUNTIME_DIR" -name llama-server -type f
```

The archive unpacks to a single top-level directory, `llama-<release>`, and
`pins.py` derives `$RUNTIME_DIR` from the release rather than from a second
pin — so extracting into `$RUNTIME_ROOT` lands the build exactly where
`serve.sh` looks for it, and a release bump needs no second edit. A future
archive that changes that layout is a fix to this section in the same pin bump.

No package manager and no Ollama: `llama-server` is a single pinned executable
tree under `$HOME/local-llm/runtime/`, so there is no second version to
resolve.

**Verify the build's flags before trusting this document.** The flag notes
here are pinned to that build:

```bash
LLAMA_SERVER="$(find "$HOME/$RUNTIME_DIR" -name llama-server -type f | head -n 1)"
LLAMA_HELP="$(mktemp)"
"$LLAMA_SERVER" --help > "$LLAMA_HELP"
grep -nE -- '--jinja|--models-dir|--models-max|--no-models-autoload|--cache-ram|--cache-type-k|--cache-type-v|--flash-attn|--parallel|--ctx-size|--n-gpu-layers|--reasoning' "$LLAMA_HELP"
```

Every flag named in `serve.sh` must appear, with the meaning this document
gives it. If a flag is missing or renamed, that is a **pin bump**, not a
workaround: edit `pins.json`, re-run the download, re-read this section, and
re-run the gate.

## 3. Download the model

The URL is pinned by revision, so `main` moving cannot change what you get.
`-C -` resumes a partial download.

```bash
eval "$(python3 tools/local-llm/pins.py)"
mkdir -p "$HOME/$MODELS_DIR"
cd "$HOME/$MODELS_DIR"
curl -fL -C - --retry 3 -o "$MODEL_FILE" \
  "https://huggingface.co/$MODEL_REPO/resolve/$MODEL_REVISION/$MODEL_FILE"
echo "$MODEL_SHA256  $MODEL_FILE" | shasum -a 256 -c -
stat -f '%z' "$MODEL_FILE"   # must equal $MODEL_BYTES
```

The models directory must hold exactly one GGUF; `serve.sh` refuses to start
otherwise. A second file there would let the router load something other than
what the pins describe.

## 4. Apply the harness configuration

Source-side work is done in the repo; applying is yours:

```bash
chezmoi apply
```

This lands `~/.pi/agent/models.json` and the `LLAMA_BASE_URL` export in your
shell dotfile. The export is rendered from `pins.json` (`server.host` and
`server.port`), so the pins file is still the only place the address is named.
The `models.json` override is a plain file that repeats `model.id` and
`server.contextWindow` by hand. Applying does **not** start the server.

It also lands `~/.pi/agent/settings.json`, a plain file that names this model
twice:

- `enabledModels` — so the model is in pi's list at startup;
- `modelThinkingLevels["llama.cpp/<model.id>"] = "high"` — so **high reasoning
  is this model's default** without touching `defaultThinkingLevel`, which is
  set for the other providers and stays where it is.

That last one is the difference between permitting reasoning and asking for it.
The `models.json` override makes a level *reachable*; the settings entry is what
actually requests one. With both in place pi sends `reasoning_effort: "high"`
verbatim on every request for this model (there is no `thinkingLevelMap`, so
nothing remaps the level), which is exactly what the gate's reasoning check
measures end to end.

Pi rewrites `settings.json` when you press Ctrl+S in `/model` or `/thinking`, so
a level changed there is host-local and a later `chezmoi apply` reverts it. Edit
the file and re-apply to change it for real.

## 5. Start the server

```bash
cd <dotfiles checkout>
bash tools/local-llm/serve.sh
```

If your shell has sourced `~/.bash_exports`, `llm-serve` does the same thing
from any directory (it resolves the checkout at apply time, so nothing is
hardcoded here). Either way it runs in the foreground: Ctrl-C is the stop.

Round-trip check in another shell:

```bash
curl -fsS "http://$SERVER_HOST:$SERVER_PORT/health"
curl -fsS "http://$SERVER_HOST:$SERVER_PORT/v1/models" | python3 -m json.tool | head
```

When the model loads, llama.cpp prints its own residency line (`offloaded N/N
layers to GPU`). That line and the gate's flag check in step 7 are the two
places offload is visible at all — see the note there.

## 6. Load the model and select it in pi

The server runs in **router mode**: it holds the catalog but loads nothing
until asked, so the memory cost of a load is a decision you make, not a side
effect of startup. In pi:

```
/llama      # pick the pinned model — loads it, or shows why it cannot
/model      # select it; only loaded models are listed
```

`--models-max 1` means a second load fails loudly instead of quietly doubling
resident memory.

## 7. Run the gate

```bash
bash tools/local-llm/gate.sh
```

Or `llm-gate` from the exports file, which is the same script from anywhere.

This is the one verification seam. It is read-only against the server (GETs
plus stateless completions; it never loads, unloads, or reconfigures), so it is
safe to re-run at any time, including immediately after a pin bump. It fails
loudly, naming the boundary that failed, and exits non-zero. It asserts:

1. the server is reachable — and if it is not, it says "server not running"
   rather than printing a connection trace;
2. the server is in llama.cpp router mode;
3. exactly one model is loaded, and it is the pinned one;
4. the context window the harness believes in equals the window the server
   allocated, and the harness config still permits reasoning;
5. the harness is pointed at this server — provider visibility is asserted from
   the declaration rather than assumed, so a provider that would never appear
   in pi's model list fails here and not later;
6. the harness actually asks for a reasoning level for this model, and it is not
   `off` — so a later settings edit cannot leave it sitting at the global
   `defaultThinkingLevel` set for the other providers;
7. the pinned launch flags in `serve.sh` are intact: offload, window, slots and
   the Harmony template;
8. a tool spec produces a structured `tool_calls` entry — prose describing the
   call is a failure, which is the Harmony-template regression it exists to
   catch;
9. reasoning effort changes the response in the expected direction, end to end
   from the config to the server: one request at high effort, one with
   `reasoning_effort` omitted — the request the harness sends when thinking is
   off.

Two of those are not HTTP, and the gate names them as such. Checks 1-4 and 8-9
are external behaviour, read-only against the server. Checks 5-6 read the
harness's own configuration (its declaration and its startup level). Check 7
reads `serve.sh`, because the pinned build exposes no GPU-offload field in any
of its endpoints — verified against the binary itself — so residency cannot be
asserted remotely, and asserting throughput would be a measurement, which this
gate does not do. Asserting the line that decides offload is the closest thing
to the spec's "configure it explicitly and check it" that stays honest.

## 8. Measure (never asserted)

```bash
bash tools/local-llm/gate.sh --measure
```

Or `llm-gate --measure`.

Prints wall-clock throughput at a short prompt and at roughly a 26K-token
prompt, the llama-server peak RSS during the long run, and the live
`iogpu.wired_limit_mb`. These are measurements, not pass/fail: a throughput
number is a fact about your machine today, not a contract. Record what you
see; do not turn it into a gate.

## 9. Rollback and pin bumps

Everything is pinned, so a rollback is a pin edit plus a re-download:

```bash
# edit pins.json back to the previous release/revision, then re-run steps 2 and 3
ls "$HOME/$RUNTIME_ROOT"                    # old and new release directories sit side by side
rm -rf "$HOME/$RUNTIME_ROOT/llama-<old-release>"
bash tools/local-llm/gate.sh
```

Keep the previous GGUF and runtime tree until the new pair passes the gate —
the model directory allows only one GGUF, so stage the old one outside it.

## 10. Why llama.cpp and not MLX

MLX is faster on paper on Apple silicon, and that is not the deciding factor.
The two things this setup cannot lose are **protocol correctness**: the model's
Harmony chat template has to be applied server-side, including the tool-call
parser that turns a generation into a structured `tool_calls` array, and the
`reasoning_effort` control has to reach the template. MLX's tool-call parsing
is not Harmony-shaped, and pi has first-class support only for the llama.cpp
server. A hand-rolled direct-endpoint provider could bridge that, at the cost
of owning the protocol parser — the exact thing the gate proves.

Revisit MLX only when **all** of these hold: it applies the gguf/Harmony chat
template server-side; it emits structured `tool_calls`; it accepts and forwards
`reasoning_effort`; pi can talk to it without a custom provider; and `gate.sh`
passes against it unchanged and read-only. Until then, a faster runtime that
quietly returns prose where a tool call belongs is a regression the gate exists
to catch.

## 11. Claims in the earlier handoff that this supersedes

These were wrong in the baseline document; they are recorded here so they are
not carried forward.

- **The sysctl value was inverted.** The handoff set `iogpu.wired_limit_mb` to
  `14336`, which *lowers* the ~18,186 MiB default by ~3.8 GiB. See step 1.
- **`/etc/sysctl.conf` does not persist this key.** It loses the boot-order
  race; the LaunchDaemon in step 1 is the mechanism that works.
- **`--batch-size 1024` was doing nothing.** It bounds the logical batch, not
  prefill compute; the prefill knob is `--ubatch-size` (default 512). It is
  dropped.
- **`--jinja` was called non-negotiable.** In the pinned build its default is
  already `enabled`; it is kept *explicit* here so the pinned setup does not
  rest on a build default, but the gate does not depend on it being either.
- **q8_0 KV was oversold as the memory fix.** It halves KV (about 418 MiB
  instead of 786 MiB at this window), but the lever that mattered was the
  window-sized SWA cache, not the cache type.
- **`--cache-ram 0` was described as a reservation.** It *disables* the
  host-RAM prompt cache (the flag's own wording for zero); it reserves nothing.
- **`--swa-full` was called stale.** It is simply unnecessary here; there is no
  bug to work around.
- **The tool vocabulary was wrong for pi 0.85.1.** Pi sends tools in a
  top-level `tools` array, never inside a message, and its built-ins are
  `read`, `bash`, `powershell`, `edit`, `write`, `grep`, `find`, `ls`.
  `apply_patch` is not a pi built-in.
- **`--reasoning-effort` was described as unavailable server-side.** It exists
  in the pinned build (help says default `default`). Leaving it unset is a
  deliberate choice so each request's own level is what the template sees —
  not a workaround for a missing flag.
- **"CPU fallback degrades tool calls silently" was not established**, and the
  26% SWE-bench figure belongs to the 120b entry, not this model. Neither
  claim is used in the reasoning above.

## 12. Flags: load-bearing vs redundant

Load-bearing in `serve.sh`:

- `--models-dir`, `--models-max 1`, `--no-models-autoload` — router mode with
  one loadable model and no load on startup.
- `--jinja` — explicit Harmony template, hence tool calls and
  `reasoning_effort`.
- `-ngl 99` — every layer on the GPU (the flag also accepts `all`); the
  weights fit. The gate asserts this flag is still present, because the build
  exposes no offload field over HTTP.
- `-c "$CONTEXT_WINDOW"` — the single declaration of the context window, read
  from pins; the harness entry must agree, and the gate asserts that it does.
- `--parallel 1` — one slot carrying that window.
- `--cache-type-k q8_0 --cache-type-v q8_0` — halves KV, ~370 MiB against the
  window-sized default; a real but modest saving.
- `-fa on`, `--cache-ram 0` — flash attention on, host prompt cache disabled
  (zero disables it; it reserves nothing).
- `--host "$SERVER_HOST"` — local only; no network exposure.

Deliberately absent:

- `--model` — router mode catalogues the directory instead.
- `--batch-size` — see §11.
- `--swa-full` — unnecessary.
- `--reasoning-effort` — the flag *exists* in this build (default `default`);
  it is left unset so each request's own level is what the template sees. The
  gate proves the level arrives.

Left at the build default, and load-bearing anyway:

- `--reasoning-format` — the default `auto` is what extracts the analysis
  channel into `message.reasoning_content`. The gate's reasoning check reads
  that field, so a release that changed this default fails the gate instead of
  passing silently.
