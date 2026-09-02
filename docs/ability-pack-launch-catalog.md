# Ability Pack launch catalog

The generated launch catalog contains three independently versioned, domain-owned packs: `kujo.cms.core@1.0.0`, `kujo.ssg.core@1.0.0`, and `kujo.mcp.core@1.0.0`. Its machine-readable source is [`ability-pack-launch-catalog.json`](ability-pack-launch-catalog.json).

| Pack | Current evidence | Boundary |
| --- | --- | --- |
| CMS core | Local reference-gateway certified | Six application-owned operations; authenticated discovery, two approval-gated writes, canonical receipts, and audit. Not a production or host certification. |
| SSG core | Repository fixture certified | Ten local source/build/output/export operations. External publication is intentionally a separate provider-owned pack. |
| MCP core | Repository fixture certified | Two read-only operations for redacted repository profiling and contained generated-manifest validation. |

This is deliberately a small launch catalog. It covers a privileged application gateway, a deterministic local build system, and a read-only developer tool while preserving one canonical Ability contract. The remaining ecosystem products are not raw CLI passthrough candidates. Each stays deferred until its own repository supplies a versioned pack, bounded semantic handlers, offline fixtures, explicit effects and policy ownership, and receipt conformance.

The catalog records exact immutable source revisions. A repository-local test rejects malformed identity, duplicate packs, invalid revisions, unbounded effects, missing self-pack evidence, or a mismatch between the MCP entry and its current pack manifest. Publication, package signing, public registry listing, and marketplace claims remain separate approval gates.
