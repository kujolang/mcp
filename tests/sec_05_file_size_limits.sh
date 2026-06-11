#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

CONFIG_BACKUP="$(mktemp)"
cp mcp-server.json "$CONFIG_BACKUP"

cleanup() {
	(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
	mv "$CONFIG_BACKUP" mcp-server.json
	rm -f demo/docs/sec_05_small.md demo/docs/sec_05_large.md demo/patches/sec_05_small.kujo demo/patches/sec_05_large.kujo
}
trap cleanup EXIT

sed -E 's/"max_file_size": [0-9]+/"max_file_size": 64/' "$CONFIG_BACKUP" > mcp-server.json

echo "small" > demo/docs/sec_05_small.md
printf 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ' > demo/docs/sec_05_large.md

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_sec05_server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true; wait "$SERVER_PID" >/dev/null 2>&1 || true; mv "$CONFIG_BACKUP" mcp-server.json; rm -f demo/docs/sec_05_small.md demo/docs/sec_05_large.md demo/patches/sec_05_small.kujo demo/patches/sec_05_large.kujo' EXIT

curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null

read_small=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_project_docs","arguments":{"file_name":"sec_05_small"}}}')
read_large=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_project_docs","arguments":{"file_name":"sec_05_large"}}}')

write_small=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_safe_patch","arguments":{"file_path":"patches/sec_05_small.kujo","content":"small","description":"small write"}}}')
write_large=$(curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_safe_patch","arguments":{"file_path":"patches/sec_05_large.kujo","content":"ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ","description":"large write"}}}')

echo "$read_small" | grep -q '"result"'
echo "$read_large" | grep -q '"error"'

echo "$write_small" | grep -q '"result"'
echo "$write_large" | grep -q '"error"'

test -f demo/patches/sec_05_small.kujo
test ! -f demo/patches/sec_05_large.kujo

echo "sec_05_file_size_limits: all checks passed"