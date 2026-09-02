# Ability platform independent review — 2026-09-02

## Verdict

The implementation is ready through the pre-deployment boundary as an unpublished preview. The managed gateway and authoritative website are implemented and pushed. Live OAuth setup, deployment, authenticated VS Code certification, and package/marketplace publication remain blocked by credentials or release authority. No unresolved critical or high validated security finding remains in the pushed source.

## Score

| Area | Score | Evidence boundary |
| --- | ---: | --- |
| Canonical architecture and contract ownership | 10/10 | One Ability contract/runtime, pinned consumers, ADR, drift checks |
| Portable package and local connector | 9/10 | Reproducible archive, SBOM, unsigned provenance, lifecycle and bridge tests; not published or signed |
| Domain packs and developer platform | 9/10 | CMS, SSG, and MCP packs plus TypeScript/Python previews, devkit, conformance fixtures, and offline registry verifier |
| Security and release controls | 9/10 | Diff scans, repaired findings, full gates, ShipCheck, Eval, ChangeBucket, approval/idempotency/audit negatives; no external assessment |
| Host certification | 7/10 | Codex install lifecycle, installed VS Code clean-profile configuration, generic STDIO, Agents SDK, and Kujo Pi evidence; Cursor remains configuration-only and interactive Copilot execution is not certified |
| Managed and public launch | 7/10 | Private gateway and authoritative website implemented and pushed; production OAuth/deployment, live certification, and marketplace submission remain |

Weighted milestone score: 8.4/10. This score describes evidence coverage, not a production certification.

## Closed repair checklist

- Removed in-band model self-approval from the portable MCP bridge and required out-of-band approvals.
- Bound host evidence to immutable connector source revisions and regenerated freshness-gated compatibility evidence.
- Isolated offline registry verification by tenant, rejected path/symlink escape, and versioned portable canonical digests.
- Repaired SSG hardlink overwrite, Windows drive-path handling, malformed loopback URL acceptance, and sharded runtime selection; added regression coverage and full CI.
- Bounded MCP repository profiling by skipping symlinks, capping visited entries, refusing symlinked JSON reads, and rejecting drive-qualified manifest paths; added regression coverage and passed the full MCP suite.
- Closed all five findings from the managed gateway's original security snapshot: pre-provider body limits, signed membership-removal grant revocation, pre-effect atomic idempotency claims, approval/audit quotas, and 30-day usage retention.

## Remaining gates

- Create the GitHub organization OAuth App and Membership webhook credentials, deploy `ability.kujolang.ai`, and drive an authenticated VS Code/Copilot tool invocation before upgrading the selected editor support tier.
- Measure OAuth, discovery, and execution CPU against the Cloudflare Workers Free boundary; do not upgrade automatically.
- Supply release authority for npm/marketplaces, signing keys, production credentials, public deployment, external assessment, and legal/compliance review.

## Evidence

- `docs/ability-platform-verification-2026-09-02.md`
- `docs/ability-pack-launch-catalog.json`
- `certification/evidence/ability-hosts-local.json`
- CMS local certification: `../cms/docs/ability-pack-certification-2026-09-02.md`
- SSG pack boundary: `../ssg/docs/ability-integration.md`
