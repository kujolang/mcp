# MCP Demo Workspace

This demo workspace is designed for first-time visitors to quickly see what the MCP server can do in realistic agent workflows.

It demonstrates:

- Tool discovery and invocation
- Resource discovery and reads
- Safe file reads and writes in an allowed workspace
- Search and grep workflows for agent context gathering
- Runtime safety behavior (path checks, read-only patterns, bounded operations)

## Demo Layout

- `docs/README.md` - Demo overview and architecture notes
- `docs/guide.md` - Hands-on quick start for local testing
- `docs/walkthrough.md` - End-to-end example workflow with request payloads
- `docs/scenarios.md` - Practical usage patterns for common agent tasks
- `patches/` - Writable sandbox for safe patch and write operations

## 5-Minute Demo Flow

1. Start server from repository root:

	`bash scripts/run_server.sh`

2. Check server health:

	`curl -s http://127.0.0.1:8931/mcp/v1/health`

3. List tools and resources:

	`curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/list -H 'Content-Type: application/json' -d '{}'`

	`curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/list -H 'Content-Type: application/json' -d '{}'`

4. Read and search docs:

	`curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_project_docs","arguments":{"file_name":"README"}}}'`

	`curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"workflow","mode":"content","directory":"docs","recursive":true}}}'`

5. Write a safe patch in `patches/`:

	`curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_safe_patch","arguments":{"file_path":"patches/demo_note.kujo","content":"demo message","description":"demo write"}}}'`

6. Verify logs:

	`curl -s http://127.0.0.1:8931/mcp/v1/logs`

## Safety Boundaries In This Demo

- File operations are constrained to configured allowed directories.
- Markdown and common config extensions are read-only by default.
- Requests are protected by request-size and rate guardrails.
- Every tool call is logged for traceability.
