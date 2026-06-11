#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"
exec "$KUJO_BIN" run "$ROOT_DIR/server.kujo" --interpreter "$@"
