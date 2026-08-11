#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)

"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_sec07_server.log 2>&1 &
SERVER_PID=$!

cleanup() {
	kill "$SERVER_PID" >/dev/null 2>&1 || true
	wait "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null

read_missing=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_project_docs","arguments":{}}}')
search_missing=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"directory":"docs"}}}')
summary_missing=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"generate_summary","arguments":{}}}')
summary_bad_bool=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"generate_summary","arguments":{"files":["README.md"],"include_file_sizes":"yes"}}}')
write_patch_missing=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_safe_patch","arguments":{"file_path":"patches/sec_07.kujo"}}}')
range_missing=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_text_range","arguments":{"file_path":"docs/README.md","end_line":1}}}')
range_bad_type=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_text_range","arguments":{"file_path":"docs/README.md","start_line":"1","end_line":1}}}')
write_text_missing=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_text_safe","arguments":{"file_path":"patches/sec_07.txt"}}}')
grep_missing=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"grep_text","arguments":{}}}')
name_bad_type=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":123,"arguments":{}}}')
arguments_bad_type=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"list_tree_recursive","arguments":[]}}')
uri_bad_type=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/read -H 'Content-Type: application/json' -d '{"params":{"uri":123}}')

echo "$read_missing" | grep -q '"message":"file_name is required"'
echo "$search_missing" | grep -q '"message":"pattern is required"'
echo "$summary_missing" | grep -q '"message":"files is required"'
echo "$summary_bad_bool" | grep -q '"message":"include_file_sizes must be a boolean"'
echo "$write_patch_missing" | grep -q '"message":"content is required"'
echo "$range_missing" | grep -q '"message":"start_line is required"'
echo "$range_bad_type" | grep -q '"message":"start_line must be an integer"'
echo "$write_text_missing" | grep -q '"message":"content is required"'
echo "$grep_missing" | grep -q '"message":"query is required"'
echo "$name_bad_type" | grep -q '"message":"params.name must be a string"'
echo "$arguments_bad_type" | grep -q '"message":"params.arguments must be an object"'
echo "$uri_bad_type" | grep -q '"message":"params.uri must be a string"'

if echo "$read_missing" | grep -q 'Tool error:'; then
	echo "unexpected exception-style tool error for required argument validation"
	exit 1
fi

echo "sec_07_tool_argument_validation: all checks passed"
