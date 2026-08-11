#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUJO_BIN="$("$ROOT_DIR/scripts/find_kujo_runtime.sh")"

cd "$ROOT_DIR"
export KUJO_BIN

CONFIG_BACKUP="$(mktemp)"
cp mcp-server.json "$CONFIG_BACKUP"

cleanup() {
	mv "$CONFIG_BACKUP" mcp-server.json
	(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
}
trap cleanup EXIT

expect_fail_with_message() {
	local expected_text="$1"
	if "$KUJO_BIN" run server.kujo --interpreter >/tmp/kujo_mcp_arc03_fail.log 2>&1; then
		echo "server unexpectedly started"
		exit 1
	fi
	grep -q "$expected_text" /tmp/kujo_mcp_arc03_fail.log
}

# Case 1: Invalid http.port type must fail with explicit startup message.
cat > mcp-server.json <<'EOF'
{
  "server": {"name": "mcp-demo", "version": "1.0.0", "description": "demo"},
  "http": {"host": "127.0.0.1", "port": "8931"},
  "permissions": {"allowed_directories": ["./demo"], "max_file_size": 1048576, "read_only_patterns": ["*.md"]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true}
}
EOF
expect_fail_with_message 'Invalid mcp-server.json: http.port must be a positive integer'

# Case 2: Missing permissions.allowed_directories must fail with explicit startup message.
cat > mcp-server.json <<'EOF'
{
  "server": {"name": "mcp-demo", "version": "1.0.0", "description": "demo"},
  "http": {"host": "127.0.0.1", "port": 8931},
  "permissions": {"max_file_size": 1048576, "read_only_patterns": ["*.md"]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true}
}
EOF
expect_fail_with_message 'Invalid mcp-server.json: permissions.allowed_directories must be a non-empty array'

# Case 3: Missing server.name must fail with explicit startup message.
cat > mcp-server.json <<'EOF'
{
  "server": {"version": "1.0.0", "description": "demo"},
  "http": {"host": "127.0.0.1", "port": 8931},
  "permissions": {"allowed_directories": ["./demo"], "max_file_size": 1048576, "read_only_patterns": ["*.md"]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true}
}
EOF
expect_fail_with_message 'Invalid mcp-server.json: server.name is required'

# Case 4: String-valued settings must not silently coerce other JSON types.
cat > mcp-server.json <<'EOF'
{
  "server": {"name": 42, "version": "1.0.0"},
  "http": {"host": "127.0.0.1", "port": 8931},
  "permissions": {"allowed_directories": ["./demo"], "max_file_size": 1048576, "read_only_patterns": ["*.md"]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true}
}
EOF
expect_fail_with_message 'Invalid mcp-server.json: server.name must be a non-empty string'

cat > mcp-server.json <<'EOF'
{
  "server": {"name": "mcp-demo", "version": "1.0.0"},
  "http": {"host": 127, "port": 8931},
  "permissions": {"allowed_directories": ["./demo"], "max_file_size": 1048576, "read_only_patterns": ["*.md"]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true}
}
EOF
expect_fail_with_message 'Invalid mcp-server.json: http.host must be a non-empty string'

cat > mcp-server.json <<'EOF'
{
  "server": {"name": "mcp-demo", "version": "1.0.0"},
  "http": {"host": "127.0.0.1", "port": 8931},
  "permissions": {"allowed_directories": ["./demo"], "max_file_size": 1048576, "read_only_patterns": ["*.md"]},
  "logging": {"max_entries": 100, "log_file": 99},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true}
}
EOF
expect_fail_with_message 'Invalid mcp-server.json: logging.log_file must be a non-empty string'

# Case 5: Ports outside the TCP range must fail before listener startup.
cat > mcp-server.json <<'EOF'
{
  "server": {"name": "mcp-demo", "version": "1.0.0"},
  "http": {"host": "127.0.0.1", "port": 70000},
  "permissions": {"allowed_directories": ["./demo"], "max_file_size": 1048576, "read_only_patterns": ["*.md"]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true}
}
EOF
expect_fail_with_message 'Invalid mcp-server.json: http.port must be between 1 and 65535'

# Case 6: Permission arrays must contain strings, not coercible values.
cat > mcp-server.json <<'EOF'
{
  "server": {"name": "mcp-demo", "version": "1.0.0"},
  "http": {"host": "127.0.0.1", "port": 8931},
  "permissions": {"allowed_directories": [123], "max_file_size": 1048576, "read_only_patterns": ["*.md"]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true}
}
EOF
expect_fail_with_message 'Invalid mcp-server.json: permissions.allowed_directories entries must be non-empty strings'

cat > mcp-server.json <<'EOF'
{
  "server": {"name": "mcp-demo", "version": "1.0.0"},
  "http": {"host": "127.0.0.1", "port": 8931},
  "permissions": {"allowed_directories": ["./demo"], "max_file_size": 1048576, "read_only_patterns": [false]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true}
}
EOF
expect_fail_with_message 'Invalid mcp-server.json: permissions.read_only_patterns entries must be non-empty strings'

# Case 7: Enabled auth requires a real, non-empty string token.
cat > mcp-server.json <<'EOF'
{
  "server": {"name": "mcp-demo", "version": "1.0.0"},
  "http": {"host": "127.0.0.1", "port": 8931},
  "permissions": {"allowed_directories": ["./demo"], "max_file_size": 1048576, "read_only_patterns": ["*.md"]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true},
  "auth": {"enabled": true, "type": "bearer", "token": 123}
}
EOF
expect_fail_with_message 'Invalid mcp-server.json: auth.token must be a string'

cat > mcp-server.json <<'EOF'
{
  "server": {"name": "mcp-demo", "version": "1.0.0"},
  "http": {"host": "127.0.0.1", "port": 8931},
  "permissions": {"allowed_directories": ["./demo"], "max_file_size": 1048576, "read_only_patterns": ["*.md"]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true},
  "auth": {"enabled": true, "type": "bearer", "token": "  "}
}
EOF
expect_fail_with_message 'Invalid mcp-server.json: auth.token must be a non-empty string when auth.enabled is true'

# Case 8: Optional auth block omitted should still start using defaults.
cat > mcp-server.json <<'EOF'
{
  "server": {"name": "mcp-demo", "version": "1.0.0", "description": "demo"},
  "http": {"host": "127.0.0.1", "port": 8931},
  "permissions": {"allowed_directories": ["./demo"], "max_file_size": 1048576, "read_only_patterns": ["*.md", "*.txt", "*.json", "*.yaml", "*.yml"]},
  "logging": {"max_entries": 100, "log_file": "./mcp-calls.log"},
  "tools": {"enabled": true, "default_timeout_ms": 30000},
  "resources": {"enabled": true}
}
EOF

(lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)
"$KUJO_BIN" run server.kujo --interpreter >/tmp/kujo_mcp_arc03_ok.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true; wait "$SERVER_PID" >/dev/null 2>&1 || true; mv "$CONFIG_BACKUP" mcp-server.json; (lsof -nP -iTCP:8931 -sTCP:LISTEN -t | xargs -I{} kill {} >/dev/null 2>&1 || true)' EXIT

health_resp=$(curl --retry 25 --retry-connrefused --retry-delay 1 -s http://127.0.0.1:8931/mcp/v1/health)
echo "$health_resp" | grep -q '"status":"ok"'
echo "$health_resp" | grep -q '"server":"mcp-demo"'
echo "$health_resp" | grep -q '"version":"1.0.0"'

echo "arc_03_config_validation: all checks passed"
