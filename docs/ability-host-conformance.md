# Ability host conformance

All hosts consume the same principal-visible catalog and canonical execution receipt. Host-specific files improve installation and interaction; they do not fork an Ability definition.

The current machine-generated support tiers are in [the Ability host compatibility matrix](generated/ability-host-compatibility.md). Its source artifact records exact revisions, versions, commands, duration, and output digests; generation fails closed when a required row is missing, failed, future-dated, stale, or does not cover the current immutable Ability connector source.

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

The `1.1.1` package is a release-ready portable host. Its Agent Plugins 1.0 manifest, Codex companion files, Copilot custom-agent overlay, executable MCP bridge, and npm artifact shape are validated in this repository. A clean temporary Codex profile proves local marketplace discovery, install, enablement, disable/removal, and marketplace removal with `codex-cli 0.144.4`. VS Code 1.136.1 accepts the bridge in a clean temporary profile. The latest managed-host certificate records VS Code receiving the native localhost OAuth callback, performing the PKCE exchange, creating and restoring its refreshable session after restart, discovering both live tools at `ability.kujolang.ai`, and invoking `gateway_echo` through `vscode.lm.invokeTool` with a canonical receipt. The already-approved consent redirect had to be followed to the localhost callback outside the consent page, so a completely browser-driven consent round trip is not claimed.

| Surface | Status on 2026-09-03 | Evidence boundary |
| --- | --- | --- |
| Agent Plugins 1.0 package | Locally validated preview | Manifest, MCP configuration, paths, metadata, and package contents only |
| Codex plugin | Clean-profile install validated | `codex-cli 0.144.4` local marketplace add/list/install/remove lifecycle in an isolated `CODEX_HOME`; authenticated execution remains separately unproven |
| Cursor | Configuration lifecycle validated | Agent Plugin and manual `.cursor/mcp.json` configuration pass merge/disable/uninstall tests; no Cursor binary was available for an installed-host run |
| VS Code / Copilot | Native managed read-only smoke certified | VS Code 1.136.0 completed its native callback and PKCE exchange, restored the session after restart, discovered two tools, and invoked `gateway_echo`; a fully browser-driven consent redirect and the full mutating conformance suite remain separate gates |
| Generic MCP bridge | Contract tested | Real STDIO process against a mock authenticated gateway, including cancellation, approval, replay denial, and idempotency conflict |
| Kujo Pi | Existing native integration | Covered by its own repository and release process, not certified by this package |

“Compatible,” “certified,” and “supported” are not synonyms. A host becomes certified only after the authenticated end-to-end criteria below pass on a pinned host version and the result is recorded in a release artifact.

## Conformance checks

1. The portable manifest and MCP configuration pass repository contract checks, and the Codex companion manifest validates with the Codex plugin validator.
2. The bridge test starts a real STDIO child, performs initialization and discovery, calls a mock authenticated gateway, and checks token forwarding, identity metadata, adapter controls, invocation ID, idempotency header, receipt preservation, cancellation, approval-required denial, an approved write, one-time approval replay denial, and conflicting idempotency input denial.
3. The canonical MCP projection and executable gateway tests verify effect gates, private discovery, principal requirements, collision rejection, execution delegation, and receipt mapping.
4. The full MCP suite covers path, request, authentication, size, timeout, rate-limit, and generated-server boundaries.
5. The connector lifecycle exercises generic, Cursor, and VS Code configuration roots in isolated files, preserves unrelated settings, keeps secret values out of generated documents, and removes the managed server entry on disable and uninstall.

A host is conformant only when an authenticated end-to-end test also proves its enabled application Abilities, denial behavior, approval replay rejection, idempotency conflict handling, timeout/cancellation, redaction, and tenant isolation in the target environment.

No Cursor or Copilot hooks are bundled. The MCP server already owns discovery and execution, and an unconditional client hook would add local code execution without strengthening application authorization. Cursor-specific rules and commands are likewise omitted from the portable package; the shared skill and the Copilot custom agent provide the bounded guidance needed for the current preview.

Generic Streamable HTTP is not listed as certified because this package currently ships a STDIO bridge and no repeatable HTTP-host harness. An application gateway may expose HTTP separately, but that transport requires its own authentication, cancellation, isolation, and receipt evidence.

## Reproducible local evidence

Run from the `mcp` repository root:

```bash
node tests/portable_ability_plugin_test.mjs
node tests/ability_host_bridge_test.mjs
node tests/codex_clean_profile_test.mjs
node tests/vscode_managed_evidence_test.mjs
node tests/ability_compatibility_matrix_test.mjs
node tests/ability_package_release_test.mjs
npm pack --dry-run --json ./integrations/kujo-ability
bash tests/run_all_tests.sh
```

These commands establish package, clean-profile Codex installation, installed VS Code configuration, native managed VS Code read-only smoke evidence, and bridge contract evidence. They intentionally make no claim about a fully browser-driven consent redirect, public marketplace review, authenticated Codex execution, Cursor installation, mutating editor certification, or enterprise deployment.
