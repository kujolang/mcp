# MCP Demo Quick Start

## Goal

Run a full demo loop in a few minutes: discover capabilities, read docs, search content, write a safe patch, and verify logs.

## 1. Start the Server

From repository root:

`bash scripts/run_server.sh`

Health check:

`curl -s http://127.0.0.1:8931/mcp/v1/health`

## 2. Discover Capabilities

List tools:

`curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/list -H 'Content-Type: application/json' -d '{}'`

List resources:

`curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/list -H 'Content-Type: application/json' -d '{}'`

## 3. Read and Search Docs

Read demo docs:

`curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_project_docs","arguments":{"file_name":"README"}}}'`

Search for content:

`curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"search_files","arguments":{"pattern":"guardrail","mode":"content","directory":"docs","recursive":true}}}'`

## 4. Write Safely

Create a patch file inside the writable sandbox:

`curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_safe_patch","arguments":{"file_path":"patches/demo_update.kujo","content":"demo content","description":"demo write"}}}'`

Read a line range from that file:

`curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"read_text_range","arguments":{"file_path":"patches/demo_update.kujo","start_line":1,"end_line":1}}}'`

## 5. Validate Safety Behavior

Try an out-of-scope write (should fail):

`curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{"params":{"name":"write_safe_patch","arguments":{"file_path":"../escape.kujo","content":"blocked","description":"path escape attempt"}}}'`

## 6. Inspect Logs

`curl -s http://127.0.0.1:8931/mcp/v1/logs`

## Next Steps

- Continue with `walkthrough.md` for a complete end-to-end sequence.
- See `scenarios.md` for practical examples of developer and agent workflows.
