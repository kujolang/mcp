# ADR 0001: Universal Kujo Ability platform boundaries

- Status: accepted for local implementation
- Date: 2026-09-02
- Decision owners: canonical contract owners and application maintainers

## Context

Kujo Ability must retain the same semantic operation, safety boundary, and receipt meaning across Codex, Cursor, VS Code/Copilot, Kujo-native hosts, and generic MCP clients. Separate host implementations would create contract drift and inconsistent authorization.

## Decision

Use one layered architecture:

```text
canonical kujo.ability/v1 contract and runtime
  -> application-owned bindings, handlers, identity, and policy
  -> local, customer-hosted, or separately operated managed execution plane
  -> portable Agent Plugin and MCP projection
  -> thin client-specific experience overlays
  -> independently versioned Ability Packs
```

The canonical contract defines identity, version, closed schemas, effects, idempotency mode, exposure metadata, digest, and receipt semantics. The owning application resolves the principal and tenant, filters discovery, authorizes every execution, binds and consumes approvals, persists idempotency and audit records, and executes bounded handlers.

`mcp.kujolang.ai` remains a public read-only catalog. A privileged managed execution service requires a separate origin, OAuth/resource-server threat model, operator boundary, tenant isolation, retention policy, and independent release approval.

## Deployment profiles

- Local: loopback HTTP is permitted; fixture mode and explicit process cleanup are required.
- Customer-hosted: HTTPS, customer identity and secret custody, unique human/workload identities, ingress controls, backup/restore, rotation, rollback, health, and audit export are required.
- Kujo-managed: separate origin, OAuth 2.1 authorization code with PKCE, protected-resource metadata, audience validation, short-lived and revocable credentials, tenant-scoped discovery/execution, quotas, retention, export/deletion, incident response, and disaster recovery are required before availability claims.

## Approval, idempotency, and receipts

Host confirmation is an additional user-experience control, never application authorization. A server approval binds the exact Ability ID, Ability version, definition digest, invocation ID, principal, tenant, and normalized input and is one-time unless the canonical policy explicitly says otherwise. Idempotency keys are scoped by tenant, principal, Ability, and version and conflict on changed normalized input. Every terminal result preserves a canonical receipt.

## Compatibility and deprecation

- `kujo.ability/v1` and the related `kujo.ability.*/v1` schemas remain authoritative until a new schema identifier is released.
- Consumers resolve exact Ability versions and pin the reviewed Ability package commit.
- MCP protocol version `2025-11-25` is the bridge baseline. A protocol change requires adapter conformance and host-matrix reruns.
- Agent Plugins `1.0.0` is the portable package baseline. Manifest and MCP schema versions must match.
- Host packages and Ability Packs use independent semantic versions. Breaking semantic changes require an Ability major version; host-only UX additions do not.
- Deprecations remain documented for at least two minor releases or 90 days unless a security issue requires a faster fail-closed change with migration guidance.

## Support tiers

- Certified native plugin: marketplace distribution, native UX, and current automated end-to-end lifecycle evidence.
- Certified MCP integration: current automated installation and end-to-end MCP evidence without richer native UX.
- Community-compatible MCP integration: standards-compatible configuration without maintained certification evidence.

No package receives a certified tier from static configuration or unit tests alone.

## Consequences

Portable manifests, native overlays, and product packs can evolve independently while sharing definitions and receipts. Cross-repository changes must start in the owning source of truth. Marketplace publication, production deployment, breaking releases, and public availability claims remain explicit approval gates.
