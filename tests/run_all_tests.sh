#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

bash tests/arc_00_runtime_resolution.sh

KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"
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
bash tests/feat_07_cloudflare_target.sh

bash tests/test_01_unit_harness.sh
bash tests/test_02_security_regression_suite.sh
bash tests/test_03_endpoint_integration.sh

"$KUJO_BIN" run tests/test_08_watchdog_telemetry.kujo --interpreter
"$KUJO_BIN" run tests/test_07_ability_projection.kujo --interpreter
"$KUJO_BIN" run tests/test_09_ability_gateway.kujo --interpreter
node tests/portable_ability_plugin_test.mjs
node tests/ability_contract_drift_test.mjs
node tests/ability_connector_cli_test.mjs
node tests/ability_host_bridge_test.mjs
node tests/codex_clean_profile_test.mjs
node tests/codex_clean_profile_required_test.mjs
node tests/ability_compatibility_matrix_test.mjs
node tests/ability_package_release_test.mjs

echo "run_all_tests: all checks passed"
