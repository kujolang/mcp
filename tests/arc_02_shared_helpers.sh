#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

grep -q 'from src.core.framework import' src/server/runtime.kujo

if grep -q 'func normalize_path_for_check' src/server/runtime.kujo; then
	echo "duplicate permission helper still present"
	exit 1
fi

if grep -q 'func wildcard_match' src/server/runtime.kujo; then
	echo "duplicate pattern helper still present"
	exit 1
fi

if grep -q 'func check_permission' src/server/runtime.kujo; then
	echo "duplicate check_permission helper still present"
	exit 1
fi

if grep -q 'func str_schema' src/server/runtime.kujo; then
	echo "duplicate schema helper still present"
	exit 1
fi

if grep -q 'func safe_read' src/server/runtime.kujo; then
	echo "duplicate safe_read helper still present"
	exit 1
fi

if grep -q 'func safe_write' src/server/runtime.kujo; then
	echo "duplicate safe_write helper still present"
	exit 1
fi

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_arc02_server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true; wait "$SERVER_PID" >/dev/null 2>&1 || true' EXIT

health_resp=$(curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health)
echo "$health_resp" | grep -q '"status":"ok"'

echo "arc_02_shared_helpers: all checks passed"