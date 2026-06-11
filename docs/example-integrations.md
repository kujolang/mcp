# Example Integrations

This document provides example local and remote MCP usage patterns for MCP-compatible clients.
The examples are illustrative; they do not mean every client or hosted environment was exhaustively verified in this repository.

## Local Integration (Copilot + stdio)

Use a local stdio launch when the server should run from your machine during development.

```json
{
  "mcpServers": {
    "mcp-local": {
      "type": "stdio",
      "command": "/absolute/path/to/kujo-runtime",
      "args": ["run", "/path/to/mcp/server.kujo", "--interpreter"]
    }
  }
}
```

Notes:
- Replace `/path/to/mcp/server.kujo` with your local repository path.
- Replace `/absolute/path/to/kujo-runtime` with a Kujo language runtime binary that supports `run`.
- Keep `allowed_directories` constrained to a dedicated workspace.

## Remote HTTP Integration (Example MCP-Compatible Client)

When running as a persistent HTTP service, point clients at the MCP endpoint host.

```json
{
  "mcpServers": {
    "mcp-remote": {
      "type": "http",
      "url": "https://mcp.example.com/mcp/v1",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

Notes:
- Enable `auth.enabled` and provide a strong token before exposing a remote endpoint.
- Restrict host binding and upstream ingress rules.

### Reverse-Proxy Deployment Notes (Recommended)

- Terminate TLS at the proxy and forward to the MCP service on a private network.
- Keep the service inaccessible from the public internet except through the proxy/ingress.
- For multi-instance deployment, apply shared/distributed request throttling at the proxy or gateway layer.

## Generic Client Endpoint Flow

Any MCP-compatible HTTP client can follow this sequence. This is an example flow, not an exhaustive client compatibility certification.

1. GET `/mcp/v1/health`
2. POST `/mcp/v1/tools/list`
3. POST `/mcp/v1/resources/list`
4. POST `/mcp/v1/tools/call`
5. POST `/mcp/v1/resources/read`

### Example Calls

```bash
curl -s http://127.0.0.1:8931/mcp/v1/health

curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/list \
  -H 'Content-Type: application/json' \
  -d '{}'

curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call \
  -H 'Content-Type: application/json' \
  -d '{"params":{"name":"search_files","arguments":{"pattern":"README","mode":"filename"}}}'
```

## Security and Validation Notes for Integrators

- Tool schemas returned from `tools/list` are discoverability metadata for clients.
- Request-envelope validation is enforced server-side.
- Detailed argument validation is enforced in tool handlers.
- Run `tests/test_03_endpoint_integration.sh` after integration-related changes.
