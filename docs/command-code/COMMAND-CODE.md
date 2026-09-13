# Using Kujo from Command Code

Command Code 1.53.1 or newer can consume Kujo through MCP. No mod is required.

## Managed Ability Gateway

Add a project server:

```bash
cmd mcp add --transport http --scope project kujo-ability https://ability.kujolang.ai/mcp
cmd mcp auth kujo-ability
cmd mcp list
```

The checked-in equivalent is `integrations/kujo-ability/host-configs/command-code-http.json`. The managed service is a controlled beta and currently exposes its registered gateway catalog, not arbitrary local application handlers.

## Application-owned gateway

From `integrations/kujo-ability`, set the gateway URL and optional least-privilege bearer token in the environment that launches Command Code, then generate the project configuration:

```bash
export KUJO_ABILITY_GATEWAY_URL=http://127.0.0.1:8080
export KUJO_ABILITY_GATEWAY_TOKEN='from-your-secret-manager'
node bin/kujo-ability.mjs connect --host command-code
cmd mcp get kujo-ability
```

The connector merges `.mcp.json`, preserves unrelated servers, and never writes the token. Non-loopback gateways must use HTTPS. Restart Command Code after changing inherited environment variables.

Ask Command Code to use the relevant `mcp__kujo-ability__...` tool. Discovery is dynamic: exposing a new Ability at the gateway makes it available on the next MCP tool refresh without updating Command Code integration code. MCP tools are unavailable in Command Code plan mode.

## Approvals, receipts, and traces

Read-only calls normally execute under gateway policy. Mutating calls may return `approval_required`. A Command Code permission prompt is not a Kujo approval. Collect approval in the trusted application/UI, then provide the resulting server-bound ID through `_kujo.approvalId`. Never give the agent approval-issuance credentials.

Use `_kujo.invocationId` to correlate a host run and `_kujo.idempotencyKey` for safe keyed retries. Both are adapter controls and are removed before domain schema validation. Successful structured results include the canonical Ability receipt; preserve it in RunLedger or the calling workflow. Effects and Ability identity are available in tool `_meta`.

## Skills and agents

Point Command Code at canonical Kujo skills rather than copying them:

```bash
cmd --skill /absolute/path/to/kujo-skills/skills/loop-engineering
```

Command Code also reads `.agents/skills`. A generated or linked projection should have one canonical source. Command Code custom agents may act as local workers, but Kujo Dispatch remains authoritative for Kujo orchestration. Command Code subagents are limited to one nesting level.

## Troubleshooting

- `cmd mcp get kujo-ability`: confirm scope, transport, enabled status, command, and URL.
- `cmd login`: required before a model-driven local session; MCP configuration inspection does not require login.
- `approval_required`: use a trusted external approval flow; do not add an approval tool to the same agent.
- `unknown tool`: refresh discovery and confirm the principal is allowed to see the Ability surface.
- connection error: verify the application gateway is running and the inherited URL/token are present.
- plan mode: switch to an execution mode because Command Code hides MCP tools in plan mode.
- inspect the returned `receipt.invocation_id`, request/trace identifiers, status, policy decision, and audit metadata for correlation.

No lifecycle mod is shipped. Command Code's mod API is experimental and is not a security or completion-gating boundary.

