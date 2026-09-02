# Ability platform baseline verification — 2026-09-02

This append-only record supplements the immutable repository inventory with executable baseline evidence. It distinguishes a repository gate from a narrower Ability conformance result and preserves pre-existing worktree state.

## Repository state

| Repository | Revision checked | State before verification | Ownership relevance |
| --- | --- | --- | --- |
| `ability` | `4873bbb` | clean | Canonical definitions, runtime, SDK previews, devkit, and offline registry trust |
| `mcp` | `743fa25` plus this evidence update | clean | Projection, gateway adapter, portable package, host evidence, and MCP core pack |
| `cms` | `b16d22e` | clean | Reference authenticated gateway and locally certified CMS core pack |
| `ssg` | `e165dbc` | clean | Ten-Ability SSG pack, approved preview/full/sharded builds, inspection, readiness, and artifact export |
| `agents-sdk` | `c48cde3303003e0952aca8a720f5754c59ea9bf7` | pre-existing untracked maintenance-agent files | Native agent projection and conformance consumer |
| `kujo-pi` | `9d977bdda760830e3cb00c1e0e756ab2d9acfe1e` | clean | Native client integration |
| `kujo` | `7733dbb76c71abdab979b2ac74b59c435fd18918` | clean | Language/runtime |
| `kennel` | `b5e0cf290aa2af7a90b637a7c3bdb4324ea4f66d` | clean | Dependency resolution and pins |
| `kujo-skills` | `db4a7f3c290b45a87339c4ab805ec34e7ca85c8c` | clean | Workflow guidance |
| `ability-gateway` | `4249abc` | clean | Private Cloudflare Workers managed control plane and remote MCP transport with provisioned cloud and GitHub identity resources |
| `kujolang.ai` | `fbd0ca8` | clean | Authoritative public Ability and MCP claim boundary |

The source-of-truth and workstream ownership matrix is in [ADR 0001](adr/0001-universal-ability-platform.md). The dated inventory remains the authority for the initial snapshot; this file records later executable checks without rewriting that snapshot.

## Commands and results

