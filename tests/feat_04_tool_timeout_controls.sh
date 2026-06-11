#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

CONFIG_BACKUP="$(mktemp)"
cp mcp-server.json "$CONFIG_BACKUP"

mkdir -p demo/patches/feat_04/sub
cat > demo/patches/feat_04/sub/sample.txt <<'EOF'
alpha
beta
gamma
EOF

cleanup() {
	kill "$SERVER_PID" >/dev/null 2>&1 || true
	wait "$SERVER_PID" >/dev/null 2>&1 || true
	mv "$CONFIG_BACKUP" mcp-server.json
	rm -rf demo/patches/feat_04
}
trap cleanup EXIT

sed -E 's/"default_timeout_ms": [0-9]+/"default_timeout_ms": 1/' "$CONFIG_BACKUP" > mcp-server.json

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_feat04_server.log 2>&1 &
SERVER_PID=$!

curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null

search_timeout=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"alpha","directory":"patches/feat_04","mode":"content","recursive":true}}}')
search_override=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"alpha","directory":"patches/feat_04","mode":"content","recursive":true,"timeout_ms":100}}}')
grep_timeout=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"grep_text","arguments":{"query":"alpha","directory":"patches/feat_04","mode":"literal","max_results":5}}}')
grep_override=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"grep_text","arguments":{"query":"alpha","directory":"patches/feat_04","mode":"literal","max_results":5,"timeout_ms":100}}}')

echo "$search_timeout" | grep -q '"error"'
echo "$search_timeout" | grep -q 'timeout'
echo "$search_override" | grep -q '"result"'

echo "$grep_timeout" | grep -q '"error"'
echo "$grep_timeout" | grep -q 'timeout'
echo "$grep_override" | grep -q '"result"'

echo "feat_04_tool_timeout_controls: all checks passed"
