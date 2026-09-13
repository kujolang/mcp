# Command Code integration final report

## Outcome

Kujo can project portable capabilities into Command Code without rebuilding Kujo. The chosen production shape is Command Code → standard MCP → Ability Gateway → Ability runtime. The only Command Code-specific implementation is configuration recognition/templates; there is no adapter, mod, or duplicated primitive.

## Changed surface

- Command Code host detection, `.mcp.json` generation, and STDIO/HTTP templates.
- Package release version 1.2.0 and host certification/matrix coverage.
- Clean-profile installed Command Code 1.53.1 configuration test.
- Research, gap analysis, ADR, security model, user guide, and real workflow example.

## Validation and limitations

The generic bridge suite proves dynamic discovery, schema/effect fidelity, structured invocation/results, receipts, cancellation, approval enforcement, replay resistance, and idempotency conflict. Connector tests prove safe configuration lifecycle. Command Code 1.53.1 accepts and resolves the generated project server. Managed gateway tests cover HTTP MCP independently.

An authenticated model-driven invocation through the Command Code executable remains unproven because the clean environment has no Command Code login; the binary stops before MCP startup. Managed Ability Gateway arbitrary customer backend registration is also not generally available. Handler-level resumable cancellation, verified host/session/model/agent context, native worker negotiation, and Jidoka completion gating are outside Ability v1.

## Upstream assumptions and follow-up

Assumptions are Command Code's documented `.mcp.json`, STDIO/HTTP MCP, OAuth/PKCE, Agent Skills, and current permission behavior. Experimental mods are explicitly not assumed. Recommended follow-up is to certify one authenticated read and one approved mutation on every supported Command Code release, then design a generic fail-closed Host Capability/Completion Gate contract with at least one other host before building any lifecycle projection.

