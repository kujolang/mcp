#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

test -f src/core/framework.kujo
test -f src/server/runtime.kujo
test -d src/tools
test -d src/resources

grep -q 'from src.server.runtime import' server.kujo
grep -q 'from src.core.framework import' mcp.kujo

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_arc01_server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true; wait "$SERVER_PID" >/dev/null 2>&1 || true' EXIT

health_resp=$(curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health)
echo "$health_resp" | grep -q '"status":"ok"'

echo "arc_01_layout_smoke: all checks passed"