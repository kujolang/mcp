#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

LOG_BACKUP="$(mktemp)"
LOG_EXISTED=false
if [[ -f mcp-calls.log ]]; then
	cp mcp-calls.log "$LOG_BACKUP"
	LOG_EXISTED=true
fi
rm -f mcp-calls.log

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
"$KUJO_BIN" run server.kujo --interpreter >/tmp/kujo_mcp_sec08_server.log 2>&1 &
SERVER_PID=$!

cleanup() {
	kill "$SERVER_PID" >/dev/null 2>&1 || true
	wait "$SERVER_PID" >/dev/null 2>&1 || true
	rm -f demo/patches/sec_08.kujo mcp-calls.log
	if [[ "$LOG_EXISTED" == true ]]; then
		mv "$LOG_BACKUP" mcp-calls.log
	else
		rm -f "$LOG_BACKUP"
	fi
}
trap cleanup EXIT

curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null

secret='sec08-super-secret-value'
curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call \
	-H 'Content-Type: application/json' \
	-d "{\"params\":{\"name\":\"write_safe_patch\",\"arguments\":{\"file_path\":\"patches/sec_08.kujo\",\"content\":\"$secret\",\"description\":\"redaction test\"}}}" >/dev/null
curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call \
	-H 'Content-Type: application/json' \
	-d "{\"params\":{\"name\":\"$secret\",\"arguments\":{}}}" >/dev/null
curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call \
	-H 'Content-Type: application/json' \
	-d "{\"params\":{\"name\":\"search_files\",\"arguments\":{\"pattern\":\"$secret\",\"mode\":\"bad-mode\"}}}" >/dev/null

grep -q 'Tool call: write_safe_patch' mcp-calls.log
grep -q 'OK: write_safe_patch' mcp-calls.log
grep -q 'Rejected unknown tool' mcp-calls.log
grep -q 'Fail: search_files' mcp-calls.log
if grep -q "$secret" mcp-calls.log; then
	echo 'audit log leaked a tool argument or untrusted tool name'
	exit 1
fi

echo "sec_08_audit_redaction: all checks passed"
