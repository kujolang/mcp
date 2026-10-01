# MCP Examples

Copyable MCP usage examples live in the main repository README and `demo/README.md`. This directory provides a stable examples surface for release-readiness scanners.

```bash
bash scripts/run_server.sh
kujo run mcp.kujo --interpreter make ./demo --validate --no-ai
```

With a Kujo build that includes the first-party command group, the equivalent command is `kujo mcp make ./demo --validate --no-ai`.
