#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

CONFIG_BACKUP="$(mktemp)"
cp mcp-server.json "$CONFIG_BACKUP"

ROOT_ONE="./demo"
ROOT_TWO="./demo_multi_root"

cleanup() {
	kill "$SERVER_PID" >/dev/null 2>&1 || true
	wait "$SERVER_PID" >/dev/null 2>&1 || true
	mv "$CONFIG_BACKUP" mcp-server.json
  rm -f "$ROOT_ONE/patches/feat_05_multi_root.kujo"
	rm -rf "$ROOT_TWO"
	(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
}
trap cleanup EXIT

mkdir -p "$ROOT_TWO/docs" "$ROOT_TWO/patches"
rm -f "$ROOT_ONE/patches/feat_05_multi_root.kujo"
cat > "$ROOT_TWO/docs/README.md" <<'EOF'
# Multi Root Secondary
unique-root2-marker
EOF

cat > mcp-server.json <<EOF
{
  "server": {"name": "mcp-demo", "version": "0.1.0", "description": "demo"},
  "http": {"host": "127.0.0.1", "port": 8931, "max_request_body_bytes": 262144, "rate_limit_enabled": true, "rate_limit_per_minute": 300},
  "permissions": {"allowed_directories": ["$ROOT_ONE", "$ROOT_TWO"], "max_file_size": 1048576, "read_only_patterns": ["*.md", "*.txt", "*.json", "*.yaml", "*.yml"]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true},
  "auth": {"enabled": false, "type": "bearer", "token": ""}
}
EOF

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_feat05_server.log 2>&1 &
SERVER_PID=$!

curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null

resources_docs=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/read -H 'Content-Type: application/json' -d '{"params":{"uri":"project://docs"}}')
search_root2=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"unique-root2-marker","mode":"content","directory":"docs","recursive":true}}}')
tree_docs=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"list_tree_recursive","arguments":{"directory":"docs","max_depth":1}}}')
write_multi_root=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_text_safe","arguments":{"file_path":"patches/feat_05_multi_root.kujo","content":"multi-root-write","create_if_missing":true}}}')
overwrite_multi_root=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_text_safe","arguments":{"file_path":"patches/feat_05_multi_root.kujo","content":"multi-root-write-overwrite","create_if_missing":true}}}')

echo "$resources_docs" | grep -q 'root1/README.md'
echo "$resources_docs" | grep -q 'root2/README.md'

echo "$search_root2" | grep -q '"result"'
echo "$search_root2" | grep -q 'root2/docs/README.md'

echo "$tree_docs" | grep -q '"result"'
echo "$tree_docs" | grep -q 'root1/docs/'
echo "$tree_docs" | grep -q 'root2/docs/'

echo "$write_multi_root" | grep -q '"result"'
echo "$overwrite_multi_root" | grep -q '"result"'

test -f demo/patches/feat_05_multi_root.kujo
test ! -f "$ROOT_TWO/patches/feat_05_multi_root.kujo"
grep -q 'multi-root-write-overwrite' demo/patches/feat_05_multi_root.kujo

echo "feat_05_multi_root_contracts: all checks passed"
