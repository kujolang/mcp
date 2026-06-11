#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

bash tests/arc_01_layout_smoke.sh
bash tests/arc_02_shared_helpers.sh
bash tests/arc_03_config_validation.sh
bash tests/arc_04_plugin_registration.sh

bash tests/feat_01_file_toolkit_expansion.sh
bash tests/feat_02_search_semantics.sh
bash tests/feat_03_prompt_workflow_resources.sh
bash tests/feat_04_tool_timeout_controls.sh
bash tests/feat_05_multi_root_contracts.sh
bash tests/feat_06_mcp_make.sh

bash tests/test_01_unit_harness.sh
bash tests/test_02_security_regression_suite.sh
bash tests/test_03_endpoint_integration.sh

echo "run_all_tests: all checks passed"
