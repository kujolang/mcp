#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$($ROOT_DIR/scripts/find_kujo_runtime.sh)"
cd "$ROOT_DIR"

# The first-class CLI resolves the canonical MCP package. In this checkout the
# development override points at the canonical source itself; installed Kujo
# runtimes resolve the ecosystem-managed copy or a Kennel lockfile entry.
export KUJO_MCP_PATH="$ROOT_DIR"
export KUJO_BIN

TMP_PARENT="$(mktemp -d)"
cleanup() {
	rm -rf -- "$TMP_PARENT"
}
trap cleanup EXIT

# --- Parser surface ------------------------------------------------------ #

"$KUJO_BIN" mcp --help >"$TMP_PARENT/mcp-help.log" 2>&1
grep -q "make" "$TMP_PARENT/mcp-help.log"

"$KUJO_BIN" mcp make --help >"$TMP_PARENT/make-help.log" 2>&1
grep -q "Generate a repo-specific MCP server" "$TMP_PARENT/make-help.log"
grep -q "REPO" "$TMP_PARENT/make-help.log"
grep -q "current directory" "$TMP_PARENT/make-help.log"
grep -q -- "--out" "$TMP_PARENT/make-help.log"
grep -q -- "--artifacts" "$TMP_PARENT/make-help.log"
grep -q -- "--profile-only" "$TMP_PARENT/make-help.log"
grep -q -- "--artifacts-only" "$TMP_PARENT/make-help.log"
grep -q -- "--no-ai" "$TMP_PARENT/make-help.log"
grep -q -- "--validate" "$TMP_PARENT/make-help.log"
grep -q -- "--dry-run" "$TMP_PARENT/make-help.log"

if grep -q -- "--interpreter" "$TMP_PARENT/make-help.log"; then
	echo "first-class mcp make help must not document --interpreter"
	exit 1
fi

if "$KUJO_BIN" mcp make --unknown-flag >/dev/null 2>&1; then
	echo "mcp make must reject unknown flags"
	exit 1
fi

create_sample_repo() {
	local repo="$1"
	mkdir -p "$repo/src" "$repo/tests"
	cat > "$repo/README.md" <<'INNER_EOF'
# Sample Repo
INNER_EOF

	cat > "$repo/package.json" <<'INNER_EOF'
{
  "name": "sample-repo",
  "scripts": {
    "test": "npm run test:unit",
    "lint": "npm run lint:strict",
    "build": "npm run build:web",
    "deploy": "npm run deploy:prod"
  }
}
INNER_EOF

	cat > "$repo/src/index.js" <<'INNER_EOF'
console.log('sample repo')
INNER_EOF

	cat > "$repo/tests/index.test.js" <<'INNER_EOF'
console.log('test placeholder')
INNER_EOF

	cat > "$repo/.env" <<'INNER_EOF'
SUPER_SECRET_TOKEN=do-not-leak
INNER_EOF
}

# --- cwd targeting, relative and absolute repositories -------------------- #

TARGET_REPO="$TMP_PARENT/sample-repo"
create_sample_repo "$TARGET_REPO"

(cd "$TARGET_REPO" && "$KUJO_BIN" mcp make --validate --no-ai) >"$TMP_PARENT/cwd.log" 2>&1
GEN_DIR="$TARGET_REPO/.mcp/generated-server"
ART_DIR="$TARGET_REPO/.mcp/artifacts"

test -f "$GEN_DIR/repo-profile.json"
test -f "$GEN_DIR/mcp.manifest.json"
test -f "$GEN_DIR/mcp-server.json"
test -f "$GEN_DIR/src/server.kujo"
test -f "$GEN_DIR/tests/smoke.sh"
test -f "$ART_DIR/safety-review.md"
test -f "$ART_DIR/validation-report.md"

# Relative repository path from a parent directory.
REL_REPO="$TMP_PARENT/sample-repo-relative"
create_sample_repo "$REL_REPO"
(cd "$TMP_PARENT" && "$KUJO_BIN" mcp make ./sample-repo-relative --profile-only) >"$TMP_PARENT/relative.log" 2>&1
test -f "$REL_REPO/.mcp/generated-server/repo-profile.json"
if test -d "$REL_REPO/.mcp/generated-server/src"; then
	echo "--profile-only unexpectedly created server scaffold directories"
	exit 1
fi

