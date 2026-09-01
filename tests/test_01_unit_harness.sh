#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

"$KUJO_BIN" run tests/test_01_permission_checks.kujo --interpreter
"$KUJO_BIN" run tests/test_01_pattern_matching.kujo --interpreter
"$KUJO_BIN" run tests/test_01_schema_validation.kujo --interpreter
"$KUJO_BIN" run tests/test_04_make_safety.kujo --interpreter
"$KUJO_BIN" run tests/test_04_make_profile.kujo --interpreter
"$KUJO_BIN" run tests/test_05_make_schema_contract.kujo --interpreter
"$KUJO_BIN" run tests/test_06_make_enrich.kujo --interpreter
"$KUJO_BIN" run tests/test_07_ability_projection.kujo --interpreter
KUJO_BIN="$KUJO_BIN" bash tests/arc_03_config_validation.sh

echo "test_01_unit_harness: all checks passed"
