#!/usr/bin/env bash
set -euo pipefail

fixture="$(mktemp -d)"
outside="$(mktemp -d)"
cleanup() {
	rm -rf -- "$fixture" "$outside"
}
trap cleanup EXIT

printf '{}\n' >"$outside/package.json"
printf 'outside\n' >"$outside/secret.txt"
ln -s "$outside" "$fixture/outside-link"

MCP_PROFILE_FIXTURE="$fixture" "$KUJO_BIN" run tests/test_12_profile_symlink_guard.kujo --interpreter
