#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)

"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_sec03_server.log 2>&1 &
SERVER_PID=$!

cleanup() {
	kill "$SERVER_PID" >/dev/null 2>&1 || true
	wait "$SERVER_PID" >/dev/null 2>&1 || true
	rm -f demo/patches/sec_03_ok.kujo sec_03_escape.kujo
}
trap cleanup EXIT

curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null

read_bad=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_project_docs","arguments":{"file_name":"../../README"}}}')
read_good=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_project_docs","arguments":{"file_name":"README"}}}')

search_bad=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"README","directory":"../"}}}')
search_good=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"README","directory":"docs"}}}')

write_bad=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_safe_patch","arguments":{"file_path":"../sec_03_escape.kujo","content":"escape","description":"deny"}}}')
write_good=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_safe_patch","arguments":{"file_path":"patches/sec_03_ok.kujo","content":"ok","description":"allow"}}}')

echo "$read_bad" | grep -q '"error"'
echo "$read_good" | grep -q '"result"'

echo "$search_bad" | grep -q '"error"'
echo "$search_good" | grep -q '"result"'

echo "$write_bad" | grep -q '"error"'
echo "$write_good" | grep -q '"result"'

test ! -f sec_03_escape.kujo
test -f demo/patches/sec_03_ok.kujo

echo "sec_03_tool_path_sanitization: all checks passed"