# Absolute repository path with custom output directories.
ABS_REPO="$TMP_PARENT/sample-repo-absolute"
create_sample_repo "$ABS_REPO"
CUSTOM_OUT="$TMP_PARENT/custom-server"
CUSTOM_ART="$TMP_PARENT/custom-artifacts"
"$KUJO_BIN" mcp make "$ABS_REPO" --out "$CUSTOM_OUT" --artifacts "$CUSTOM_ART" --no-ai >"$TMP_PARENT/absolute.log" 2>&1
test -f "$CUSTOM_OUT/mcp.manifest.json"
test -f "$CUSTOM_ART/fix-backlog.json"
if test -e "$ABS_REPO/.mcp"; then
	echo "custom out/artifacts must not create the default .mcp directory"
	exit 1
fi

# Deterministic generation: identical content after normalizing output paths
# and the single generated_at timestamp in the manifest.
DET1_OUT="$TMP_PARENT/det1/server"
DET1_ART="$TMP_PARENT/det1/artifacts"
DET2_OUT="$TMP_PARENT/det2/server"
DET2_ART="$TMP_PARENT/det2/artifacts"
"$KUJO_BIN" mcp make "$ABS_REPO" --out "$DET1_OUT" --artifacts "$DET1_ART" --no-ai >"$TMP_PARENT/det1.log" 2>&1
"$KUJO_BIN" mcp make "$ABS_REPO" --out "$DET2_OUT" --artifacts "$DET2_ART" --no-ai >"$TMP_PARENT/det2.log" 2>&1

DET_FILES_A="$(find "$DET1_OUT" -type f | sed "s|$DET1_OUT/||" | sort)"
DET_FILES_B="$(find "$DET2_OUT" -type f | sed "s|$DET2_OUT/||" | sort)"
if [[ "$DET_FILES_A" != "$DET_FILES_B" ]]; then
	echo "deterministic generation produced different file trees"
	diff <(printf '%s\n' "$DET_FILES_A") <(printf '%s\n' "$DET_FILES_B")
	exit 1
fi

if ! diff \
	<(sed "s|$DET1_OUT|OUT|g; s|$DET1_ART|ART|g; s|\"generated_at\":\"[^\"]*\"|\"generated_at\":\"X\"|" "$DET1_OUT/mcp.manifest.json") \
	<(sed "s|$DET2_OUT|OUT|g; s|$DET2_ART|ART|g; s|\"generated_at\":\"[^\"]*\"|\"generated_at\":\"X\"|" "$DET2_OUT/mcp.manifest.json") >/dev/null; then
	echo "normalized mcp manifests differ between deterministic runs"
	exit 1
fi

if ! cmp \
	<(sed "s|$DET1_OUT|OUT|g; s|$DET1_ART|ART|g" "$DET1_OUT/repo-profile.json") \
	<(sed "s|$DET2_OUT|OUT|g; s|$DET2_ART|ART|g" "$DET2_OUT/repo-profile.json") >/dev/null; then
	echo "deterministic repo profiles differ between runs"
	exit 1
fi

# --- Safety model survives delegation ------------------------------------- #

grep -q 'inspect_project_structure' "$GEN_DIR/mcp.manifest.json"
grep -q 'run_safe_test_suite' "$GEN_DIR/mcp.manifest.json"
grep -q '"max_request_body_bytes":262144' "$GEN_DIR/mcp-server.json"
grep -q '"rate_limit_enabled":true' "$GEN_DIR/mcp-server.json"
grep -q 'Resource path is outside generated server resource roots' "$GEN_DIR/src/server.kujo"
grep -q 'Request body exceeds configured maximum' "$GEN_DIR/src/server.kujo"
grep -q 'deploy' "$ART_DIR/safety-review.md"
grep -q 'blocked' "$ART_DIR/safety-review.md"

if grep -R "do-not-leak" "$TARGET_REPO/.mcp" >/dev/null 2>&1; then
	echo "secret value leaked into generated outputs"
	exit 1
fi

"$KUJO_BIN" run "$GEN_DIR/src/server.kujo" --interpreter --self-check >"$TMP_PARENT/self-check.log" 2>&1
grep -q '"ok":true' "$TMP_PARENT/self-check.log"

# --- Dry run and failure surfaces ----------------------------------------- #

DRY_REPO="$TMP_PARENT/dry-repo"
create_sample_repo "$DRY_REPO"
(cd "$DRY_REPO" && "$KUJO_BIN" mcp make --dry-run --no-ai) >"$TMP_PARENT/dry.log" 2>&1
grep -q "Dry run complete" "$TMP_PARENT/dry.log"
if test -e "$DRY_REPO/.mcp"; then
	echo "--dry-run must not write any files"
	exit 1
fi

if "$KUJO_BIN" mcp make "$TMP_PARENT/no-such-repo" >/dev/null 2>&1; then
	echo "mcp make must reject missing repositories"
	exit 1
fi

echo "feat_08_first_class_cli: all checks passed"
