#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$ROOT_DIR/src/cloudflare/worker_template.js"
test -f "$TEMPLATE"
grep -q '__KUJO_MCP_DATA__' "$TEMPLATE"
grep -q 'stateless Cloudflare Worker adapter' "$TEMPLATE"
grep -q 'MAX_BODY' "$TEMPLATE"
grep -q 'catalog_revision' "$TEMPLATE"
echo "feat_07_cloudflare_target: all checks passed"
