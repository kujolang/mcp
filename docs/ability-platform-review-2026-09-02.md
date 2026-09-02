# Ability platform independent review — 2026-09-02

## Verdict

The locally owned Release A implementation is ready as an unpublished preview. The broader managed, marketplace, installed-host, and public-launch milestone is blocked by missing external ownership, environments, credentials, and publication authority. No critical or high validated security finding remains in the reviewed local changes.

## Score

| Area | Score | Evidence boundary |
| --- | ---: | --- |
| Canonical architecture and contract ownership | 10/10 | One Ability contract/runtime, pinned consumers, ADR, drift checks |
| Portable package and local connector | 9/10 | Reproducible archive, SBOM, unsigned provenance, lifecycle and bridge tests; not published or signed |
| Domain packs and developer platform | 9/10 | CMS, SSG, and MCP packs plus TypeScript/Python previews, devkit, conformance fixtures, and offline registry verifier |
| Security and release controls | 9/10 | Diff scans, repaired findings, full gates, ShipCheck, Eval, ChangeBucket, approval/idempotency/audit negatives; no external assessment |
| Host certification | 6/10 | Codex install lifecycle, generic STDIO, Agents SDK, and Kujo Pi evidence; Cursor/VS Code lack installed-host runs |
| Managed and public launch | 2/10 | Contracts and boundaries documented; no owned privileged service, production deployment, marketplace submission, or website checkout |

Weighted milestone score: 7.5/10. This score describes evidence coverage, not a production certification.

## Closed repair checklist

- Removed in-band model self-approval from the portable MCP bridge and required out-of-band approvals.
- Bound host evidence to immutable connector source revisions and regenerated freshness-gated compatibility evidence.
- Isolated offline registry verification by tenant, rejected path/symlink escape, and versioned portable canonical digests.
- Repaired SSG hardlink overwrite, Windows drive-path handling, malformed loopback URL acceptance, and sharded runtime selection; added regression coverage and full CI.
- Bounded MCP repository profiling by skipping symlinks, capping visited entries, refusing symlinked JSON reads, and rejecting drive-qualified manifest paths; added regression coverage and passed the full MCP suite.

## Remaining gates

- Install and execute the package in current Cursor and VS Code/Copilot hosts before upgrading their support tiers.
- Designate a separate privileged managed-service repository, origin, operator, identity/tenant model, retention policy, infrastructure, and security-review owner.
- Supply release authority for npm/marketplaces, signing keys, production credentials, public deployment, external assessment, and legal/compliance review.
- Resolve the authoritative website repository before changing public launch claims.
- Rerun Concord after the approved MCP `1.1.0` metadata alignment.

## Evidence

- `docs/ability-platform-verification-2026-09-02.md`
- `docs/ability-pack-launch-catalog.json`
- `certification/evidence/ability-hosts-local.json`
- CMS local certification: `../cms/docs/ability-pack-certification-2026-09-02.md`
- SSG pack boundary: `../ssg/docs/ability-integration.md`
