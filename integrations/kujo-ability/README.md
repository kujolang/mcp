# Kujo Ability host package

This portable package connects Codex, Cursor, VS Code, and other STDIO MCP hosts to an application that exposes the Kujo CMS Ability gateway contract. It does not contain credentials or weaken application policy.

Set `KUJO_ABILITY_GATEWAY_URL` to the application origin and `KUJO_ABILITY_GATEWAY_TOKEN` to a least-privilege bearer token. Loopback HTTP is allowed for local development; every non-loopback gateway must use HTTPS.

Codex can install the directory as a plugin. Cursor and VS Code can use the equivalent configurations under `host-configs/`. The bridge supports MCP `initialize`, `ping`, `tools/list`, and `tools/call`, canonical receipts, request timeouts, bounded responses, keyed idempotency, and optional server-bound approvals.

Approval issuance is disabled by default. Set `KUJO_ABILITY_ALLOW_APPROVALS=1` only when the host can collect explicit user confirmation and the bearer token is authorized for `admin.settings`.

This v1.0.1 bridge targets the current CMS gateway endpoints. A hosted multi-tenant gateway should expose the same contract behind OAuth 2.1 and must not reuse the public read-only ecosystem catalog at `mcp.kujolang.ai`.

See [`../../docs/ability-host-deployment.md`](../../docs/ability-host-deployment.md) for local, customer-hosted, managed-service, security, operations, and release-gate requirements.
