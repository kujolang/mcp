#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_ROOT="$(cd "$ROOT_DIR/.." && pwd)"
KUJO_BIN="${KUJO_BIN:-$($ROOT_DIR/scripts/find_kujo_runtime.sh)}"
CMD_BIN="${COMMAND_CODE_BIN:-$(command -v command-code)}"
MODEL="${COMMAND_CODE_OLLAMA_MODEL:-ollama/glm-5.3:cloud}"
DEMO_ROOT="$(mktemp -d /tmp/kujo-cmd-live.XXXXXX)"

cleanup() {
  case "$DEMO_ROOT" in /tmp/kujo-cmd-live.*) rm -rf -- "$DEMO_ROOT" ;; esac
}
trap cleanup EXIT INT TERM

mkdir -p "$DEMO_ROOT/project" "$DEMO_ROOT/home"
cd "$DEMO_ROOT/project"
git init -q
echo '# Kujo CMD live proof' > README.md
git add README.md
git -c user.name=Kujo -c user.email=kujo@example.invalid commit -qm init

cd "$ROOT_DIR/integrations/kujo-cmd"
npm run build >/dev/null
KUJO_CMD_HOME="$DEMO_ROOT/home" KUJO_BIN="$KUJO_BIN" \
  node bin/kujo-cmd.mjs setup --project "$DEMO_ROOT/project" \
  --source-root "$SOURCE_ROOT" --json

cd "$DEMO_ROOT/project"
CMD_LOCAL_ONLY=1 COMMAND_CODE_API_KEY=local-only-placeholder \
KUJO_CMD_HOME="$DEMO_ROOT/home" \
  "$CMD_BIN" -p \
  'Call the Kujo ability catalog MCP tool exactly once. Then state the active profile and three capability IDs returned by the tool.' \
  --model "$MODEL" --no-session --skip-onboarding --output-format json \
  --yolo --max-turns 6
