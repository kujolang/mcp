#!/usr/bin/env bash
set -euo pipefail

plugin_url="https://raw.githubusercontent.com/agentplugins/agent-plugins-spec/main/schemas/1.0.0/plugin.schema.json"
mcp_url="https://raw.githubusercontent.com/agentplugins/agent-plugins-spec/main/schemas/1.0.0/mcp.schema.json"
expected_plugin="0a4aad95ce337878ad38802ebf0daa3fde76abe3f65400c86bcbb1ec0b3ab883"
expected_mcp="6539175bfcdf43085855183e86da40ea94b166547a72b47ae9a0a390516d3acb"

temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

curl --fail --silent --show-error --location "$plugin_url" --output "$temporary_directory/plugin.schema.json"
curl --fail --silent --show-error --location "$mcp_url" --output "$temporary_directory/mcp.schema.json"

actual_plugin="$(shasum -a 256 "$temporary_directory/plugin.schema.json" | awk '{print $1}')"
actual_mcp="$(shasum -a 256 "$temporary_directory/mcp.schema.json" | awk '{print $1}')"

if [[ "$actual_plugin" != "$expected_plugin" ]]; then
  echo "Agent Plugins 1.0 plugin schema changed: expected $expected_plugin, received $actual_plugin" >&2
  exit 1
fi
if [[ "$actual_mcp" != "$expected_mcp" ]]; then
  echo "Agent Plugins 1.0 MCP schema changed: expected $expected_mcp, received $actual_mcp" >&2
  exit 1
fi

echo "Agent Plugins 1.0 schema snapshots are unchanged"
