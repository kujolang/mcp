# Kujo Ability 1.1.0 preview evidence

Evidence date: 2026-09-02

Package artifact source revision: `ed4d190a04c1283b77e0ac388ea7568632e2da90`

Clean-profile Codex lifecycle source revision: `ad39b35`

Release status: unpublished, unsigned preview

## Package evidence

Command:

```bash
node scripts/package-kujo-ability.mjs --output dist/kujo-ability --verify-reproducible
```

Result:

- `kujo-ability-1.1.0.tgz`: `55a16c39412cbe224cebdbaf0b552fad2123e23fc69f2f126ea5954ad543d3e5`
- `kujo-ability-1.1.0.spdx.json`: `10cce0a94d96ea400df48dfc99ff9cb59570492dc90a601876cdf5c990813ff4`
- package entries: 17
- two independent `npm pack --ignore-scripts` runs were byte-for-byte identical
- an unsigned SLSA provenance statement was generated for the source revision; it is not a signature or registry attestation

## Validation evidence

The following passed from the source revision:

```bash
KUJO_BIN=/Users/robertdevore/2026/Kujolang/kujo-repos/kujo/target/release/kujo bash tests/run_all_tests.sh
node tests/portable_ability_plugin_test.mjs
node tests/ability_contract_drift_test.mjs
node tests/ability_connector_cli_test.mjs
node tests/ability_host_bridge_test.mjs
node tests/codex_clean_profile_test.mjs
node tests/vscode_managed_evidence_test.mjs
node tests/ability_package_release_test.mjs
```

The Codex plugin validator passed with zero warnings. A clean temporary profile on `codex-cli 0.144.4` passed local marketplace discovery, plugin install/enable, removal, and marketplace removal. PackWrite validation passed with zero warnings for the generated `agent/` pack. The official Agent Plugins 1.0 schema snapshots checked on this date had SHA-256 digests:

- `plugin.schema.json`: `0a4aad95ce337878ad38802ebf0daa3fde76abe3f65400c86bcbb1ec0b3ab883`
- `mcp.schema.json`: `6539175bfcdf43085855183e86da40ea94b166547a72b47ae9a0a390516d3acb`

## Evidence boundary

This evidence proves repository tests, package structure, connector lifecycle behavior against temporary files, a clean-profile Codex installation lifecycle, clean-profile registration by VS Code 1.136.0, a live managed-gateway VS Code `gateway_echo` smoke invocation, an authenticated mock-gateway bridge contract, deterministic archive generation, SBOM generation, and unsigned provenance metadata. It does not prove npm publication, signature verification, public marketplace review, native VS Code URL-handler OAuth completion, authenticated execution from Codex, installation in Cursor, or enterprise certification.
