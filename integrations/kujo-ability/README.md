# Kujo Ability portable plugin

This preview package connects Agent Plugins 1.0 clients, Codex, Cursor, VS Code, and other STDIO MCP hosts to an application that exposes the Kujo Ability gateway contract. It does not contain credentials or weaken application policy.

## Package layouts

- `plugin.json`, `mcp.json`, and `skills/` are the portable [Agent Plugins 1.0](https://agent-plugins.org/specification) package.
- `.codex-plugin/plugin.json` and `.mcp.json` are the Codex-native compatibility package.
- `host-configs/` contains equivalent host configuration examples.

Portable clients expand `${PLUGIN_ROOT}` in `mcp.json`; the package never embeds a developer-machine path. Agent Plugins 1.0 intentionally defines no portable credential field, so credentials must come from the host environment or its approved secret store.

Set `KUJO_ABILITY_GATEWAY_URL` to the application origin and `KUJO_ABILITY_GATEWAY_TOKEN` to a least-privilege bearer token. Loopback HTTP is allowed for local development; every non-loopback gateway must use HTTPS.

Codex can install the directory as a plugin. Cursor and VS Code can load the root Agent Plugin or use the equivalent configurations under `host-configs/`. The bridge supports MCP `initialize`, `ping`, `tools/list`, `tools/call`, and request cancellation, plus canonical receipts, request timeouts, bounded responses, keyed idempotency, and optional server-bound approvals.

Each projected tool adds an optional `_kujo` adapter-control object for `invocationId`, `idempotencyKey`, and `approvalId`. The bridge removes that object before canonical input validation, so the domain schema and handler input remain unchanged.

Approval issuance is disabled by default. Set `KUJO_ABILITY_ALLOW_APPROVALS=1` only when the host can collect explicit user confirmation and the bearer token is authorized for `admin.settings`.

This v1.1.0 preview bridge targets the current CMS gateway endpoints. The `kujo-ability` npm name was unclaimed when checked on 2026-09-02, but this package has not been published. Do not use an `npx kujo-ability` installation command until a signed release is published and verified. A hosted multi-tenant gateway should expose the same contract behind OAuth 2.1 and must not reuse the public read-only ecosystem catalog at `mcp.kujolang.ai`.

## Connector lifecycle

From a verified local package checkout, the connector can merge a Kujo-owned MCP entry into an explicit host configuration without storing the bearer token:

```bash
export KUJO_ABILITY_GATEWAY_URL=https://cms.example.com
export KUJO_ABILITY_GATEWAY_TOKEN='provided-by-your-secret-manager'
node bin/kujo-ability.mjs connect --host generic --output ./mcp.json
node bin/kujo-ability.mjs doctor --output ./mcp.json
node bin/kujo-ability.mjs disable --output ./mcp.json
node bin/kujo-ability.mjs uninstall --output ./mcp.json
```

Supported host selectors are `codex`, `cursor`, `vscode`, `generic`, and `auto`. Project scope uses documented project-local defaults; user scope requires `--output` so the connector never guesses at or overwrites user settings. Codex normally uses the bundled plugin; manual Codex connector output also requires `--output` and inherits gateway variables rather than persisting them. Automatic detection therefore selects Cursor or VS Code when their CLIs are present and otherwise emits a generic MCP configuration. `connect` preserves unrelated JSON keys and servers, verifies the gateway by default, and reports only principal-visible tool names. `--skip-health` exists for offline packaging tests and does not prove a working connection.

## Local verification

```bash
node bin/kujo-ability.mjs version
node ../../../tests/portable_ability_plugin_test.mjs
node ../../../tests/ability_host_bridge_test.mjs
node ../../../scripts/package-kujo-ability.mjs --verify-reproducible
```

Set gateway variables only in the process that starts the bridge. Diagnostics and test output must never print the token.

The packaging command emits a byte-for-byte reproducibility result, versioned npm archive, `SHA256SUMS`, SPDX 2.3 SBOM, and unsigned SLSA provenance statement under `dist/kujo-ability/` by default. CI repeats the build. The provenance statement is metadata, not a signature; signed attestations and registry publication remain release-authorized external actions.

See [`../../docs/ability-host-deployment.md`](../../docs/ability-host-deployment.md) for local, customer-hosted, managed-service, security, operations, and release-gate requirements.
