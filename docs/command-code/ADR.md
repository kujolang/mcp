# ADR: Integrate Command Code through Ability Gateway MCP

Status: accepted, 2026-09-13.

## Decision

Choose Option A with a configuration-only host projection. Command Code consumes Kujo through its standard MCP client: direct HTTP MCP for the managed Ability Gateway, or the existing generic STDIO bridge for an application-owned REST gateway. Add Command Code recognition and exact configuration templates to the portable package. Do not create a Command Code adapter or mod.

Kujo remains authoritative for definitions, policy, approvals, execution, effects, receipts, and artifacts. Command Code owns its models, UI, sessions, permissions, and agents. Standard Agent Skills are shared from canonical Kujo sources.

## Rationale

The existing bridge and gateway already project dynamic Ability discovery and invocation without per-host business logic. Command Code 1.53.1 recognizes both required MCP transports and the generated project configuration. A bespoke wrapper would duplicate a working standard boundary while depending on an experimental mod API.

Ability passes the portability test for operation semantics. It does not—and should not pretend to—cover bidirectional host lifecycle. That is a real generic abstraction gap. It should be addressed as a separately versioned Host Capability contract only after at least two hosts can implement it and fail-closed completion semantics are specified.

## Alternatives

- Command Code mod wrapping MCP: rejected; no additional semantic value, experimental API, unsandboxed project code, fail-open hook errors.
- Command Code-native Kujo tools: rejected; duplicates Kujo behavior and requires releases for each Ability.
- Extend Ability v1 with Command Code hooks: rejected; conflates operation semantics and host lifecycle.
- Implement generic Host Bridge now: deferred; the cross-host contract and stable Command Code implementation surface are not yet proven.

## Consequences and risks

New exposed Abilities appear dynamically. Host-specific code is limited to reversible configuration. Receipts and effects survive the boundary, but Command Code does not present them as first-class UI. Server approvals remain independent of host prompts. Native session/model/agent identity and Jidoka completion gating are not integrated. Direct HTTP uses managed OAuth; STDIO inherits a least-privilege gateway token and must not receive approval-issuance credentials.

If Command Code changes its configuration schema, only the connector template/test changes. If MCP support is removed, the integration fails explicitly rather than silently executing an alternative Kujo implementation.

