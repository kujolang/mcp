# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

## [1.0.0] - 2026-08-08

### Added

- Added launch-readiness Spec, Eval suite, Kujo project metadata, and scanner-visible examples surface for prelaunch review gates.
- Added first-party `mcp make` flow (`kujo run mcp.kujo --interpreter make <repo>`) that deterministically analyzes local repositories and generates:
	- repo-specific MCP server scaffold under `.mcp/generated-server`
	- `repo-profile.json` and `mcp.manifest.json`
	- safety-classified tools/resources/prompts with allowlisted safe commands
	- full artifact packet under `.mcp/artifacts` including backlog, validation, handoff, and MCP findings files.
- Added generated-server resource-root enforcement, bounded generated POST request bodies, and stricter manifest allowlist validation.
- Added `docs/MCP_REVIEW_BACKLOG_2026_06_19.md` to capture the next production-readiness, security, performance, functionality, and presentation pass.
- Added modular make pipeline modules under `src/make/` and command orchestration in `src/commands/make.kujo`.
- Added new test coverage for make safety/profile units and full generation integration (`tests/test_04_make_*.kujo`, `tests/feat_06_mcp_make.sh`).

- Defined release/versioning policy and changelog conventions in `docs/release-versioning-policy.md`.
- Added shared runtime resolution scripts (`scripts/find_kujo_runtime.sh` and `scripts/run_server.sh`) and updated tests/docs to avoid PATH collisions with non-runtime `kujo` binaries.
- Added deterministic required-argument validation across tool handlers and a dedicated regression suite (`tests/sec_07_tool_argument_validation.sh`) to prevent exception-style fallback errors.
- Enforced `server.name` and `server.version` config validation and made `/` + `/mcp/v1/health` return identity fields sourced from config instead of hardcoded values.
- Added multi-root integration coverage (`tests/feat_05_multi_root_contracts.sh`) for `project://docs`, `search_files`, and `list_tree_recursive` root-label behavior, and hardened directory normalization in tool resolvers.
- Fixed safe write/read error handling to stringify structured runtime errors safely and avoid transport-level exceptions in tool responses.
- Made safe writes overwrite existing files deterministically and expanded multi-root contracts to assert sequence-safe `write_text_safe` behavior.
- Added repeated-write assertions in multi-root integration coverage to verify overwrite semantics remain stable under the same file path.
- Updated multi-root contract test cleanup to remove generated root1 patch artifacts, keeping local runs and CI worktrees deterministic.
- Clarified `write_text_safe` overwrite semantics and multi-root create-target rules in `docs/mcp-reference.md`.

### Fixed

- Fixed the README version badge to match `kennel.toml` package metadata.
