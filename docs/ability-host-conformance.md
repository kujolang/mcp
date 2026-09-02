# Ability host conformance

All hosts consume the same principal-visible catalog and canonical execution receipt. Host-specific files improve installation and interaction; they do not fork an Ability definition.

| Capability | Codex | Cursor | VS Code | Kujo Pi | Generic MCP |
| --- | --- | --- | --- | --- | --- |
| STDIO MCP bridge | Plugin-managed | MCP config | MCP config | Not required | MCP config |
| Dynamic Ability discovery | MCP `tools/list` | MCP `tools/list` | MCP `tools/list` | Native opt-in tool | MCP `tools/list` |
| Canonical execution | MCP `tools/call` | MCP `tools/call` | MCP `tools/call` | Native opt-in tool | MCP `tools/call` |
| Invocation/idempotency/approval controls | `_kujo` adapter object | `_kujo` adapter object | `_kujo` adapter object | Typed native parameters | `_kujo` adapter object |
| Host guidance | Bundled skill and starter prompts | Repository/user rules may be added | Agent Plugin or workspace instructions may be added | Capability hints and Pi approval UI | Host-owned |
| Secret input | Host environment | Environment reference | Password input | Environment/secret manager | Host-owned |
| Independent host approval | Bundled guidance; host policy | Host policy | Host policy | Required by the native tool | Host policy |
| Server authorization and receipt | Required | Required | Required | Required | Required |

The bridge implements MCP `initialize`, `ping`, `tools/list`, and `tools/call` against protocol version `2025-11-25`. Client-specific prompts, resources, roots, elicitation, interactive UI resources, and enterprise administration remain optional additive features. They are not required for operation parity because Abilities are tools, but any package that adds them must pass the canonical identity and receipt checks.

## Conformance checks

1. The plugin manifest validates with the Codex plugin validator.
2. The bridge test starts a real STDIO child, performs initialization and discovery, calls a mock authenticated gateway, and checks token forwarding, identity metadata, adapter controls, invocation ID, idempotency header, and receipt preservation.
3. The canonical MCP projection and executable gateway tests verify effect gates, private discovery, principal requirements, collision rejection, execution delegation, and receipt mapping.
4. The full MCP suite covers path, request, authentication, size, timeout, rate-limit, and generated-server boundaries.

A host is conformant only when an authenticated end-to-end test also proves its enabled application Abilities, denial behavior, approval replay rejection, idempotency conflict handling, timeout/cancellation, redaction, and tenant isolation in the target environment.
