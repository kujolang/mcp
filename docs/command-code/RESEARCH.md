# Kujo Ability and Command Code research

Research was performed on 2026-09-13 against Kujo `ability` at `fe6775d27b1742196e16f6c46f73c6cec906fe73`, `ability-gateway` at `d7934e267826aba2525c042e56cc6e74a460e547`, `agents-sdk` at `bb2202d8b54f44717b1b1f0157a6774f2027cea1`, `kujo-pi` at `9d977bdda760830e3cb00c1e0e756ab2d9acfe1e`, and this repository's pre-change revision `07845898ee9f2662d0e0e364973d77cdaac04762`.

Command Code was inspected from the official npm package `command-code@1.53.1` (published 2026-09-11; npm integrity `sha512-vjBqxjX8I/TDE4BvPxni3kUXG5w7V/4le3N6A/NVtSwcAObXWviIy/4asbIlE9qXH5NkekTtzNtCOfbDEHcDRg==`) and the public repository at commit `5c8f1b48`. The npm distribution is newer and contains the current executable, bundled implementation, documentation, examples, and changelog; the public repository exposes little implementation source. Official references: [MCP](https://commandcode.ai/docs/mcp), [mods](https://commandcode.ai/docs/mods), [hooks](https://commandcode.ai/docs/hooks), [agents](https://commandcode.ai/docs/agents), [skills](https://commandcode.ai/docs/skills), [sessions](https://commandcode.ai/docs/sessions), [permissions](https://commandcode.ai/docs/permissions), [settings](https://commandcode.ai/docs/settings), [tools](https://commandcode.ai/docs/reference/tools), [release notes](https://commandcode.ai/docs/whats-new), [source repository](https://github.com/CommandCodeAI/command-code), and [Agent Skills repository](https://github.com/commandcodeai/agent-skills).

## Actual Ability execution model

The contract is implemented, not merely described, in `ability/src/contract.kujo`, `contracts.kujo`, `registry.kujo`, and `runtime.kujo`.

1. An Ability is a `kujo.ability/v1` definition with stable ID, semantic version, input/output JSON Schemas, declared effects, handler reference/version, and idempotency mode.
2. Registry resolution is by exact ID and version. Exposure is separately scoped by surface, so discovery is not authority.
3. An invocation supplies principal, request and trace IDs, surface, optional idempotency key and approval, input, and metadata.
4. Runtime preflight records audit data, resolves policy fail-closed, validates schema, verifies and consumes approvals, and enforces keyed idempotency before dispatching the handler.
5. The handler owns Kujo behavior. The transport cannot substitute another implementation.
6. Output is schema-validated. Runtime returns a normalized `kujo.ability.receipt/v1` containing definition and handler identities/digests, status, result or structured error, policy and approval decisions, idempotency, principal, timing, request/trace/surface, audit, and metadata.
7. Cancellation is checked before handler dispatch. Adapters may hard-cancel transport work, but Ability v1 does not promise resumable handler interruption. Timeout is recognized after a handler returns; it is not universal process preemption.
8. Retry, persistence, sessions, and durable application state belong to the invoking application/service. Keyed idempotency makes safe retry expressible; Ability itself is not a workflow database.

Identity preserved by the contract includes ability, handler, principal, invocation, request, trace, surface, approval, receipt, and definition digest. Host, session, agent, model, tool, and parent/child run identities can be carried in principal or invocation metadata, but Ability v1 does not define first-class fields for all of them. The Agents SDK already uses correlation metadata containing `run_id`, `session_id`, `agent_id`, and `tool_name` in `agents-sdk/src/agents/abilities/contract.kujo`.

## Architectural map

```text
Command Code (host/session/model/agent)
  ↓ standard MCP client                         host-specific
MCP HTTP or STDIO projection                    transport-specific
  ↓ tool discovery/call/cancel
Ability Gateway / application gateway           Kujo transport boundary
  ↓ exact definition + invocation
Ability registry/runtime                        universal Kujo semantics
  ↓ policy → approval → schema → handler
Kujo primitive/application handler              Kujo-specific behavior
  ↓ result/error/effects/receipt/artifacts
Ability receipt → MCP structuredContent         universal → transport projection
  ↓
Command Code tool result                        host-specific rendering
```

Universal: identity, schemas, declared effects, policy, approvals, invocation, idempotency, receipt/error contract, provenance. Transport-specific: MCP initialization, naming, `_meta`, `structuredContent`, cancellation notification, OAuth or child-process launch. Host-specific: configuration location, UI, session and agent graph, model/provider identity, local permission prompts, lifecycle hooks. Kujo-specific: Spec, Eval, Dispatch, RunLedger, Watchdog, Shipcheck, Fence, Muzzle, Leash, Jidoka, and all primitive handlers.

## Gateways and projections

The managed `ability-gateway` exposes Streamable HTTP MCP at `/mcp`, OAuth 2.1 authorization-code flow with PKCE, principal-visible discovery, approval APIs, idempotency, audit, and persisted D1/KV state. Its current deployment is a controlled beta whose tools are seeded fixtures; customer Ability registration and arbitrary backend execution are not yet a general service feature.

The portable bridge in `integrations/kujo-ability/bin/kujo-ability-mcp.mjs` is an STDIO MCP projection for application-owned REST Ability gateways. It dynamically reads `/v1/ai/mcp/tools`, preserves exact schemas, output schemas, annotations, Ability identity/digest/effects in MCP `_meta`, forwards invocation and idempotency identity, accepts only externally issued approval IDs, returns canonical receipts as structured content, propagates cancellation, bounds responses, and rejects non-loopback plaintext gateways. It contains no Kujo primitive logic.

New Ability definitions therefore flow through registry → gateway discovery → `tools/list` without a Command Code release. No per-tool registration was added.

## Existing host integrations

| Integration | Portable Ability path | Truly host-specific | Historical duplication / lesson |
| --- | --- | --- | --- |
| Agents SDK | Native definition-to-tool projection and gateway calls | Agent/run/session correlation | Strong model: preserve metadata while Ability remains authoritative. |
| Kujo Pi | `kujo_ability_list` and `kujo_ability_call` | UI commands, project trust, tool activation, session lifecycle telemetry | Mixture. Numerous direct CLI tool adapters, local approvals, and receipts predate Ability and must not be copied. |
| Codex/Cursor/VS Code | Same dynamic MCP bridge or managed HTTP MCP | Packaging and configuration | Thin projections survive host changes because semantics remain server-side. |

Pi is therefore option C: useful current Ability projection plus compatibility-era direct tools. Its lifecycle telemetry and trust handling are reusable lessons; its duplicated primitive adapters are not a template.

## Command Code surfaces

- MCP: project `.mcp.json`, user/local configuration, STDIO and HTTP transports; official docs also describe SSE compatibility and OAuth/PKCE for remote servers. Tools are dynamically named `mcp__<server>__<tool>`. MCP tools are hidden in plan mode. Cancellation, progress, timeouts, annotations, and full results are supported.
- Agent Skills: open Agent Skills plus `.agents/skills`, `.commandcode/skills`, and explicit `--skill`. Kujo's canonical skills can be consumed directly or linked/generated from one source.
- Agents: built-in and custom agents, isolated contexts, model/tool selection, parallel background execution, and one subagent nesting level. Kujo Dispatch should remain authoritative for Kujo workflows; host agents are local workers, not a replacement chain of command.
- Stable shell hooks: `PreToolUse`, `PostToolUse`, `Stop`, and `SessionStart`. Stop hooks may block completion, but retries are capped at three and hooks are skipped in plan mode.
- Mods: experimental in 1.53.1. They can add tools, commands, providers, renderers, context/system-prompt transforms, before/after-tool hooks, turn/run/stop hooks, event listeners, and continuation decisions. Project mods execute unsandboxed after trust. Hook errors generally fail open. This is not a sound authorization boundary.
- Permissions: host deny/ask rules govern local execution and named MCP tools. They do not mint Kujo approval evidence and cannot bypass server policy.
- Sessions: JSONL persistence, resume/reload/fork/tree. No standard MCP field exports native session/model/agent hierarchy to a server.

## Compatibility matrix

| Command Code capability | Ability equivalent | Works today? | Gap | Host-specific value |
| --- | --- | --- | --- | --- |
| MCP tool discovery | Surface-scoped Ability registry | Yes | Managed beta has fixture-only backend registration | None |
| STDIO MCP | Portable REST bridge | Yes | None | Configuration only |
| HTTP MCP + OAuth | Managed Ability Gateway | Yes, controlled beta | General customer backend registration | Configuration only |
| JSON input/output schemas | Ability schemas | Yes | None | None |
| Structured errors/results | Receipt and error | Yes | Host rendering varies | None |
| Effects | Definition effects + receipt | Yes in `_meta`/receipt | Host UI does not enforce Kujo effects | Display only |
| Approval | Runtime policy/approval | Yes, out of band | Command Code prompt cannot mint Kujo approval | Optional trusted UI bridge later |
| Cancellation | MCP cancellation + adapter abort | Partial | Handler-level interruption/resume is not universal | Transport cancellation |
| Idempotent retry | Ability idempotency | Yes | Host does not automatically reuse keys | Optional invocation metadata |
| Session continuity | Application persistence + receipts | Partial | Host session identity is not first-class over MCP | Generic host context contract |
| Lifecycle hooks | No Ability equivalent | No | Bidirectional host lifecycle contract | Potentially material |
| Completion gate/Jidoka | No Ability equivalent | No | Stable fail-closed completion protocol | Material but not safe in current mods |
| Native agents/subagents | Dispatch/Chain of Command | Parallel concepts | No negotiated worker contract | Local worker utilization |
| Skills | Canonical Agent Skills | Yes | Host-specific install ergonomics | Minimal |
| Telemetry/events | Receipts/audit/run metadata | Partial | Host turn/model/context events are local | Generic telemetry bridge |
| Model/provider identity | Metadata convention | Partial | Not first-class/verified | Generic host context contract |

## Experimental result

Command Code 1.53.1 was run in a clean temporary project. Its CLI accepted the generated `.mcp.json`, reported `kujo-ability` as an enabled project-scoped STDIO server, and resolved the exact executable/arguments. The shared bridge contract test then proved dynamic discovery, schema/effect metadata, structured read invocation, receipt correlation, cancellation, approval denial, absence of self-approval, externally approved mutation, replay denial, and idempotency conflict. The managed HTTP gateway suite separately covers Streamable HTTP behavior.

A model-driven run was completed on 2026-09-13 with Command Code 1.53.1,
Ollama 0.34.0, and `ollama/glm-5.3:cloud`. Command Code discovered the generic
STDIO projection and invoked the real CMS `kujo.cms.site.inspect` Ability. The
result preserved the Ability/version, server policy outcome, audit state,
invocation ID, definition digest, and canonical receipt ID. Sanitized evidence
is checked in at
[`certification/evidence/command-code-ollama-live-2026-09-13.json`](../../certification/evidence/command-code-ollama-live-2026-09-13.json).

The experiment also found two implementation facts absent from the optimistic
documentation reading. First, Command Code 1.53.1 still requires an auth value
before entering local-only BYOK execution. `CMD_LOCAL_ONLY=1` plus a non-secret
sentinel satisfies the gate without a Command Code account session; this is a
workaround, not a credential. Second, the host's model route appears in event
telemetry but is not injected as trustworthy model self-knowledge: GLM 5.3
incorrectly described itself as Claude when asked. Therefore evidence takes
model identity from `model_request_start`, and Kujo still does not receive a
trustworthy host/model identity envelope through generic MCP.

The first live discovery attempt also exposed a generic bridge defect: valid
object schemas may omit `properties` while setting `additionalProperties`.
The bridge previously rejected that shape. Its validation and projection now
accept it, with a regression fixture in `ability_host_bridge_test.mjs`.
