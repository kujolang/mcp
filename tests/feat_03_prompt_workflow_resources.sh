#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

cleanup() {
	kill "$SERVER_PID" >/dev/null 2>&1 || true
	wait "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_feat03_server.log 2>&1 &
SERVER_PID=$!

curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null

resources_list=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/list -H 'Content-Type: application/json' -d '{}')
prompt_read=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/read -H 'Content-Type: application/json' -d '{"params":{"uri":"prompt://onboarding"}}')
workflow_read=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/read -H 'Content-Type: application/json' -d '{"params":{"uri":"workflow://checklist-loop"}}')

echo "$resources_list" | grep -q 'prompt://onboarding'
echo "$resources_list" | grep -q 'workflow://checklist-loop'
echo "$prompt_read" | grep -q 'MCP Onboarding Prompt'
echo "$workflow_read" | grep -q 'Checklist Loop Workflow'

echo "feat_03_prompt_workflow_resources: all checks passed"
