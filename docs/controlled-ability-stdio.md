# Controlled local STDIO Ability tools

Experimental, opt-in and unreleased. The default packaged STDIO entrypoint and
standalone `_kujo` behavior are unchanged. No environment variable or JSON-RPC
argument loads a controller, verifier, configuration file or module.

An operator imports `startAbilityMcp({control, gatewayTransport})` from the existing
bridge. `gatewayTransport` is optional; the default is the existing authenticated
application HTTP gateway. The offline embedding uses an authenticated local Kujo
application subprocess. This is a host-selected transport, not a client-selected
executable. The bridge remains Node because this is its existing implementation
language; application execution, assurance and Dispatch remain Kujo-owned.

## Host callbacks

`control` requires `server_id`, `session_id`, `admit(context, input)` and
`record(admission, context, privateGatewayData, outcome)`. Optional `observe` receives
only bounded protocol identity and outcome. It cannot affect admission. The host
must authenticate application identity outside client JSON, validate input against
admitted intent and atomically claim a one-use ticket. The host must recheck its
current ticket/expiry before invoking the application. A retry requires a fresh
Dispatch-admitted attempt; MCP never requests or authorizes replay.

`admit` returns `ok`, stable `ability_invocation_id` and application
`idempotency_key`. Each call gets a new MCP request UUID (also forwarded as the
execution HTTP request header) and a distinct tool invocation UUID. The RPC ID is
client protocol attribution only. Controlled RPC IDs are bounded ASCII strings;
numeric IDs remain supported by standalone behavior, not this experimental domain.
Server/session identities come from host configuration, not `initialize` arguments.

`record` privately persists validated receipt/result/correlation and returns
`ok` plus a `sha256:` reference. The host must validate the receipt's canonical
identity before publishing authoritative evidence. The transport performs no beta
verification. Application exceptions and private receipts are never returned by
controlled mode. Its published output schema describes the bounded reference
result, not the application's private output schema. Denials use `not_admitted`;
post-invocation failure stays uncertain, distinguished as `receipt_failed`,
`application_failed`, `transport_failed`, or unavailable receipt. Receipt success
is reported success, not verified assurance. Evidence-store failure cannot authorize
retry. STDIO loss is detected by the caller as no response, not a business failure.

Controlled mode rejects `_kujo`, Dispatch IDs, profile/verifier/configuration,
principal/tenant, evidence path/root/reference and replay-authority fields in client
arguments. It accepts at most 8192 UTF-8 bytes per wire request and 4096 per input.
The host still must validate the application input schema and exact admitted intent.

## Evidence contract

`mcp.ability-handoff/v1alpha1` is MCP-owned, closed and at most 4096 UTF-8 bytes.
`schema/mcp-ability-handoff-v1alpha1.schema.json` describes its shape; semantic
validation additionally pairs nullable receipt ID/reference and requires a receipt
for receipt outcomes. All IDs are ASCII, at most128 characters; no newline.

Distinct fields: `mcp_server_id`, `mcp_session_id`, `rpc_request_id`,
`mcp_request_id`, `mcp_invocation_id`, `tool_name`; Ability identity/version,
definition digest/invocation/receipt; Dispatch run/step/attempt/effect; bounded
outcome, transaction digest and receipt/result/assurance references. No payload,
principal, credential, filesystem path, URL or verifier authority belongs here.

References are lowercase `sha256:` plus64 hex digits of exact retained bytes.
Original bytes must be retained; reserialization changes identity. The example
uses sorted ASCII JSON keys without whitespace, matching Dispatch's bounded reader.
Assurance may initially be null. Attaching it publishes a new immutable handoff;
old bytes remain. The receipt remains private. A matching handoff is not permission.

Dispatch's `load_mcp_ability_handoff` checks exact correlation and confined artifact
integrity before its existing locked persisted beta resolver/live Ability verifier
and v1 replay policy. MCP neither implements that verifier nor depends on Dispatch.

## Real fixture and scope

`examples/controlled-ability/server.mjs` embeds the actual STDIO server around
Ability's real authenticated SQLite publication gateway. Dispatch's
`tests/mcp_ability_integration.mjs` runs separate controller/client/server/verifier
processes through business-commit/receipt-failure and loss-before-reply scenarios.
One-use tickets survive process exit; stale/expired tickets cannot reach the gateway.
Normal standalone mode still calls the same application and replays its receipt.

The existing published Ability beta profile intentionally identifies its application
API surface as `sdk`. MCP is the outer protocol participant calling that unchanged
application gateway; no Agents SDK process is involved and no profile field is
relabeled to `mcp`. A native application profile for a different surface would need
owner-defined validation. This slice does not claim it.

The fixture invokes existing `watchdog_mcp_tool_lifecycle` for metadata-only tool
observations; usage stays null. Process loss can leave an observation gap, which
never becomes evidence of no effect. No new event bus, remote MCP authentication,
hostile-operator isolation, universal rollback, exactly-once or machine-loss recovery
is claimed. Client/server calls have no automatic retry loop. Existing application
idempotency, not RPC ID reuse, protects the business action.
