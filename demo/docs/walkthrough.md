# End-to-End Demo Walkthrough

This walkthrough demonstrates a realistic MCP session using the MCP server and the demo workspace.

## Step 1: Start Server

From repository root:

bash scripts/run_server.sh

## Step 2: Confirm Health

curl -s http://127.0.0.1:8931/mcp/v1/health

Expected: a success response indicating the server is running.

## Step 3: Discover Tools

curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/list \
  -H 'Content-Type: application/json' \
  -d '{}'

Expected: tool metadata including search, read, write, tree, and grep operations.

## Step 4: Discover Resources

curl -s -X POST http://127.0.0.1:8931/mcp/v1/resources/list \
  -H 'Content-Type: application/json' \
  -d '{}'

Expected: resources like project docs, file tree, and log stream.

## Step 5: Read Documentation

curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call \
  -H 'Content-Type: application/json' \
  -d '{"params":{"name":"read_project_docs","arguments":{"file_name":"guide"}}}'

Expected: guide content returned in tool result payload.

## Step 6: Search For Context

curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call \
  -H 'Content-Type: application/json' \
  -d '{"params":{"name":"search_files","arguments":{"pattern":"runtime","mode":"content","directory":"docs","recursive":true}}}'

Expected: one or more matches in demo docs.

## Step 7: Write A Safe Patch

curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call \
  -H 'Content-Type: application/json' \
  -d '{"params":{"name":"write_safe_patch","arguments":{"file_path":"patches/walkthrough_note.kujo","content":"walkthrough output","description":"demo walkthrough write"}}}'

Expected: successful write result.

## Step 8: Confirm File Content

curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call \
  -H 'Content-Type: application/json' \
  -d '{"params":{"name":"read_text_range","arguments":{"file_path":"patches/walkthrough_note.kujo","start_line":1,"end_line":1}}}'

Expected: first line of the file is returned.

## Step 9: Trigger A Safety Rejection

curl -s -X POST http://127.0.0.1:8931/mcp/v1/tools/call \
  -H 'Content-Type: application/json' \
  -d '{"params":{"name":"write_safe_patch","arguments":{"file_path":"../blocked_escape.kujo","content":"should fail","description":"escape attempt"}}}'

Expected: error response due to path boundary checks.

## Step 10: Inspect Audit Logs

curl -s http://127.0.0.1:8931/mcp/v1/logs

Expected: entries for invoked operations.

## Cleanup

rm -f demo/patches/walkthrough_note.kujo
