#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_DIR="$(cd "$ROOT_DIR/.." && pwd)"
CMS_DIR="$WORKSPACE_DIR/cms"
KUJO_BIN="$($ROOT_DIR/scripts/find_kujo_runtime.sh)"
COMMAND_CODE_BIN="${COMMAND_CODE_BIN:-$(command -v cmd-ollama)}"
COMMAND_CODE_OLLAMA_MODEL="${COMMAND_CODE_OLLAMA_MODEL:-ollama/glm-5.3:cloud}"
OUTPUT_PATH="${1:-$ROOT_DIR/demos/command-code-ollama-live-proof/assets/command-code-live.cast}"
MEDIA_OUTPUT="${OUTPUT_PATH%.cast}.mp4"
FINAL_FRAME_OUTPUT="${OUTPUT_PATH%.cast}-final.png"
DEMO_DIR="$(mktemp -d /tmp/kujo-command-code-live.XXXXXX)"
CMS_TOKEN="$(openssl rand -hex 32)"
CMS_PID=""

cleanup() {
  if [[ -n "$CMS_PID" ]]; then
    kill "$CMS_PID" 2>/dev/null || true
    wait "$CMS_PID" 2>/dev/null || true
  fi
  case "$DEMO_DIR" in
    /tmp/kujo-command-code-live.*) rm -rf -- "$DEMO_DIR" ;;
  esac
}
trap cleanup EXIT INT TERM

if [[ ! -d "$CMS_DIR" ]]; then
  echo "CMS repository not found at $CMS_DIR" >&2
  exit 1
fi
if ! ollama list | awk '{print $1}' | grep -Fxq "glm-5.3:cloud"; then
  echo "glm-5.3:cloud is unavailable; run: ollama pull glm-5.3:cloud" >&2
  exit 1
fi
for dependency in asciinema agg ffmpeg; do
  if ! command -v "$dependency" >/dev/null; then
    echo "$dependency is required to record the live demo" >&2
    exit 1
  fi
done

mkdir -p "$(dirname "$OUTPUT_PATH")"

(
  cd "$CMS_DIR"
  env \
    CMS_API_HOST=127.0.0.1 \
    CMS_API_PORT=4200 \
    CMS_SITE_URL=http://127.0.0.1:4200 \
    CMS_API_TOKEN="$CMS_TOKEN" \
    CMS_DB_PATH="$DEMO_DIR/cms.db" \
    CMS_EXTENSION_INBOX_DIR="$DEMO_DIR/extensions/inbox" \
    CMS_EXTENSION_STORE_DIR="$DEMO_DIR/extensions/installed" \
    CMS_MEDIA_INBOX_DIR="$DEMO_DIR/media/inbox" \
    CMS_MEDIA_STORE_DIR="$DEMO_DIR/media/files" \
    "$KUJO_BIN" run --interpreter backend/runtime/main.kujo \
      >"$DEMO_DIR/cms.log" 2>&1
) &
CMS_PID=$!

for _ in $(seq 1 80); do
  if curl -fsS http://127.0.0.1:4200/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done
curl -fsS http://127.0.0.1:4200/health >/dev/null

env \
  KUJO_ABILITY_GATEWAY_TOKEN="$CMS_TOKEN" \
  node "$ROOT_DIR/integrations/kujo-ability/bin/kujo-ability.mjs" connect \
    --host command-code \
    --gateway http://127.0.0.1:4200 \
    --output "$DEMO_DIR/.mcp.json" >/dev/null

COMMAND_CODE_DEMO_PROMPT='Use the Kujo CMS site information MCP Ability exactly once. Then describe what we just built from inside Command Code: this host is using Ollama Cloud with GLM 5.3, Kujo capabilities are discovered dynamically through standard MCP and the Ability Gateway, and no Command Code-specific adapter owns Kujo business logic. Include the exact MCP tool name, Ability ID, policy decision, invocation ID, receipt ID, and result status returned by the call. Use six concise bullets, then end with the exact line: KUJO PORTABILITY: VERIFIED'

(
  cd "$DEMO_DIR"
  env \
    CMD_LOCAL_ONLY=1 \
    COMMAND_CODE_API_KEY=local-only-placeholder \
    KUJO_ABILITY_GATEWAY_URL=http://127.0.0.1:4200 \
    KUJO_ABILITY_GATEWAY_TOKEN="$CMS_TOKEN" \
    COMMAND_CODE_BIN="$COMMAND_CODE_BIN" \
    COMMAND_CODE_OLLAMA_MODEL="$COMMAND_CODE_OLLAMA_MODEL" \
    COMMAND_CODE_DEMO_PROMPT="$COMMAND_CODE_DEMO_PROMPT" \
    asciinema rec \
      --quiet \
      --headless \
      --overwrite \
      --window-size 122x35 \
      --idle-time-limit 2 \
      --title "Command Code + Ollama GLM 5.3 + Kujo Ability" \
      --command "$ROOT_DIR/scripts/record-command-code-ollama-live-demo.exp" \
      "$OUTPUT_PATH"
)

agg \
  --quiet \
  --no-loop \
  --theme github-dark \
  --font-dir "$ROOT_DIR/demos/command-code-ollama-live-proof/assets" \
  --font-family "Departure Mono,Menlo,monospace" \
  --font-size 18 \
  --line-height 1.32 \
  --speed 1.35 \
  --idle-time-limit 1 \
  --fps-cap 20 \
  --last-frame-duration 4 \
  "$OUTPUT_PATH" "$DEMO_DIR/command-code-live.gif"

ffmpeg -y \
  -i "$DEMO_DIR/command-code-live.gif" \
  -vf 'fps=30,pad=ceil(iw/2)*2:ceil(ih/2)*2' \
  -r 30 \
  -g 30 \
  -keyint_min 30 \
  -sc_threshold 0 \
  -movflags +faststart \
  -pix_fmt yuv420p \
  -c:v libx264 \
  -crf 18 \
  "$MEDIA_OUTPUT" \
  >/dev/null 2>&1

MEDIA_DURATION="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$MEDIA_OUTPUT")"
FINAL_FRAME_AT="$(awk -v duration="$MEDIA_DURATION" 'BEGIN { at = duration - 1.0; if (at < 0) at = 0; printf "%.3f", at }')"
ffmpeg -y \
  -ss "$FINAL_FRAME_AT" \
  -i "$MEDIA_OUTPUT" \
  -frames:v 1 \
  "$FINAL_FRAME_OUTPUT" \
  >/dev/null 2>&1

printf '%s\n%s\n%s\n' "$OUTPUT_PATH" "$MEDIA_OUTPUT" "$FINAL_FRAME_OUTPUT"
