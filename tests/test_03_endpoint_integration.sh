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
"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_test03_server.log 2>&1 &
SERVER_PID=$!

health_resp=$(curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health)
tools_list_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/list -H 'Content-Type: application/json' -d '{}')
tools_call_ok_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_project_docs","arguments":{"file_name":"README"}}}')
tools_call_err_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"does_not_exist","arguments":{}}}')
resources_list_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/list -H 'Content-Type: application/json' -d '{}')
resources_read_ok_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/read -H 'Content-Type: application/json' -d '{"params":{"uri":"project://docs"}}')
resources_read_err_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/read -H 'Content-Type: application/json' -d '{"params":{"uri":"missing://resource"}}')
initialize_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":101,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"integration-test","version":"1.0.0"}}}')
ping_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":"ping-1","method":"ping"}')
standard_tools_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":102,"method":"tools/list","params":{}}')
standard_call_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":103,"method":"tools/call","params":{"name":"read_project_docs","arguments":{"file_name":"README"}}}')
standard_resources_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":104,"method":"resources/list","params":{}}')
standard_read_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":105,"method":"resources/read","params":{"uri":"project://docs"}}')
standard_prompts_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":106,"method":"prompts/list","params":{}}')
standard_prompt_get_resp=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":107,"method":"prompts/get","params":{"name":"onboarding"}}')
notification_status=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:8931/mcp/v1 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"notifications/initialized"}')

echo "$health_resp" | grep -q '"status":"ok"'
echo "$health_resp" | grep -q '"server":"mcp-demo"'
echo "$health_resp" | grep -q '"version":"1.3.0"'

echo "$tools_list_resp" | grep -q '"tools"'
echo "$tools_list_resp" | grep -q '"search_files"'

echo "$tools_call_ok_resp" | grep -q '"result"'
echo "$tools_call_ok_resp" | grep -q 'README.md'

echo "$tools_call_err_resp" | grep -q '"error"'
echo "$tools_call_err_resp" | grep -q 'Tool not found'

echo "$resources_list_resp" | grep -q '"resources"'
echo "$resources_list_resp" | grep -q '"project://docs"'

echo "$resources_read_ok_resp" | grep -q '"result"'
echo "$resources_read_ok_resp" | grep -q '"project://docs"'

echo "$resources_read_err_resp" | grep -q '"error"'
echo "$resources_read_err_resp" | grep -q 'Resource not found'

echo "$initialize_resp" | grep -q '"id":101'
echo "$initialize_resp" | grep -q '"protocolVersion":"2025-11-25"'
echo "$initialize_resp" | grep -q '"prompts"'
echo "$ping_resp" | grep -q '"id":"ping-1"'
echo "$standard_tools_resp" | grep -q '"inputSchema"'
echo "$standard_call_resp" | grep -q '"structuredContent"'
echo "$standard_resources_resp" | grep -q '"mimeType"'
echo "$standard_read_resp" | grep -q '"contents"'
echo "$standard_prompts_resp" | grep -q '"onboarding"'
echo "$standard_prompt_get_resp" | grep -q '"messages"'
[[ "$notification_status" == "202" ]]

echo "test_03_endpoint_integration: all checks passed"
