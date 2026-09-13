# Using Kujo from Command Code

Command Code 1.53.1 or newer can consume Kujo through MCP. No mod is required.

## Local Ollama setup

The verified local path uses Command Code 1.53.1, Ollama 0.34.0, and
`ollama/glm-5.3:cloud`. An Ollama Cloud login is sufficient for the model
provider; a paid Command Code account is not required for this path.

```bash
ollama pull glm-5.3:cloud

# ~/.commandcode/config.json
{ "localOnly": true }
```

Add Ollama to `~/.commandcode/providers.json` with base URL
`http://127.0.0.1:11434/v1`, `apiKey: false`, and model key
`glm-5.3:cloud`. The configured workstation launcher is
`~/.local/bin/cmd-ollama`; it selects `ollama/glm-5.3:cloud` and forces
`CMD_LOCAL_ONLY=1`.

Command Code 1.53.1 has one upstream local-only inconsistency: it checks that an
auth value exists before entering its documented BYOK path, even when
`localOnly` is true. The launcher supplies the non-secret value
`local-only-placeholder` only to satisfy that local gate. Never use this
sentinel without `CMD_LOCAL_ONLY=1`. It is not a Command Code credential.

From this repository, reproduce the complete model-driven CMS demonstration:

```bash
bash scripts/run-command-code-ollama-demo.sh
```

The script creates an ephemeral CMS database and token, generates an ephemeral
Command Code MCP project, invokes one real Ability, and removes the temporary
state. It never writes the gateway token into project configuration.

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
- `Not authenticated` in local-only mode: launch with `cmd-ollama` or set both `CMD_LOCAL_ONLY=1` and the documented non-secret local sentinel workaround above.
- `approval_required`: use a trusted external approval flow; do not add an approval tool to the same agent.
- `unknown tool`: refresh discovery and confirm the principal is allowed to see the Ability surface.
- connection error: verify the application gateway is running and the inherited URL/token are present.
- plan mode: switch to an execution mode because Command Code hides MCP tools in plan mode.
- inspect the returned `receipt.invocation_id`, request/trace identifiers, status, policy decision, and audit metadata for correlation.

No lifecycle mod is shipped. Command Code's mod API is experimental and is not a security or completion-gating boundary.

## Verified live evidence

On 2026-09-13, Command Code 1.53.1 selected
`ollama/glm-5.3:cloud`, discovered `kujo-ability` over STDIO MCP, invoked
`mcp__kujo-ability__cms__site-info`, and received a succeeded canonical receipt
for `kujo.cms.site.inspect@1.0.0`. Server policy returned `allow`, the audit was
written, and the process exited successfully. See the sanitized
[`live evidence`](../../certification/evidence/command-code-ollama-live-2026-09-13.json)
and [proof video](../../demos/command-code-ollama-proof/command-code-ollama-kujo-proof.mp4).
