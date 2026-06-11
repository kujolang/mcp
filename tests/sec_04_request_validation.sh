#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)

"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_sec04_server.log 2>&1 &
SERVER_PID=$!

cleanup() {
	kill "$SERVER_PID" >/dev/null 2>&1 || true
	wait "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null

tools_malformed=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{invalid')
tools_missing_params=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"foo":1}')
tools_bad_params_type=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":[]}')
tools_missing_name=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"arguments":{}}}')
tools_empty_name=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"   "}}')

resources_malformed=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/read -H 'Content-Type: application/json' -d '{invalid')
resources_missing_params=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/read -H 'Content-Type: application/json' -d '{"foo":1}')
resources_bad_params_type=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/read -H 'Content-Type: application/json' -d '{"params":[]}')
resources_missing_uri=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/read -H 'Content-Type: application/json' -d '{"params":{}}')

resources_valid=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/read -H 'Content-Type: application/json' -d '{"params":{"uri":"project://docs"}}')

echo "$tools_malformed" | grep -q '"code":-32600'
echo "$tools_missing_params" | grep -q '"message":"Missing params object"'
echo "$tools_bad_params_type" | grep -q '"message":"params must be an object"'
echo "$tools_missing_name" | grep -q '"message":"Missing params.name"'
echo "$tools_empty_name" | grep -q '"message":"params.name must be a non-empty string"'

echo "$resources_malformed" | grep -q '"code":-32600'
echo "$resources_missing_params" | grep -q '"message":"Missing params object"'
echo "$resources_bad_params_type" | grep -q '"message":"params must be an object"'
echo "$resources_missing_uri" | grep -q '"message":"Missing params.uri"'

echo "$resources_valid" | grep -q '"result"'

echo "sec_04_request_validation: all checks passed"