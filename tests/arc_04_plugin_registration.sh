#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

test -f src/tools/registry.kujo
test -f src/resources/registry.kujo

grep -q 'from src.tools.registry import register_all_tools' src/server/runtime.kujo
grep -q 'from src.resources.registry import register_all_resources' src/server/runtime.kujo

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_arc04_server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true; wait "$SERVER_PID" >/dev/null 2>&1 || true' EXIT

health_resp=$(curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health)
tools_list_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/list -H 'Content-Type: application/json' -d '{}')
resources_list_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/list -H 'Content-Type: application/json' -d '{}')

echo "$health_resp" | grep -q '"status":"ok"'
echo "$tools_list_resp" | grep -q '"read_project_docs"'
echo "$tools_list_resp" | grep -q '"search_files"'
echo "$tools_list_resp" | grep -q '"generate_summary"'
echo "$tools_list_resp" | grep -q '"write_safe_patch"'
echo "$resources_list_resp" | grep -q '"project://docs"'
echo "$resources_list_resp" | grep -q '"files://tree"'
echo "$resources_list_resp" | grep -q '"log://calls"'

echo "arc_04_plugin_registration: all checks passed"