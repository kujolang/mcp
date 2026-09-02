# Ability host deployment

The v1.0.1 host package supports one executable topology: an MCP client starts the packaged STDIO bridge, and the bridge calls an application-owned Ability gateway over loopback HTTP or HTTPS. Kujo CMS is the reference gateway. The bridge never loads application handlers or credentials into an Ability definition.

## Supported profiles

### Local

Run the application gateway on loopback, set `KUJO_ABILITY_GATEWAY_URL`, and start the bridge from Codex, Cursor, VS Code, Kujo Pi, or another STDIO MCP host. HTTP is accepted only for `localhost`, `127.0.0.1`, or `::1`.

### Customer-hosted

Deploy the application gateway inside the customer's environment and connect each host bridge over HTTPS. Store `KUJO_ABILITY_GATEWAY_TOKEN` in the host secret manager. Give each human or workload a distinct, least-privilege, short-lived token so discovery and execution can be attributed and revoked independently.

### Managed

A managed gateway can implement the same catalog and execution endpoints, but a shared public service needs OAuth 2.1 authorization-code flow with PKCE, protected-resource metadata, audience validation, tenant-scoped discovery, token revocation, quotas, region and retention controls, and an operator support boundary. Those controls are not supplied by this repository. Until they are deployed and independently validated, do not advertise a public privileged Ability endpoint.

`mcp.kujolang.ai` remains the public read-only ecosystem catalog. Do not reuse it for customer credentials or mutating operations. A future managed execution service should have a separate origin and threat model.

## Required controls

- Authenticate before tool discovery and return only principal-visible operations.
- Authorize every invocation again; catalog visibility is not execution permission.
- Scope identities, approvals, idempotency keys, receipts, quotas, and audit queries by tenant and subject.
- Bind one-time approvals to the exact Ability ID, version, definition digest, invocation ID, principal, and normalized input.
- Require keyed idempotency for retryable writes and reject key reuse with different input.
- Enforce network egress, filesystem roots, subprocess policy, hard timeouts, cancellation, response limits, and concurrency limits at the handler boundary.
- Keep tokens, prompts, raw private content, and handler secrets out of tool descriptors, logs, and receipts.
- Record definition and binding digests, policy decision, approval consumption, timing, status, and redacted error data.
- Rate-limit discovery and execution separately. Alert on denial spikes, approval replay, idempotency conflicts, timeouts, and repeated handler failures.
- Publish an incident, backup, restore, key-rotation, tenant-export, tenant-deletion, and disaster-recovery procedure before production onboarding.

## Release gate

Before promoting an adapter or gateway, run the MCP suite, canonical Ability consumer conformance, host-package test, plugin validation, an authenticated end-to-end test for each enabled Ability, denial and approval-replay tests, idempotency conflict tests, cancellation and timeout tests, secret-redaction tests, and a tenant-isolation test. Re-run the host matrix for Codex, Cursor, VS Code, Kujo Pi, and one generic MCP inspector whenever the MCP protocol version or client configuration changes.

Host-specific features such as prompts, skills, roots, elicitation, UI resources, and enterprise administration can improve installation and user experience. They must remain additive projections. An operation's schemas, effects, policy boundary, and receipt meaning stay in Kujo Ability and the owning application.
