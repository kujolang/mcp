#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

"$KUJO_BIN" run tests/sec_01_path_guard.kujo --interpreter
"$KUJO_BIN" run tests/sec_02_read_only_patterns.kujo --interpreter
bash tests/sec_03_tool_path_sanitization.sh
bash tests/sec_04_request_validation.sh
bash tests/sec_05_file_size_limits.sh
bash tests/sec_06_network_auth.sh
bash tests/sec_07_tool_argument_validation.sh

echo "test_02_security_regression_suite: all checks passed"
