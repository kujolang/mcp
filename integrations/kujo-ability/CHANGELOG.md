# Changelog

## 1.3.0 - 2026-10-02

- Refresh host and package certification for the MCP 1.3.0 release.
- Preserve the application-owned Ability gateway, approval, and receipt contracts.

## 1.2.0 - 2026-09-29

- Add experimental local controlled STDIO participation with host-only admission and content-light evidence references. Dispatch retains replay authority.
- Require Kujo 1.6 for the framework and retain application-owned authorization for the host bridge.


- Remove in-band MCP approval issuance; approvals must now come from a trusted host or out-of-band UI.
- Bind compatibility evidence to the certified Ability connector source and make required Codex certification fail closed.

## 1.1.1 - 2026-09-04

- Preserve executable modes for the CLI and MCP bridge launchers in npm packages.
- Refresh release metadata and current host compatibility evidence.

## Next preview

- Add generated, freshness-gated host compatibility evidence and isolated lifecycle coverage for primary host configurations.

## 1.1.0 - 2026-09-02

- Add the portable Agent Plugins 1.0 manifest and MCP configuration.
- Add Codex, Cursor, VS Code/Copilot, and generic MCP package surfaces.
- Add a secret-safe connector lifecycle for connect, diagnostics, disable, and uninstall.
- Add MCP request cancellation and deterministic package and lifecycle tests.
- Preserve the Codex-native manifest and existing STDIO bridge.

## 1.0.1

- Add explicit invocation, idempotency, and approval adapter controls.

## 1.0.0

- Initial Codex plugin, host configurations, skill, and STDIO bridge.

## Unreleased

- Experimental imported `startAbilityMcp` host callback mode for controlled local
  Ability execution. Default CLI/standalone behavior is unchanged. Controlled
  mode returns bounded evidence references and never authorizes replay.
