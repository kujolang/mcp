# Ability platform baseline verification — 2026-09-02

This append-only record supplements the immutable repository inventory with executable baseline evidence. It distinguishes a repository gate from a narrower Ability conformance result and preserves pre-existing worktree state.

## Repository state

| Repository | Revision checked | State before verification | Ownership relevance |
| --- | --- | --- | --- |
| `ability` | `4873bbb` | clean | Canonical definitions, runtime, SDK previews, devkit, and offline registry trust |
| `mcp` | `75e16a7` plus this evidence update | clean | Projection, gateway adapter, portable package, host evidence, and MCP core pack |
| `cms` | `b16d22e` | clean | Reference authenticated gateway and locally certified CMS core pack |
| `ssg` | `e165dbc` | clean | Ten-Ability SSG pack, approved preview/full/sharded builds, inspection, readiness, and artifact export |
| `agents-sdk` | `c48cde3303003e0952aca8a720f5754c59ea9bf7` | pre-existing untracked maintenance-agent files | Native agent projection and conformance consumer |
| `kujo-pi` | `9d977bdda760830e3cb00c1e0e756ab2d9acfe1e` | clean | Native client integration |
| `kujo` | `7733dbb76c71abdab979b2ac74b59c435fd18918` | clean | Language/runtime |
| `kennel` | `b5e0cf290aa2af7a90b637a7c3bdb4324ea4f66d` | clean | Dependency resolution and pins |
| `kujo-skills` | `db4a7f3c290b45a87339c4ab805ec34e7ca85c8c` | clean | Workflow guidance |
| `kujolang.ai` | expected checkout absent | candidate `kujolang.ai-source` has no commits and is entirely untracked | Website ownership requires confirmation before edits |

The source-of-truth and workstream ownership matrix is in [ADR 0001](adr/0001-universal-ability-platform.md). The dated inventory remains the authority for the initial snapshot; this file records later executable checks without rewriting that snapshot.

## Commands and results

| Surface | Command | Result |
| --- | --- | --- |
| Ability release | `bash scripts/verify-release.sh` | Passed contract/runtime tests, cross-language SDK conformance, devkit and registry trust tests, CMS and MCP consumer conformance, and Fence with zero violations |
| MCP release | `KUJO_BIN=…/kujo/target/release/kujo bash tests/run_all_tests.sh` | Passed all checks through `5eb88d6`, including portable package, host evidence freshness, MCP core pack, symlink containment, drift, connector lifecycle, bridge, cancellation, approval/replay/idempotency, and reproducible artifacts; the later catalog-only change passed its focused identity test |
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
- Codex CLI clean-profile install/enable/remove is `install-validated`; generic STDIO is `protocol-certified`; Agents SDK and Kujo Pi are `native-conformant`. Cursor and VS Code/Copilot remain `configuration-validated` because their binaries were unavailable. No row claims authenticated execution from those primary hosts.
- The website checkout remains unresolved, so no public website claim was changed.
- The managed privileged gateway still lacks a designated service repository, production origin, infrastructure owner, identity provider, retention policy, credentials, and deployment authority. The public `mcp.kujolang.ai` catalog repository is read-only by design and is not a valid home for privileged execution.
- npm publication, marketplace submission, signatures, production deployment, external security assessment, and legal/compliance approval remain external actions. The repository artifacts are unpublished and unsigned.
- MCP framework metadata, Kennel package metadata, the portable Ability package, and the README badge now agree on `1.1.0` following the explicit product release decision. CMS's reported changelog `1.0.1` conflicts with the file's visible `1.1.0` release and appears to be a scanner interpretation issue; that result was not silently reclassified as a pass.
