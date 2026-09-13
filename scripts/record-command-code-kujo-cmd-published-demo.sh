#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_SPEC="${KUJO_CMD_PACKAGE_SPEC:-@kujolang/kujo-cmd@0.1.0}"
COMMAND_CODE_BIN="${COMMAND_CODE_BIN:-$(command -v cmd-ollama)}"
COMMAND_CODE_OLLAMA_MODEL="${COMMAND_CODE_OLLAMA_MODEL:-ollama/glm-5.3:cloud}"
OUTPUT_PATH="${1:-$ROOT_DIR/demos/command-code-ollama-live-proof/assets/command-code-live.cast}"
MEDIA_OUTPUT="${OUTPUT_PATH%.cast}.mp4"
FINAL_FRAME_OUTPUT="${OUTPUT_PATH%.cast}-final.png"
DEMO_DIR="$(mktemp -d /tmp/kujo-cmd-published-live.XXXXXX)"

cleanup() {
  case "$DEMO_DIR" in
    /tmp/kujo-cmd-published-live.*) rm -rf -- "$DEMO_DIR" ;;
  esac
}
trap cleanup EXIT INT TERM

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

mkdir -p "$DEMO_DIR/project" "$DEMO_DIR/home" "$(dirname "$OUTPUT_PATH")"

env KUJO_CMD_HOME="$DEMO_DIR/home" \
  npx --yes "$PACKAGE_SPEC" setup \
    --project "$DEMO_DIR/project" \
    --profile kujo.profile.essentials \
    --json >"$DEMO_DIR/setup.json"

env KUJO_CMD_HOME="$DEMO_DIR/home" \
  npx --yes "$PACKAGE_SPEC" doctor \
    --project "$DEMO_DIR/project" \
    --json >"$DEMO_DIR/doctor.json"

jq -e '.ok and .hosted_service_required == false and .abilities == 5' "$DEMO_DIR/setup.json" >/dev/null
jq -e '.ok' "$DEMO_DIR/doctor.json" >/dev/null

COMMAND_CODE_DEMO_PROMPT='Use the Kujo Ability catalog MCP tool exactly once. Then describe what we just installed from npm: @kujolang/kujo-cmd 0.1.0 gives Command Code a local STDIO connection to portable Kujo Abilities and canonical Agent Skills, with profiles controlling exposure rather than installation. Include the exact MCP tool name, Ability ID, active profile, visible Ability count, policy decision, invocation ID, receipt ID, and result status returned by the call. Use seven concise bullets, then end with the exact line: KUJO CMD 0.1.0: VERIFIED'

(
  cd "$DEMO_DIR/project"
  env \
    CMD_LOCAL_ONLY=1 \
    COMMAND_CODE_API_KEY=local-only-placeholder \
    KUJO_CMD_HOME="$DEMO_DIR/home" \
    COMMAND_CODE_BIN="$COMMAND_CODE_BIN" \
    COMMAND_CODE_OLLAMA_MODEL="$COMMAND_CODE_OLLAMA_MODEL" \
    COMMAND_CODE_DEMO_PROMPT="$COMMAND_CODE_DEMO_PROMPT" \
    asciinema rec \
      --quiet \
      --headless \
      --overwrite \
      --window-size 122x35 \
      --idle-time-limit 2 \
      --title "Command Code + Kujo CMD 0.1.0 + Ollama GLM 5.3" \
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
