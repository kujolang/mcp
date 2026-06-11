#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HELPER="$ROOT_DIR/scripts/find_kujo_runtime.sh"

test -x "$HELPER"

resolved_bin="$("$HELPER")"
test -x "$resolved_bin"
"$resolved_bin" run --help >/dev/null

echo "arc_00_runtime_resolution: all checks passed"
