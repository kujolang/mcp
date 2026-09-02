# Ability platform baseline verification — 2026-09-02

This append-only record supplements the immutable repository inventory with executable baseline evidence. It distinguishes a repository gate from a narrower Ability conformance result and preserves pre-existing worktree state.

## Repository state

| Repository | Revision checked | State before verification | Ownership relevance |
| --- | --- | --- | --- |
| `ability` | `be093e62bc93e5ec01e99e7da16c5657507ac820` | clean | Canonical definitions and runtime |
| `mcp` | `4b282d4` plus the current goal commits | clean | Projection, gateway adapter, portable package |
| `cms` | `d2c29b4` | clean | Reference authenticated gateway and locally certified CMS core pack |
| `ssg` | `0ad0b47` | clean | Executable local SSG Ability pack and build contracts |
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
| Ability release | `bash scripts/verify-release.sh` | Passed contract/runtime tests, CMS and MCP consumer conformance, and Fence with zero violations |
| MCP release | `KUJO_BIN=…/kujo/target/release/kujo bash tests/run_all_tests.sh` | Passed all checks, including portable package, drift, connector lifecycle, bridge, cancellation, approval/replay/idempotency, and reproducible artifacts |
| CMS release | `CMS_GATE_PORT_BASE=56400 CMS_GATE_RUN_PERF=false KUJO_BIN=… bash scripts/run-release-gate.sh` | Passed all contract, integration, security, Ability, tenant, background-work, restart, load, migration, and backup/restore checks after the gate was hardened to refuse occupied ports safely |
| SSG CI | `KUJO_BIN=…/kujo/target/debug/kujo bash scripts/run_ci_checks.sh` | Passed CLI, generated-output, WebMCP, DocGen/docs template, executable Ability pack, build, and HTML validation checks |
| SSG Ability dependency | `kujo run ../kennel/kennel.kujo --interpreter -- validate` | Passed manifest validation with canonical Ability 1.0.1 pinned to `be093e62bc93e5ec01e99e7da16c5657507ac820` in both manifest and lockfile |
| Agents SDK full suite | `kujo test` | 25 of 26 passed; the only failure is the pre-existing untracked `tests/maintenance_agent_tests.kujo` fixture, not committed repository behavior |
| Agents SDK Ability conformance | `kujo test-run tests/ability_contract_tests.kujo -v` | Passed 7 of 7 Ability schema, projection, gateway, receipt, handler-schema, and risk-hint checks |
| Kujo Pi release | `npm test` | Passed typecheck, capability/result/approval/receipt/registry/service/telemetry, packed-host lifecycle, fresh-profile, performance, package, artifact/SBOM, docs, and repository checks |

The Kujo runtime, Kennel, and `kujo-skills` were not modified in this baseline slice. Their exact revisions and clean state were recorded; the consumer gates above exercised the runtime and pinned Ability resolution needed for this milestone.

## Current failures and claim boundary

- The Agents SDK repository is not clean because of pre-existing untracked maintenance-agent work. It was not modified, staged, or included in this goal's commits. The canonical committed Ability conformance suite passes.
- The CMS core pack is certified only at the local reference-gateway level recorded in `cms/docs/ability-pack-certification-2026-09-02.md`; production and host certification remain separate.
- The SSG local pack proves receipt-producing inspect, validate, and approval-gated build bindings with bounded paths and direct argv execution. Phase 06 still requires the broader SSG workflow inventory, deterministic build fixtures through the adapter, and a selected independently versioned ecosystem launch catalog.
- No Codex, Cursor, or VS Code host is certified by repository-only tests.
- The website checkout remains unresolved, so no public website claim was changed.
