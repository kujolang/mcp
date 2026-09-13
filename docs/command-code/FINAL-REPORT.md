# Command Code local integration final report

## Outcome

Kujo's Ability architecture can support a substantially different agent host
without rebuilding Kujo. The zero-extension hypothesis was correct for host
transport and wrong for complete product delivery: standard MCP was enough for
Command Code, but a reusable local Ability host and portable profile contract
were needed to deliver local tools from npm without an application gateway.

The result is `@kujolang/kujo-cmd` 0.1.0, a release candidate for:

```text
npx @kujolang/kujo-cmd setup
```

It acquires every supported canonical source at a reviewed commit, installs a
durable copy of the official platform runtime and projection, configures one
STDIO MCP server, projects canonical skills for the selected profile, and runs
a real local Ability smoke test. No Kujo-hosted service is required.

## Implemented capability

- Four portable profiles and per-Ability enable/disable without reinstalling.
- Fourteen local Abilities spanning catalog/receipts, Scout, Scent,
  PatchBrief, ChangeBucket, ShipCheck, Fence, Spec, Eval, RunLedger, Dispatch,
  RAG, and Watchdog health.
- Dynamic schema/effect/digest discovery, structured results/errors,
  cancellation, concurrent calls, request-bound approval, keyed idempotency,
  persistent receipts, and restart recovery.
- Commands: `setup`, `doctor`, `status`, `profiles`, `profile`, `abilities`,
  `enable`, `disable`, `approve`, `services`, `update`, `repair`, and
  `uninstall`.
- Canonical Agent Skills projection and optional loopback Watchdog lifecycle.
- Exact protocol-version rejection and explicit feature degradation.

## Verification

Automated tests cover profile inheritance/overrides, schema metadata,
configuration merging/removal, skills projection, fail-closed approvals,
approval replay, idempotency conflict/replay across restart, cancellation,
concurrency, protocol mismatch, canonical PatchBrief and Scout invocation,
receipt correlation, offline local-source setup, and packed-artifact setup.

A fresh network acquisition of all 14 pinned repositories completed in under
30 seconds on the verification host. The generated npm tarball installed via
`npx --package=<tarball> kujo-cmd setup`; the resulting installation required
no hosted endpoint.

The model-driven replay passed with Command Code 1.53.1 and
`ollama/glm-5.3:cloud`: the model called
`mcp__kujo__kujo_ability_catalog` exactly once, received the Essentials catalog
and a succeeded local receipt, and accurately reported the returned capability
IDs. Command Code's local-only auth-value inconsistency was handled with the
existing non-secret sentinel under `CMD_LOCAL_ONLY=1`; no Command Code account
session or Kujo-hosted service was used. Evidence is in
`certification/evidence/command-code-kujo-cmd-live-2026-09-13.json`.

## Release assumptions and limitations

- Publish only after explicit release authorization; neither package nor
  source pins were published by this work.
- Runtime support follows `@kujolang/kujo-runtime@1.4.0`: macOS x64/arm64,
  Linux x64/arm64, and Windows x64. Only macOS x64 was executed here.
- Initial setup/update requires npm, Git, and GitHub; execution is offline.
- Command Code needs restart/tool refresh after profile changes.
- Host/session/model/agent metadata is caller-asserted until MCP or a stable
  Command Code API provides attestation.
- Native lifecycle telemetry, host-agent delegation, and Jidoka completion
  gating remain future generic Host Capability work.
- Multi-process receipt state needs an OS-level lock before high-concurrency
  multi-host use; one Command Code MCP server serializes mutations correctly.

## Recommended follow-up

Record the verified live GLM 5.3 scenario as an updated real-TUI video. Then
validate the packed artifact on macOS arm64, Linux x64/arm64, and Windows x64
before npm publication. Promote each catalog entry into its product repository
as a signed domain-owned Ability pack as those packages adopt the stable
profile/local-host contract.
