#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

CONFIG_BACKUP="$(mktemp)"
cp mcp-server.json "$CONFIG_BACKUP"

SERVER_PID=""

stop_server() {
	if [[ -n "$SERVER_PID" ]]; then
		kill "$SERVER_PID" >/dev/null 2>&1 || true
		wait "$SERVER_PID" >/dev/null 2>&1 || true
		SERVER_PID=""
	fi
}

cleanup() {
	stop_server
	mv "$CONFIG_BACKUP" mcp-server.json
	(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
}
trap cleanup EXIT

write_config() {
	local auth_type="$1"
	local auth_token="$2"
	cat > mcp-server.json <<EOF
{
  "server": {
    "name": "mcp-demo",
    "version": "1.0.0",
    "description": "MCP Server Framework Demo"
  },
  "http": {
    "host": "127.0.0.1",
    "port": 8931
  },
  "permissions": {
    "allowed_directories": ["./demo"],
    "max_file_size": 1048576,
    "read_only_patterns": ["*.md", "*.txt", "*.json", "*.yaml", "*.yml"]
  },
  "logging": {
    "max_entries": 100,
    "log_file": "./mcp-calls.log"
  },
  "tools": {
    "enabled": true,
    "default_timeout_ms": 30000
  },
  "resources": {
    "enabled": true
  },
  "auth": {
    "enabled": true,
    "type": "${auth_type}",
    "token": "${auth_token}"
  }
}
EOF
}

start_server() {
	stop_server
	(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
	"$KUJO_BIN" run server.kujo --interpreter > /tmp/kujo_mcp_sec06_server.log 2>&1 &
	SERVER_PID=$!
	curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health >/dev/null || true
}

# Bearer mode checks.
write_config "bearer" "sec06-bearer-token"
start_server

bearer_missing=$(curl -s http://127.0.0.1:8931/mcp/v1/health)
bearer_wrong=$(curl -s -H 'Authorization: Bearer wrong-token' http://127.0.0.1:8931/mcp/v1/health)
bearer_ok=$(curl -s -H 'Authorization: Bearer sec06-bearer-token' http://127.0.0.1:8931/mcp/v1/health)
bearer_bad_host=$(curl -s -H 'Authorization: Bearer sec06-bearer-token' -H 'Host: evil.example' http://127.0.0.1:8931/mcp/v1/health)

echo "$bearer_missing" | grep -q '"error"'
echo "$bearer_wrong" | grep -q '"error"'
echo "$bearer_ok" | grep -q '"status":"ok"'
echo "$bearer_bad_host" | grep -q '"error"'

# API key mode checks.
write_config "api_key" "sec06-api-key"
start_server

api_key_missing=$(curl -s http://127.0.0.1:8931/mcp/v1/health)
api_key_wrong=$(curl -s -H 'X-API-Key: wrong-key' http://127.0.0.1:8931/mcp/v1/health)
api_key_ok=$(curl -s -H 'X-API-Key: sec06-api-key' http://127.0.0.1:8931/mcp/v1/health)

echo "$api_key_missing" | grep -q '"error"'
echo "$api_key_wrong" | grep -q '"error"'
echo "$api_key_ok" | grep -q '"status":"ok"'

echo "sec_06_network_auth: all checks passed"
