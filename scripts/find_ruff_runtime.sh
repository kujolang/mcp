#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

is_runtime_binary() {
	local candidate="$1"
	if [[ ! -x "$candidate" ]]; then
		return 1
	fi

	"$candidate" run --help >/dev/null 2>&1
}

if [[ -n "${KUJO_BIN:-}" ]]; then
	if is_runtime_binary "$KUJO_BIN"; then
		echo "$KUJO_BIN"
		exit 0
	fi
fi

candidates=(
	"$ROOT_DIR/../kujo/target/release/kujo"
	"$ROOT_DIR/../kujo/target/debug/kujo"
	"$ROOT_DIR/../kujo/target/release-artifacts/kujo"
)

for candidate in "${candidates[@]}"; do
	if is_runtime_binary "$candidate"; then
		echo "$candidate"
		exit 0
	fi
done

if command -v kujo >/dev/null 2>&1; then
	candidate="$(command -v kujo)"
	if is_runtime_binary "$candidate"; then
		echo "$candidate"
		exit 0
	fi
fi

echo "Kujo language runtime binary not found. Set KUJO_BIN to a Kujo runtime binary that supports 'run', or build one in ../kujo/target/release/kujo." >&2
exit 1