| Surface | Command | Result |
| --- | --- | --- |
| Ability release | `bash scripts/verify-release.sh` | Passed contract/runtime tests, cross-language SDK conformance, devkit and registry trust tests, CMS and MCP consumer conformance, and Fence with zero violations |
| MCP release | `KUJO_BIN=…/kujo/target/release/kujo bash tests/run_all_tests.sh` | Passed the complete 1.1.0 suite at `743fa25`, including installed VS Code 1.135 clean-profile registration, portable package, host evidence freshness, MCP core pack, symlink containment, drift, connector lifecycle, bridge, cancellation, approval/replay/idempotency, and reproducible artifacts |
| Ability Gateway | `npm run check`; `npm audit --audit-level=low`; `npx wrangler deploy --dry-run`; local and remote D1 migration; GitHub/Cloudflare provisioning review | Passed 18 tests, types, boundaries, zero-vulnerability audit, deploy packaging, and the 19-command schema migration. Cloudflare KV/D1 and an unrouted Worker version were provisioned on the Free account; the initial schema was applied remotely. The organization OAuth App and HMAC-signed Membership webhook now exist, and the webhook secret is stored in the Worker. GitHub privileged confirmation is the remaining prerequisite for generating and storing the OAuth client secret. The original Codex Security snapshot reported 5 findings; the pushed checkout repairs all five |
| Kujolang.ai | production Kujo SSG build; `verify-site-contract.sh`; `validate-generated-output.sh`; `npm test`; `npm audit --omit=dev` | Passed 192-page validation, 191 social-card coverage, 47 ecosystem projects, 96 skills, 37 workflows, tests, and zero-vulnerability audit before push to GitHub Pages |
| CMS release | `CMS_GATE_PORT_BASE=56400 CMS_GATE_RUN_PERF=false KUJO_BIN=… bash scripts/run-release-gate.sh` | Passed all contract, integration, security, Ability, tenant, background-work, restart, load, migration, and backup/restore checks after the gate was hardened to refuse occupied ports safely |
| SSG CI | `KUJO_BIN=…/kujo/target/release/kujo bash scripts/run_ci_checks.sh` | Passed CLI, generated-output, WebMCP, DocGen/docs template, ten-Ability pack, approved draft-preview build, hardlink/drive/URL security regressions, build, and HTML validation checks at `e165dbc` |
| SSG Ability dependency | `kujo run ../kennel/kennel.kujo --interpreter -- validate` | Passed manifest validation with canonical Ability 1.0.1 pinned to `be093e62bc93e5ec01e99e7da16c5657507ac820` in both manifest and lockfile |
| Agents SDK full suite | `kujo test` | 25 of 26 passed; the only failure is the pre-existing untracked `tests/maintenance_agent_tests.kujo` fixture, not committed repository behavior |
| Agents SDK Ability conformance | `kujo test-run tests/ability_contract_tests.kujo -v` | Passed 7 of 7 Ability schema, projection, gateway, receipt, handler-schema, and risk-hint checks |
| Kujo Pi release | `npm test` | Passed typecheck, capability/result/approval/receipt/registry/service/telemetry, packed-host lifecycle, fresh-profile, performance, package, artifact/SBOM, docs, and repository checks |
| Eval launch suites | `kujo run ../eval/main.kujo run tests/mcp_eval.json` and the SSG equivalent | Passed 3 of 3 checks in each suite |
| ShipCheck | `kujo run ../shipcheck/shipcheck.kujo gate --dir <repo> --format json` | Gates passed for Ability, MCP, CMS, and SSG; Ability had two warnings, CMS one, SSG two, and MCP none |
| ChangeBucket | commit-range JSON reports for Ability, MCP, CMS, and SSG | Recorded high footprint for the cross-repository Ability and MCP platform changes and medium footprint for CMS and SSG; no budget was asserted |
| Concord | repository JSON scans | SSG passed with one low examples warning; Ability had three low Spec/Eval/source-of-truth suggestions; MCP and CMS surfaced release-version interpretation findings requiring product review, and MCP discovery reached Concord's safety bound |
| Codex Security | completed diff scans for MCP, CMS, and SSG plus focused remediation | CMS reported zero findings. SSG reported one medium and two low findings, all repaired and regression-tested. MCP reported one medium and one low finding, both repaired and covered by the full suite |

The Kujo runtime, Kennel, and `kujo-skills` were not modified in this baseline slice. Their exact revisions and clean state were recorded; the consumer gates above exercised the runtime and pinned Ability resolution needed for this milestone.

## Current failures and claim boundary

- The Agents SDK repository is not clean because of pre-existing untracked maintenance-agent work. It was not modified, staged, or included in this goal's commits. The canonical committed Ability conformance suite passes.
- The CMS core pack is certified only at the local reference-gateway level recorded in `cms/docs/ability-pack-certification-2026-09-02.md`; production and installed-host certification remain separate.
- The SSG pack proves ten bounded workflows, including approved full/draft-preview/sharded builds and exclusive deterministic artifact export. Publication is intentionally provider-owned and remains absent because SSG owns no hosting credentials or deployment target.
- Codex CLI clean-profile install/enable/remove is `install-validated`; VS Code 1.135.0 clean-profile MCP registration is `installed-configuration-validated`; generic STDIO is `protocol-certified`; Agents SDK and Kujo Pi are `native-conformant`. Cursor remains `configuration-validated`. No row claims authenticated execution from Codex, VS Code/Copilot, or Cursor.
- The authoritative website now publishes the MCP 1.1.0 and Ability Gateway pre-deployment boundary without claiming a live service or authenticated editor certification.
- The managed gateway implementation and private repository exist at `kujolang/ability-gateway`; secure deployment is blocked only on GitHub OAuth App and Membership webhook credentials plus the live Free-plan CPU and authenticated host gates. The public `mcp.kujolang.ai` catalog remains read-only by design.
- npm publication, marketplace submission, signatures, production deployment, external security assessment, and legal/compliance approval remain external actions. The repository artifacts are unpublished and unsigned.
- MCP framework metadata, Kennel package metadata, the portable Ability package, and the README badge now agree on `1.1.0` following the explicit product release decision. CMS's reported changelog `1.0.1` conflicts with the file's visible `1.1.0` release and appears to be a scanner interpretation issue; that result was not silently reclassified as a pass.
