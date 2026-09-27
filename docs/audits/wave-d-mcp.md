# Wave D MCP Ability — pre-implementation audit

2026-09-27 fetched main: MCP07845898ee9f2662d0e0e364973d77cdaac04762;
Abilityca9acea544e9a8a806f1f09d42b4ca7b5299bd18;
Dispatche1aabd952eec8b7e9ccd16e5b68818b78bdc81c3;
Kujo297cbfd3c4c3c9ece689f6299a2197bd02f23885. Worktrees clean.

| Identity/surface | Existing source | Ownership |
| --- | --- | --- |
| JSON-RPC ID | integrations/kujo-ability/bin/kujo-ability-mcp.mjs replies/cancellation/inflight | client protocol correlation, never authority |
| Gateway request ID | gateway() generates x-request-id UUID for each HTTP request | MCP transport, distinct from invocation |
| Tool call | tools/call name/arguments; no independent durable call ID yet | MCP lifecycle; arguments client assertions |
| Server/session | initialize has fixed name/version; no durable STDIO session | host process; controlled host must install identity |
| Ability invocation/key | callTool reads optional client _kujo or generates invocation UUID | standalone attribution/idempotency request, NOT principal authentication |
| Ability receipt | HTTP bridge returns gateway data; Kujo gateway returns receipt privately plus summary/error/result | Ability application facts, not replay authority |
| Principal/tenant | application HTTP authentication; Kujo gateway requires server_context.principal and delegates services | application authentication; JSON fields alone are not trusted |
| Definition/schema | src/abilities/projection.kujo canonical Ability package, explicit enabled/allowed_effects; Node catalog checks identity/schema shape | Ability identity; application tool exposure |
| Dispatch/effect/transaction | absent from current MCP bridge | host/controller and Ability, must remain distinct |
| Retry/error | one fetch per operation; AbortController cancellation, no retry loop; error mapping may expose gateway message | transport lifecycle; controlled mode needs redaction/uncertainty |
| Telemetry | src/telemetry/watchdog.kujo metadata-only native MCP event helper; no automatic transport delivery | observation only |

Plan: preserve default STDIO entrypoint and standalone behavior. Add an imported
host-installed controlled callback option to the same bridge (Node is the existing
transport language). A sibling bounded MCP handoff contract carries exact-byte
references. No client/env module loading and no Dispatch imports in MCP. Controller
fixture issues one-use tickets and application-owned admission checks; existing
Ability gateway performs the real business mutation. Dispatch correlates before
its existing locked beta resolver; no second verifier or replay policy. Actual
STDIO child, controller replacement, receipt failure, duplicate/stale requests,
transport loss and standalone replay must be exercised. Canonical MCP/Ability/
Dispatch gates and Kujo docs checks follow. Remote transport auth remains excluded.
