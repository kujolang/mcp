#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="${KUJO_BIN:-$($ROOT_DIR/scripts/find_kujo_runtime.sh)}"
EXPECTED_KUJO_VERSION="${EXPECTED_KUJO_VERSION:-}"

cd "$ROOT_DIR"

runtime_version="$("$KUJO_BIN" --version)"
if [[ -n "$EXPECTED_KUJO_VERSION" ]]; then
	expected="${EXPECTED_KUJO_VERSION#v}"
	if [[ "$runtime_version" != "kujo $expected" ]]; then
		echo "first-class CLI preflight requires kujo $expected; found $runtime_version" >&2
		exit 1
	fi
fi

"$KUJO_BIN" mcp make --help >/dev/null

tmp_dir="$(mktemp -d)"
cleanup() {
	rm -rf -- "$tmp_dir"
}
trap cleanup EXIT

mkdir -p "$tmp_dir/install/sources" "$tmp_dir/sample-repo"
ln -s "$ROOT_DIR" "$tmp_dir/install/sources/mcp"
printf '# Release preflight fixture\n' >"$tmp_dir/sample-repo/README.md"

env -u KUJO_MCP_PATH \
	KUJO_INSTALL_ROOT="$tmp_dir/install" \
	"$KUJO_BIN" mcp make "$tmp_dir/sample-repo" --dry-run --no-ai \
	>"$tmp_dir/installed-resolution.log" 2>&1
grep -q "Dry run complete" "$tmp_dir/installed-resolution.log"

KUJO_BIN="$KUJO_BIN" bash tests/feat_08_first_class_cli.sh

echo "first-class MCP CLI release preflight passed with $runtime_version"
