#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

mkdir -p demo/patches/feat_02/sub
cat > demo/patches/feat_02/root_notes.kujo <<'EOF'
alpha file
EOF
cat > demo/patches/feat_02/sub/nested.txt <<'EOF'
needle content
alpha second
EOF

cleanup() {
	kill "$SERVER_PID" >/dev/null 2>&1 || true
	wait "$SERVER_PID" >/dev/null 2>&1 || true
	rm -rf demo/patches/feat_02
}
trap cleanup EXIT

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_feat02_server.log 2>&1 &
SERVER_PID=$!

curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null

filename_non_recursive=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"nested","directory":"patches/feat_02","mode":"filename","recursive":false,"max_results":10,"timeout_ms":2000}}}')
filename_recursive=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"nested","directory":"patches/feat_02","mode":"filename","recursive":true,"max_results":10,"timeout_ms":2000}}}')
content_recursive=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"needle","directory":"patches/feat_02","mode":"content","recursive":true,"max_results":10,"timeout_ms":2000}}}')
limit_check=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"alpha","directory":"patches/feat_02","mode":"content","recursive":true,"max_results":1,"timeout_ms":2000}}}')
timeout_check=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"alpha","directory":"patches/feat_02","mode":"content","recursive":true,"max_results":10,"timeout_ms":1}}}')
invalid_mode=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"alpha","directory":"patches/feat_02","mode":"bad-mode","recursive":true}}}')

echo "$filename_non_recursive" | grep -q '"total_matches":0'
echo "$filename_recursive" | grep -q 'nested.txt'
echo "$content_recursive" | grep -q 'needle content'
echo "$limit_check" | grep -q '"total_matches":1'
echo "$timeout_check" | grep -q '"error"'
echo "$timeout_check" | grep -q 'timeout'
echo "$invalid_mode" | grep -q '"error"'

echo "feat_02_search_semantics: all checks passed"
