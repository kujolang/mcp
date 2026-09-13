#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_DIR="$(cd "$ROOT_DIR/.." && pwd)"
CMS_DIR="$WORKSPACE_DIR/cms"
KUJO_BIN="$($ROOT_DIR/scripts/find_kujo_runtime.sh)"
CMD_BIN="${COMMAND_CODE_BIN:-$(command -v cmd)}"
MODEL="${COMMAND_CODE_OLLAMA_MODEL:-ollama/glm-5.3:cloud}"
DEMO_DIR="$(mktemp -d /tmp/kujo-command-code-demo.XXXXXX)"
CMS_TOKEN="$(openssl rand -hex 32)"
CMS_PID=""

cleanup() {
  if [[ -n "$CMS_PID" ]]; then
    kill "$CMS_PID" 2>/dev/null || true
    wait "$CMS_PID" 2>/dev/null || true
  fi
  case "$DEMO_DIR" in
    /tmp/kujo-command-code-demo.*) rm -rf -- "$DEMO_DIR" ;;
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

(
  cd "$DEMO_DIR"
  env \
    CMD_LOCAL_ONLY=1 \
    COMMAND_CODE_API_KEY=local-only-placeholder \
    KUJO_ABILITY_GATEWAY_URL=http://127.0.0.1:4200 \
    KUJO_ABILITY_GATEWAY_TOKEN="$CMS_TOKEN" \
    "$CMD_BIN" -p \
      "Use the Kujo CMS site information MCP Ability exactly once. Report the service, CMS version, content type count, invocation ID, receipt ID, policy outcome, and status." \
      --model "$MODEL" \
      --no-session \
      --skip-onboarding \
      --output-format text \
      --yolo \
      --max-turns 5
)
