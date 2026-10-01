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
ENRICH_FIXTURE="$(mktemp -d)"
cleanup_enrich_fixture() {
	rm -rf -- "$ENRICH_FIXTURE"
}
trap cleanup_enrich_fixture EXIT
touch "$ENRICH_FIXTURE/ai_sdk.kujo" "$ENRICH_FIXTURE/providers.kujo"
cat >"$ENRICH_FIXTURE/fake-kujo" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' '{"ok":true,"content":"[{\"name\":\"inspect_domain\",\"description\":\"Inspect domain metadata\",\"safety_tier\":\"read_only\"}]","usage":{"total_tokens":7}}'
EOF
chmod +x "$ENRICH_FIXTURE/fake-kujo"
INJECTION_MARKER="$ENRICH_FIXTURE/injected"
MCP_TEST_EXPECT_AI=1 \
	AI_SDK_PATH="$ENRICH_FIXTURE" \
	KUJO_BIN="$ENRICH_FIXTURE/fake-kujo" \
	OPENAI_API_KEY='test$(touch '"$INJECTION_MARKER"')' \
	"$KUJO_BIN" run tests/test_06_make_enrich.kujo --interpreter
if test -e "$INJECTION_MARKER"; then
	echo "AI enrichment API key was evaluated as shell input" >&2
	exit 1
fi
"$KUJO_BIN" run tests/test_07_ability_projection.kujo --interpreter
KUJO_BIN="$KUJO_BIN" bash tests/arc_03_config_validation.sh

echo "test_01_unit_harness: all checks passed"
