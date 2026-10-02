#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"
CONFIG_BACKUP="$(mktemp)"

cd "$ROOT_DIR"
export KUJO_BIN
cp mcp-server.json "$CONFIG_BACKUP"

node - <<'NODE'
const fs = require('fs');
const path = 'mcp-server.json';
const config = JSON.parse(fs.readFileSync(path, 'utf8'));
config.tools.tree_cache_enabled = true;
config.tools.scan_max_entries = 100;
fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
NODE

mkdir -p demo/patches/feat_02/sub
cat > demo/patches/feat_02/root_notes.kujo <<'EOF'
alpha file
EOF
cat > demo/patches/feat_02/sub/nested.txt <<'EOF'
needle content
alpha second
EOF
ln -s ../root_notes.kujo demo/patches/feat_02/sub/link.kujo

cleanup() {
	kill "${SERVER_PID:-}" >/dev/null 2>&1 || true
	wait "${SERVER_PID:-}" >/dev/null 2>&1 || true
	rm -rf demo/patches/feat_02
	cp "$CONFIG_BACKUP" mcp-server.json
	rm -f "$CONFIG_BACKUP"
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
tree_first=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"list_tree_recursive","arguments":{"directory":"patches/feat_02","max_depth":4}}}')
tree_second=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"list_tree_recursive","arguments":{"directory":"patches/feat_02","max_depth":4}}}')
tree_refresh=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"list_tree_recursive","arguments":{"directory":"patches/feat_02","max_depth":4,"refresh_index":true}}}')

echo "$filename_non_recursive" | grep -q '"total_matches":0'
echo "$filename_recursive" | grep -q 'nested.txt'
echo "$content_recursive" | grep -q 'needle content'
echo "$limit_check" | grep -q '"total_matches":1'
echo "$timeout_check" | grep -q '"error"'
echo "$timeout_check" | grep -q 'timeout'
echo "$invalid_mode" | grep -q '"error"'
echo "$tree_first" | grep -q '"cache_hit":false'
echo "$tree_second" | grep -q '"cache_hit":true'
echo "$tree_second" | grep -q '"skipped_symlinks":1'
echo "$tree_second" | grep -vq 'link.kujo'
echo "$tree_refresh" | grep -q '"cache_hit":false'

kill "$SERVER_PID" >/dev/null 2>&1 || true
wait "$SERVER_PID" >/dev/null 2>&1 || true

node - <<'NODE'
const fs = require('fs');
const path = 'mcp-server.json';
const config = JSON.parse(fs.readFileSync(path, 'utf8'));
config.tools.tree_cache_enabled = false;
config.tools.scan_max_entries = 2;
fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
NODE

"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_feat02_server.log 2>&1 &
SERVER_PID=$!
curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null
bounded_tree=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"list_tree_recursive","arguments":{"directory":"patches/feat_02","max_depth":4}}}')
echo "$bounded_tree" | grep -q '"scan_truncated":true'
echo "$bounded_tree" | grep -q '"scan_truncation_reason":"max_entries"'
echo "$bounded_tree" | grep -q '"total_entries":2'

echo "feat_02_search_semantics: all checks passed"
