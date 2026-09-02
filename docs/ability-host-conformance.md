# Ability host conformance

All hosts consume the same principal-visible catalog and canonical execution receipt. Host-specific files improve installation and interaction; they do not fork an Ability definition.

## Compatibility surface

| Capability | Codex | Cursor | VS Code / Copilot | Kujo Pi | Generic MCP |
| --- | --- | --- | --- | --- | --- |
| STDIO MCP bridge | Plugin-managed | MCP config | MCP config | Not required | MCP config |
| Dynamic Ability discovery | MCP `tools/list` | MCP `tools/list` | MCP `tools/list` | Native opt-in tool | MCP `tools/list` |
| Canonical execution | MCP `tools/call` | MCP `tools/call` | MCP `tools/call` | Native opt-in tool | MCP `tools/call` |
| Invocation/idempotency/approval controls | `_kujo` adapter object | `_kujo` adapter object | `_kujo` adapter object | Typed native parameters | `_kujo` adapter object |
| Host guidance | Bundled skill and starter prompts | Portable Agent Plugin | Portable Agent Plugin plus Copilot custom agent | Capability hints and Pi approval UI | Host-owned |
| Secret input | Host environment | Environment reference | Password input | Environment/secret manager | Host-owned |
| Independent host approval | Bundled guidance; host policy | Host policy | Host policy | Required by the native tool | Host policy |
| Server authorization and receipt | Required | Required | Required | Required | Required |

The bridge implements MCP `initialize`, `ping`, `tools/list`, `tools/call`, and request cancellation against protocol version `2025-11-25`. Client-specific prompts, resources, roots, elicitation, interactive UI resources, and enterprise administration remain optional additive features. They are not required for operation parity because Abilities are tools, but any package that adds them must pass the canonical identity and receipt checks.

## Current support level

The `1.1.0` package is a local, unpublished preview. Its Agent Plugins 1.0 manifest, Codex companion files, Copilot custom-agent overlay, MCP bridge, and npm artifact shape are validated in this repository. That evidence does **not** certify installation or authenticated execution in Codex, Cursor, VS Code, GitHub Copilot, or a production Kujo gateway.

| Surface | Status on 2026-09-02 | Evidence boundary |
| --- | --- | --- |
| Agent Plugins 1.0 package | Locally validated preview | Manifest, MCP configuration, paths, metadata, and package contents only |
| Codex plugin | Locally validated preview | Codex manifest validator and repository contract tests; no installed-host run |
| Cursor | Portable-format candidate | Agent Plugin files and configuration only; no Cursor-host run |
| VS Code / Copilot | Portable-format candidate | Agent Plugin files and custom-agent metadata only; no extension-host run |
| Generic MCP bridge | Contract tested | Real STDIO process against a mock authenticated gateway, including cancellation |
| Kujo Pi | Existing native integration | Covered by its own repository and release process, not certified by this package |

“Compatible,” “certified,” and “supported” are not synonyms. A host becomes certified only after the authenticated end-to-end criteria below pass on a pinned host version and the result is recorded in a release artifact.

## Conformance checks

1. The portable manifest and MCP configuration pass repository contract checks, and the Codex companion manifest validates with the Codex plugin validator.
2. The bridge test starts a real STDIO child, performs initialization and discovery, calls a mock authenticated gateway, and checks token forwarding, identity metadata, adapter controls, invocation ID, idempotency header, receipt preservation, and cancellation.
3. The canonical MCP projection and executable gateway tests verify effect gates, private discovery, principal requirements, collision rejection, execution delegation, and receipt mapping.
4. The full MCP suite covers path, request, authentication, size, timeout, rate-limit, and generated-server boundaries.

A host is conformant only when an authenticated end-to-end test also proves its enabled application Abilities, denial behavior, approval replay rejection, idempotency conflict handling, timeout/cancellation, redaction, and tenant isolation in the target environment.

## Reproducible local evidence

Run from the `mcp` repository root:

```bash
node tests/portable_ability_plugin_test.mjs
node tests/ability_host_bridge_test.mjs
npm pack --dry-run --json ./integrations/kujo-ability
bash tests/run_all_tests.sh
```

These commands establish package and bridge contract evidence. They intentionally make no claim about registry publication, marketplace review, host certification, a production gateway, or enterprise deployment.
