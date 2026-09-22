#!/bin/bash
set -euo pipefail
#
# Serve the pinned gpt-oss-20b GGUF with the pinned llama.cpp build.
#
# This is host-owner material: run it yourself, in the foreground, when you want
# the model up. It is not an Apply effect and there is no login item — the
# server should not be running unless you asked for it.
#
#   bash tools/local-llm/serve.sh
#
# The build and the model file are named only in pins.json; this script derives
# every path and every identifier from it. In router mode llama-server is
# started *without* --model: it catalogues --models-dir and loads a model on
# demand (and only on demand — --no-models-autoload). --models-max 1 makes a
# second load a loud error rather than a silent second copy in memory, so the
# memory cost of a swap is visible before it happens.

DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
eval "$(python3 "$DIR/pins.py")"

MODELS_DIR="$HOME/$MODELS_DIR"
RUNTIME="$HOME/$RUNTIME_DIR"
BIN="$(find "$RUNTIME" -type f -name llama-server -perm -u+x 2>/dev/null | head -n 1)"

if [ -z "$BIN" ]; then
  echo "FAIL: llama-server ($LLAMA_CPP_RELEASE) not found under $RUNTIME" >&2
  echo "      Download and extract the pinned runtime first; see tools/local-llm/SETUP.md." >&2
  exit 1
fi

# One model loadable means exactly one model on disk: a second GGUF would let
# the router load a different model than the pins describe.
GGUFS="$(find "$MODELS_DIR" -maxdepth 1 -type f -name '*.gguf' 2>/dev/null || true)"
COUNT="$(printf '%s\n' "$GGUFS" | grep -c . || true)"
if [ "$COUNT" != "1" ]; then
  echo "FAIL: expected exactly 1 GGUF in $MODELS_DIR, found $COUNT" >&2
  echo "      The model directory is part of the pins; see tools/local-llm/SETUP.md." >&2
  exit 1
fi
if [ "$(basename "$GGUFS")" != "$MODEL_FILE" ]; then
  echo "FAIL: $MODELS_DIR holds $(basename "$GGUFS"), but pins.json names $MODEL_FILE" >&2
  exit 1
fi

ACTUAL_BYTES="$(stat -f '%z' "$GGUFS")"
if [ "$ACTUAL_BYTES" != "$MODEL_BYTES" ]; then
  echo "FAIL: $GGUFS is $ACTUAL_BYTES bytes, pins.json expects $MODEL_BYTES" >&2
  echo "      A truncated download is the usual cause; re-run the download in SETUP.md." >&2
  exit 1
fi

echo "==> llama.cpp $LLAMA_CPP_RELEASE"
echo "    binary  $BIN"
echo "    model   $MODELS_DIR/$MODEL_FILE ($MODEL_BYTES bytes)"
echo "    router   http://$SERVER_HOST:$SERVER_PORT  (-c $CONTEXT_WINDOW, --models-max 1)"
echo "    stop     Ctrl-C"

# Flag notes (see SETUP.md for the reasoning):
#   --jinja            explicit, not left to a build default; the Harmony
#                      template is what parses tool calls and reasoning_effort.
#   -ngl 99            all layers of this model on the GPU; "all" is also
#                      accepted. Offload is the one silent slowdown, so the
#                      gate asserts this flag is still here.
#   --cache-type-k/v   q8_0 halves KV cache; it is not the memory lever.
#   -c, --parallel 1   one slot, one window as declared.
#   --cache-ram 0      disables the host-RAM prompt cache (0 disables); it is
#                      not a reservation.
#   no --batch-size    it bounds the logical batch, not prefill compute.
#   no --swa-full      unnecessary: the window-sized SWA cache is the norm.
#   no --reasoning-effort  the flag exists (default "default"); it is left unset
#                      so each request's own level is what the template sees.
#   no --reasoning-format  the default "auto" is what puts thoughts in
#                      message.reasoning_content; the gate's reasoning check
#                      depends on it, so a change of default is caught there.
exec "$BIN" \
  --models-dir "$MODELS_DIR" \
  --models-max 1 \
  --no-models-autoload \
  --jinja \
  -ngl 99 \
  -c "$CONTEXT_WINDOW" \
  --parallel 1 \
  --cache-type-k q8_0 \
  --cache-type-v q8_0 \
  -fa on \
  --cache-ram 0 \
  --host "$SERVER_HOST" \
  --port "$SERVER_PORT"
