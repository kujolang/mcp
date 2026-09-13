# Command Code integration final report

## Outcome

Kujo can project portable capabilities into Command Code without rebuilding Kujo. The chosen production shape is Command Code → standard MCP → Ability Gateway → Ability runtime. The only Command Code-specific implementation is configuration recognition/templates; there is no adapter, mod, or duplicated primitive.

This is now proven with an actual model, not only configuration and protocol
fixtures: Command Code 1.53.1 routed a request to
`ollama/glm-5.3:cloud`, called a real CMS Ability through the generic STDIO
bridge, and received a canonical succeeded receipt. No Command Code account
session was used. See the
[`live evidence`](../../certification/evidence/command-code-ollama-live-2026-09-13.json)
and [BB Kujo-themed proof video](../../demos/command-code-ollama-proof/command-code-ollama-kujo-proof.mp4).

## Changed surface

- Command Code host detection, `.mcp.json` generation, and STDIO/HTTP templates.
- Package release version 1.2.0 and host certification/matrix coverage.
- Clean-profile installed Command Code 1.53.1 configuration test.
- Model-driven Command Code + Ollama Cloud evidence and validator.
- Reproducible ephemeral CMS demonstration script.
- A 25-second proof video and editable HyperFrames source.
- Research, gap analysis, ADR, security model, user guide, and real workflow example.

Exact files changed from the research baseline:

```text
README.md
certification/evidence/ability-hosts-local.json
certification/evidence/command-code-ollama-live-2026-09-13.json
demos/command-code-ollama-proof/*
docs/ability-host-conformance.md
docs/ability-host-deployment.md
docs/command-code/ADR.md
docs/command-code/COMMAND-CODE.md
docs/command-code/FINAL-REPORT.md
docs/command-code/GAP-ANALYSIS.md
docs/command-code/RESEARCH.md
docs/command-code/THREAT-MODEL.md
docs/generated/ability-host-compatibility.md
integrations/kujo-ability/.codex-plugin/plugin.json
integrations/kujo-ability/CHANGELOG.md
integrations/kujo-ability/README.md
integrations/kujo-ability/bin/kujo-ability-mcp.mjs
integrations/kujo-ability/bin/kujo-ability.mjs
integrations/kujo-ability/examples/command-code-repository-inspection.md
integrations/kujo-ability/host-configs/command-code-http.json
integrations/kujo-ability/host-configs/command-code-stdio.json
integrations/kujo-ability/package.json
integrations/kujo-ability/plugin.json
kennel.toml
kujo.toml
mcp-server.json
scripts/certify-ability-hosts.mjs
scripts/run-command-code-ollama-demo.sh
scripts/generate-ability-compatibility.mjs
tests/ability_compatibility_matrix_test.mjs
tests/ability_connector_cli_test.mjs
tests/ability_host_bridge_test.mjs
tests/ability_package_release_test.mjs
tests/codex_clean_profile_test.mjs
tests/command_code_clean_profile_test.mjs
tests/command_code_ollama_live_evidence_test.mjs
tests/run_all_tests.sh
tests/test_03_endpoint_integration.sh
```

## Validation and limitations

The generic bridge suite proves dynamic discovery, schema/effect fidelity, structured invocation/results, receipts, cancellation, approval enforcement, replay resistance, and idempotency conflict. Connector tests prove safe configuration lifecycle. Command Code 1.53.1 accepts and resolves the generated project server. A live Ollama Cloud run proves model-driven host discovery and invocation. Managed gateway tests cover HTTP MCP independently.

Executed verification:

- `bash tests/run_all_tests.sh` — passed.
- `KUJO_REQUIRE_COMMAND_CODE=1 node tests/command_code_clean_profile_test.mjs` — passed with Command Code 1.53.1.
- `node tests/command_code_ollama_live_evidence_test.mjs` — passed against sanitized live evidence.
- `npm run check -- --snapshots` in `demos/command-code-ollama-proof` — passed with 101/101 contrast checks.
- HyperFrames high-quality render plus `ffprobe` — passed at 1920×1080, 30 fps, 25.0 seconds.
- `node scripts/certify-ability-hosts.mjs` — passed and produced immutable host evidence.
- `node scripts/generate-ability-compatibility.mjs` and `node tests/ability_compatibility_matrix_test.mjs` — passed.
- `git diff --check` and reproducible package/SBOM/provenance validation — passed.

Command Code 1.53.1 still performs an auth-value presence check before its
documented local-only BYOK path. The verified launcher pairs
`CMD_LOCAL_ONLY=1` with a non-secret sentinel; this is an upstream workaround,
not a Command Code credential. Managed Ability Gateway arbitrary customer
backend registration is also not generally available. Handler-level resumable
cancellation, verified host/session/model/agent context, native worker
negotiation, and Jidoka completion gating are outside Ability v1.

## Upstream assumptions and follow-up

Assumptions are Command Code's documented `.mcp.json`, STDIO/HTTP MCP,
local-only BYOK routing, OAuth/PKCE, Agent Skills, and current permission
behavior. Experimental mods are explicitly not assumed. Recommended follow-up
is to repeat the Ollama read and one approved mutation on every supported
Command Code release, remove the sentinel workaround when upstream fixes the
local-only gate, then design a generic fail-closed Host Capability/Completion
Gate contract with at least one other host before building any lifecycle
projection.
