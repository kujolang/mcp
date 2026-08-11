#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)

cat > demo/patches/feat_01_sample.txt <<'EOF'
alpha
banana
carrot
banana bread
EOF

cleanup() {
	kill "$SERVER_PID" >/dev/null 2>&1 || true
	wait "$SERVER_PID" >/dev/null 2>&1 || true
	rm -f demo/patches/feat_01_sample.txt demo/patches/feat_01_created.kujo
}
trap cleanup EXIT

"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_feat01_server.log 2>&1 &
SERVER_PID=$!

curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null

range_ok=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_text_range","arguments":{"file_path":"patches/feat_01_sample.txt","start_line":2,"end_line":3}}}')
range_bad=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_text_range","arguments":{"file_path":"patches/feat_01_sample.txt","start_line":4,"end_line":2}}}')

echo "$range_ok" | grep -q '"line_count":2'
echo "$range_ok" | grep -q 'banana'
echo "$range_bad" | grep -q '"error"'

write_missing=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_text_safe","arguments":{"file_path":"patches/feat_01_created.kujo","content":"created"}}}')
write_create=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_text_safe","arguments":{"file_path":"patches/feat_01_created.kujo","content":"created","create_if_missing":true}}}')
write_overwrite=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_text_safe","arguments":{"file_path":"patches/feat_01_created.kujo","content":"updated","create_if_missing":true}}}')

echo "$write_missing" | grep -q '"error"'
echo "$write_create" | grep -q '"result"'
echo "$write_create" | grep -q '"created":true'
echo "$write_overwrite" | grep -q '"created":false'
test -f demo/patches/feat_01_created.kujo

tree_ok=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"list_tree_recursive","arguments":{"directory":"patches","max_depth":1}}}')
tree_bad=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"list_tree_recursive","arguments":{"directory":"../"}}}')

echo "$tree_ok" | grep -q '"total_entries"'
echo "$tree_ok" | grep -q 'feat_01_sample.txt'
echo "$tree_bad" | grep -q '"error"'

grep_literal=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"grep_text","arguments":{"query":"banana","mode":"literal","directory":"patches","max_results":5}}}')
grep_regex=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"grep_text","arguments":{"query":"b.n.n.","mode":"regex","directory":"patches","max_results":5}}}')
grep_bad=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"grep_text","arguments":{"query":"banana","mode":"literal","directory":"../"}}}')

echo "$grep_literal" | grep -q '"total_matches":2'
echo "$grep_regex" | grep -q '"total_matches":2'
echo "$grep_bad" | grep -q '"error"'

echo "feat_01_file_toolkit_expansion: all checks passed"
