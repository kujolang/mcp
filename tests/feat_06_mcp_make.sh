#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$($ROOT_DIR/scripts/find_kujo_runtime.sh)"

cd "$ROOT_DIR"
export KUJO_BIN

TMP_PARENT="$(mktemp -d)"
TARGET_REPO="$TMP_PARENT/sample-repo"

cleanup() {
	rm -rf "$TMP_PARENT"
}
trap cleanup EXIT

mkdir -p "$TARGET_REPO/src" "$TARGET_REPO/tests"
cat > "$TARGET_REPO/README.md" <<'EOF'
# Sample Repo
EOF

cat > "$TARGET_REPO/package.json" <<'EOF'
{
  "name": "sample-repo",
  "scripts": {
    "test": "npm run test:unit",
    "lint": "npm run lint:strict",
    "build": "npm run build:web",
    "deploy": "npm run deploy:prod"
  }
}
EOF

cat > "$TARGET_REPO/src/index.js" <<'EOF'
console.log('sample repo')
EOF

cat > "$TARGET_REPO/tests/index.test.js" <<'EOF'
console.log('test placeholder')
EOF

cat > "$TARGET_REPO/.env" <<'EOF'
SUPER_SECRET_TOKEN=do-not-leak
EOF

"$KUJO_BIN" run mcp.kujo --interpreter make "$TARGET_REPO" --validate >/tmp/kujo_mcp_feat06.log 2>&1

GEN_DIR="$TARGET_REPO/.mcp/generated-server"
ART_DIR="$TARGET_REPO/.mcp/artifacts"

test -f "$GEN_DIR/repo-profile.json"
test -f "$GEN_DIR/mcp.manifest.json"
test -f "$GEN_DIR/src/server.kujo"
test -f "$GEN_DIR/README.md"
test -f "$GEN_DIR/tests/smoke.sh"

test -f "$ART_DIR/repo-map.md"
test -f "$ART_DIR/mcp-surface-plan.md"
test -f "$ART_DIR/safety-review.md"
test -f "$ART_DIR/validation-report.md"
test -f "$ART_DIR/fix-backlog.md"
test -f "$ART_DIR/fix-backlog.json"
test -f "$ART_DIR/agent-handoff.md"
test -f "$ART_DIR/patchbrief.md"
test -f "$ART_DIR/shipcheck.md"
test -f "$ART_DIR/howto.md"
test -f "$ART_DIR/mcp-findings.md"
test -f "$ART_DIR/mcp-findings.json"

grep -q 'inspect_project_structure' "$GEN_DIR/mcp.manifest.json"
grep -q 'run_safe_test_suite' "$GEN_DIR/mcp.manifest.json"
grep -q 'deploy' "$ART_DIR/safety-review.md"
grep -q 'blocked' "$ART_DIR/safety-review.md"

if grep -R "do-not-leak" "$TARGET_REPO/.mcp" >/dev/null 2>&1; then
	echo "secret value leaked into generated outputs"
	exit 1
fi

"$KUJO_BIN" run "$GEN_DIR/src/server.kujo" --interpreter --self-check >/tmp/kujo_mcp_feat06_self_check.json 2>&1
grep -q '"ok":true' /tmp/kujo_mcp_feat06_self_check.json

# Verify --out and --artifacts custom paths.
TARGET_REPO_2="$TMP_PARENT/sample-repo-custom"
mkdir -p "$TARGET_REPO_2/src"
cat > "$TARGET_REPO_2/README.md" <<'EOF'
# Sample Repo Custom
EOF
cat > "$TARGET_REPO_2/package.json" <<'EOF'
{"name":"sample-repo-custom","scripts":{"test":"npm run test"}}
EOF

CUSTOM_OUT="$TMP_PARENT/custom-output/generated-server"
CUSTOM_ART="$TMP_PARENT/custom-output/artifacts"

"$KUJO_BIN" run mcp.kujo --interpreter make "$TARGET_REPO_2" --out "$CUSTOM_OUT" --artifacts "$CUSTOM_ART" >/tmp/kujo_mcp_feat06_custom.log 2>&1

test -f "$CUSTOM_OUT/repo-profile.json"
test -f "$CUSTOM_OUT/mcp.manifest.json"
test -f "$CUSTOM_ART/fix-backlog.json"

if [ -d "$TARGET_REPO_2/.mcp" ]; then
	echo "default output directory should not be created when --out/--artifacts are provided"
	exit 1
fi

echo "feat_06_mcp_make: all checks passed"