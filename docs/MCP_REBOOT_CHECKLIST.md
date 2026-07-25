# MCP Reboot Checklist

Last updated: 2026-05-21
Owner: Platform maintainers and contributing agents
Scope: /path/to/kujo/mcp

## Goal

Turn this repo into a secure, reusable, and developer-friendly MCP foundation that other teams can pick up with minimal customization.

## How Agents Must Work This Checklist

1. Read README.md and this checklist before changing code.
2. Pick exactly one unchecked item unless a human asks for a specific set.
3. Implement the item with the smallest safe change that satisfies acceptance criteria.
4. Run the validation listed in the item (or clearly document why it could not run).
5. Update README.md when behavior, architecture, configuration, or usage changes.
6. Mark the checklist item complete and add a completion note in the Work Log section.
7. Stop and hand off; do not auto-chain into another item unless explicitly requested.

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Completed
- [!] Blocked

## Current Findings Snapshot (From Code Review)

These findings are the reason for the initial priority order below.

1. Path checks rely on starts_with and do not normalize paths, allowing traversal patterns like ../ to pass lexical prefix checks.
   - Evidence: server.kujo lines 35-53, 136-157, 194-197, 209-212, 264-265.
   - Evidence: mcp.kujo lines 41-53.
2. read_only_patterns are configured as globs (for example *.md) but enforced with literal ends_with checks, which do not match glob patterns.
   - Evidence: mcp-server.json line 14, server.kujo lines 39-42.
3. Tool input schema is declared but not validated before handler execution.
   - Evidence: README.md line 15 claim, server.kujo lines 82-99 and 366-395.
4. Config knobs are defined but not enforced in runtime behavior.
   - Evidence: mcp-server.json lines 8, 13, 17, 22 vs server.kujo lines 20 and 341.
5. max_entries is read but not applied when serving logs.
   - Evidence: server.kujo lines 20, 65-76, 427-429.
6. mcp.kujo and server.kujo duplicate key helper logic, increasing maintenance risk.
   - Evidence: mcp.kujo lines 12-87 and server.kujo lines 136-179.
7. No automated test suite exists for unit, integration, or security regression coverage.
   - Evidence: no test files present in repository.

## Tier 0 - Critical Security and Correctness

### SEC-01 Canonical Path Guard
- [x] Replace lexical prefix checks with canonical, normalized path boundary checks.
- Target files: server.kujo, mcp.kujo.
- Acceptance criteria:
  - ../ traversal is rejected for read and write operations.
  - sibling-prefix bypasses are rejected (example: ./demo2 should not pass ./demo policy).
  - error messages are deterministic and safe for logs.
- Validation:
  - Add tests covering traversal and sibling-prefix bypass vectors.
  - Add positive tests for valid in-scope paths.

### SEC-02 Read-Only Pattern Enforcement
- [x] Replace literal suffix checks with actual pattern matching logic for configured read_only_patterns.
- Target files: server.kujo, mcp.kujo, mcp-server.json.
- Acceptance criteria:
  - *.md style patterns are enforced correctly.
  - explicit extension and exact-file patterns are both supported.
- Validation:
  - Add tests for allowed write and denied write cases across pattern types.

### SEC-03 Per-Tool Path Sanitization
- [x] Enforce tool-level path sanitization before filesystem calls in read_project_docs, search_files, and write_safe_patch.
- Target files: server.kujo.
- Acceptance criteria:
  - directory and file_path arguments cannot escape allowed roots.
  - read_project_docs fallback path behavior is safe and explicit.
- Validation:
  - Add integration tests for each tool with malicious and valid inputs.

### SEC-04 Request Parsing and JSON-RPC Validation
- [x] Validate request body shape and required JSON-RPC fields before dereferencing params.
- Target files: server.kujo.
- Acceptance criteria:
  - Invalid JSON returns structured JSON-RPC errors, not unhandled exceptions.
  - Missing params or name fields return deterministic client-safe error objects.
- Validation:
  - Add negative tests for malformed payloads and missing required keys.

### SEC-05 File Size and Write Limits
- [x] Enforce max_file_size for reads and writes using configuration.
- Target files: server.kujo, mcp.kujo, mcp-server.json.
- Acceptance criteria:
  - Operations fail safely when files exceed limits.
  - Error response includes limit context without leaking sensitive path details.
- Validation:
  - Add tests for under-limit and over-limit scenarios.

### SEC-06 Network Exposure and Optional Auth
- [x] Implement host binding from config and add optional auth strategy for non-local use.
- Target files: server.kujo, mcp-server.json, README.md.
- Acceptance criteria:
  - Host value from config is honored.
  - Optional API key or bearer-token auth can be enabled.
- Validation:
  - Add integration checks for authorized and unauthorized requests.

## Tier 1 - Core Architecture and DRY Cleanup

### ARC-01 Clean Repository Layout
- [x] Move implementation into a clean structure and keep root minimal.
- Proposed layout:
  - src/core/ (schema, rpc, permissions, logging)
  - src/server/ (routes, transport)
  - src/tools/ and src/resources/ (registrations and handlers)
  - tests/ (unit and integration)
  - docs/ (design and process docs)
- Target files: repository-wide.
- Acceptance criteria:
  - Root contains only high-signal entry/config/docs files.
  - Entry point remains simple and discoverable.

### ARC-02 Use Framework Module Instead of Duplicate Helpers
- [x] Make server consume shared helpers from one canonical implementation source.
- Target files: mcp.kujo, server.kujo.
- Acceptance criteria:
  - One source of truth for schema helpers, permission helpers, and rpc response helpers.
  - No security-sensitive logic duplicated in two places.

### ARC-03 Typed Config Loading and Validation
- [x] Add config validation with clear startup errors for missing/invalid keys.
- Target files: server.kujo, mcp-server.json.
- Acceptance criteria:
  - Server fails fast on invalid config with actionable messages.
  - Defaults are explicit and documented.

### ARC-04 Plugin-Style Tool and Resource Registration
- [x] Support modular registration so teams can add/remove tools without editing one large file.
- Target files: server.kujo and new src/tools + src/resources modules.
- Acceptance criteria:
  - New tool can be added in one module and registered centrally.
  - Tool metadata and handler are co-located.

## Tier 2 - Universal Developer Utility

### FEAT-01 File Toolkit Expansion
- [x] Add practical, reusable file tools beyond demo-only behavior.
- Suggested tools:
  - read_text_range
  - write_text_safe (with create-if-missing option)
  - list_tree_recursive (depth control)
  - grep_text (literal and regex mode)
- Acceptance criteria:
  - Every tool is guarded by path and size checks.
  - Tool schemas and examples are documented in README.md.

### FEAT-02 Better Search Semantics
- [x] Upgrade search_files to support recursive search and content matching with limits.
- Target files: server.kujo.
- Acceptance criteria:
  - Filename and content modes are both supported.
  - Result cap and timeout behavior are documented and enforced.

### FEAT-03 Prompt and Workflow Resources
- [x] Add reusable MCP resources for agent prompts/checklists/workflows.
- Target files: resources modules and docs.
- Acceptance criteria:
  - Agents can discover onboarding prompts and workflow templates via resources/read.

### FEAT-04 Tool Timeout and Cancellation Controls
- [x] Enforce per-tool timeout policy from config and return explicit timeout errors.
- Target files: server.kujo, config handling.
- Acceptance criteria:
  - default_timeout_ms is active and tested.

## Tier 3 - Testing and Regression Safety

### TEST-01 Unit Test Harness
- [x] Create test harness and baseline unit test suite.
- Priority test targets:
  - permission checks
  - pattern matching
  - config validation
  - schema validation

### TEST-02 Security Regression Suite
- [x] Add dedicated tests for traversal, bypass, malformed JSON, and over-limit payloads.
- Acceptance criteria:
  - Every Tier 0 issue has at least one failing-then-passing regression test.

### TEST-03 Endpoint Integration Tests
- [x] Add endpoint-level tests for tools/list, tools/call, resources/list, resources/read, and health.
- Acceptance criteria:
  - Happy-path and error-path behavior are verified.

### TEST-04 CI Gates
- [x] Add CI workflow that runs lint/style checks and all tests on pull requests.
- Acceptance criteria:
  - PRs cannot merge without passing the test suite.

## Tier 4 - Documentation and Contributor Experience

### DOC-01 README Accuracy Pass
- [x] Align README claims to actual behavior (especially schema validation and security behavior).
- Target files: README.md.

### DOC-02 Security Model Document
- [x] Add docs/security-model.md describing trust boundaries, threat model, and hardening defaults.

### DOC-03 Contributor Playbook
- [x] Add docs/contributing-agent-workflow.md with branch strategy, checklist workflow, and done criteria.

### DOC-04 Example Integrations
- [x] Add concrete examples for local and remote MCP usage with Copilot and other clients.

### DOC-05 Versioning and Changelog Policy
- [x] Define release/versioning policy and changelog conventions.

## Item Completion Template

Use this exact block in the Work Log each time an item is completed.

- Item: <ID>
- Date: <YYYY-MM-DD>
- Summary: <what changed>
- Files changed: <comma-separated list>
- Validation run: <commands or test identifiers>
- README updated: <yes/no + what changed>
- Follow-ups: <new IDs or notes>

## Work Log

- 2026-05-21: Checklist created from full repository review. No code behavior changed yet.

- Item: SEC-01
- Date: 2026-05-21
- Summary: Replaced lexical prefix checks with canonical absolute-path boundary validation in both runtime and framework permission helpers.
- Files changed: server.kujo, mcp.kujo, tests/sec_01_path_guard.kujo, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: kujo run tests/sec_01_path_guard.kujo --interpreter; API negative checks for traversal/sibling bypass on tools/call; required MCP smoke checks for health, tools/list, tools/call, resources/list, resources/read
- README updated: yes - added Canonical Path Guard feature note
- Follow-ups: SEC-02 read_only_patterns are still suffix-checked and require true pattern matching

- Item: SEC-02
- Date: 2026-05-21
- Summary: Replaced literal suffix checks with wildcard-aware read-only matching and validated glob, extension, and exact-file behavior for write protection.
- Files changed: server.kujo, mcp.kujo, tests/sec_02_read_only_patterns.kujo, tests/sec_01_path_guard.kujo, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: kujo run tests/sec_02_read_only_patterns.kujo --interpreter; kujo run tests/sec_01_path_guard.kujo --interpreter; API deny/allow checks for write_safe_patch with read-only patterns; MCP smoke checks for health, tools/list, tools/call, resources/list, resources/read
- README updated: yes - documented read_only_patterns matching modes
- Follow-ups: SEC-04 remains open for full request validation hardening and broader JSON-RPC negative cases

- Item: SEC-03
- Date: 2026-05-21
- Summary: Added explicit per-tool path argument sanitization for read_project_docs, search_files, and write_safe_patch before filesystem operations.
- Files changed: server.kujo, tests/sec_03_tool_path_sanitization.sh, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: bash tests/sec_03_tool_path_sanitization.sh; kujo run tests/sec_01_path_guard.kujo --interpreter; kujo run tests/sec_02_read_only_patterns.kujo --interpreter; MCP smoke checks for health, tools/list, tools/call, resources/list, resources/read
- README updated: yes - clarified sanitization behavior for read_project_docs/search_files/write_safe_patch
- Follow-ups: SEC-04 should expand malformed/invalid request-path test coverage for structured JSON-RPC errors

- Item: SEC-04
- Date: 2026-05-21
- Summary: Added deterministic request-body and params-shape validation for tools/call and resources/read with structured JSON-RPC error responses.
- Files changed: server.kujo, tests/sec_04_request_validation.sh, tests/sec_03_tool_path_sanitization.sh, tests/sec_01_path_guard.kujo, tests/sec_02_read_only_patterns.kujo, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: bash tests/sec_04_request_validation.sh; bash tests/sec_03_tool_path_sanitization.sh; kujo run tests/sec_01_path_guard.kujo --interpreter; kujo run tests/sec_02_read_only_patterns.kujo --interpreter; MCP smoke checks for health, tools/list, tools/call, resources/list, resources/read
- README updated: yes - added deterministic request validation behavior note
- Follow-ups: SEC-05 should enforce max_file_size limits in both read and write paths

- Item: SEC-05
- Date: 2026-05-21
- Summary: Enforced max_file_size limits for both safe reads and safe writes in server and shared framework helpers.
- Files changed: server.kujo, mcp.kujo, tests/sec_05_file_size_limits.sh, tests/sec_04_request_validation.sh, tests/sec_03_tool_path_sanitization.sh, tests/sec_02_read_only_patterns.kujo, tests/sec_01_path_guard.kujo, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: bash tests/sec_05_file_size_limits.sh; bash tests/sec_04_request_validation.sh; bash tests/sec_03_tool_path_sanitization.sh; kujo run tests/sec_02_read_only_patterns.kujo --interpreter; kujo run tests/sec_01_path_guard.kujo --interpreter; MCP smoke checks for health, tools/list, tools/call, resources/list, resources/read
- README updated: yes - documented max_file_size enforcement behavior
- Follow-ups: SEC-06 should add host-binding enforcement and optional auth for non-local use

- Item: SEC-06
- Date: 2026-05-21
- Summary: Added host-policy enforcement from config and optional bearer/api_key authentication checks across MCP endpoints.
- Files changed: server.kujo, mcp-server.json, tests/sec_06_network_auth.sh, tests/sec_05_file_size_limits.sh, tests/sec_04_request_validation.sh, tests/sec_03_tool_path_sanitization.sh, tests/sec_02_read_only_patterns.kujo, tests/sec_01_path_guard.kujo, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: bash tests/sec_06_network_auth.sh; bash tests/sec_05_file_size_limits.sh; bash tests/sec_04_request_validation.sh; bash tests/sec_03_tool_path_sanitization.sh; kujo run tests/sec_02_read_only_patterns.kujo --interpreter; kujo run tests/sec_01_path_guard.kujo --interpreter; MCP smoke checks for health, tools/list, tools/call, resources/list, resources/read
- README updated: yes - documented host policy and optional auth behavior
- Follow-ups: ARC-01 should restructure code into modular layout to reduce single-file complexity

- Item: ARC-01
- Date: 2026-05-21
- Summary: Moved core implementation into src/core and src/server with thin root bootstrap/wrapper files and created src/tools/src/resources directories.
- Files changed: src/core/framework.kujo, src/server/runtime.kujo, src/tools/.gitkeep, src/resources/.gitkeep, server.kujo, mcp.kujo, tests/arc_01_layout_smoke.sh, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: bash tests/arc_01_layout_smoke.sh; bash tests/sec_06_network_auth.sh; bash tests/sec_05_file_size_limits.sh; bash tests/sec_04_request_validation.sh; bash tests/sec_03_tool_path_sanitization.sh; kujo run tests/sec_02_read_only_patterns.kujo --interpreter; kujo run tests/sec_01_path_guard.kujo --interpreter
- README updated: yes - updated architecture layout to reflect src/ structure
- Follow-ups: ARC-02 should remove duplicate helper implementations by making runtime consume shared core helpers directly

- Item: ARC-02
- Date: 2026-05-21
- Summary: Removed duplicated schema/permission/safe-I/O helper blocks from runtime and wired runtime behavior to shared framework helpers in src/core/framework.kujo.
- Files changed: src/server/runtime.kujo, tests/arc_02_shared_helpers.sh, tests/arc_01_layout_smoke.sh, tests/sec_06_network_auth.sh, tests/sec_05_file_size_limits.sh, tests/sec_04_request_validation.sh, tests/sec_03_tool_path_sanitization.sh, tests/sec_02_read_only_patterns.kujo, tests/sec_01_path_guard.kujo, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: bash tests/arc_02_shared_helpers.sh; bash tests/arc_01_layout_smoke.sh; bash tests/sec_06_network_auth.sh; bash tests/sec_05_file_size_limits.sh; bash tests/sec_04_request_validation.sh; bash tests/sec_03_tool_path_sanitization.sh; kujo run tests/sec_02_read_only_patterns.kujo --interpreter; kujo run tests/sec_01_path_guard.kujo --interpreter
- README updated: yes - documented shared core helper consumption
- Follow-ups: ARC-03 should formalize config validation/fail-fast startup rules now that shared core consumption is centralized

- Item: ARC-03
- Date: 2026-05-21
- Summary: Added typed config loading and fail-fast validation with explicit required keys and clear startup errors for invalid values.
- Files changed: src/server/runtime.kujo, tests/arc_03_config_validation.sh, tests/arc_02_shared_helpers.sh, tests/arc_01_layout_smoke.sh, tests/sec_06_network_auth.sh, tests/sec_05_file_size_limits.sh, tests/sec_04_request_validation.sh, tests/sec_03_tool_path_sanitization.sh, tests/sec_02_read_only_patterns.kujo, tests/sec_01_path_guard.kujo, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: bash tests/arc_03_config_validation.sh; bash tests/arc_02_shared_helpers.sh; bash tests/arc_01_layout_smoke.sh; bash tests/sec_06_network_auth.sh; bash tests/sec_05_file_size_limits.sh; bash tests/sec_04_request_validation.sh; bash tests/sec_03_tool_path_sanitization.sh; kujo run tests/sec_02_read_only_patterns.kujo --interpreter; kujo run tests/sec_01_path_guard.kujo --interpreter
- README updated: yes - documented fail-fast config validation behavior
- Follow-ups: ARC-04 should modularize tool/resource registration for add/remove extensibility

- Item: ARC-04
- Date: 2026-05-21
- Summary: Modularized tool and resource registration into dedicated registry modules with centralized runtime loading and dispatcher-based execution paths.
- Files changed: src/server/runtime.kujo, src/tools/registry.kujo, src/resources/registry.kujo, tests/arc_04_plugin_registration.sh, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: bash tests/arc_04_plugin_registration.sh; bash tests/arc_03_config_validation.sh; bash tests/arc_02_shared_helpers.sh; bash tests/arc_01_layout_smoke.sh; bash tests/sec_06_network_auth.sh; bash tests/sec_05_file_size_limits.sh; bash tests/sec_04_request_validation.sh; bash tests/sec_03_tool_path_sanitization.sh; kujo run tests/sec_02_read_only_patterns.kujo --interpreter; kujo run tests/sec_01_path_guard.kujo --interpreter
- README updated: yes - documented plugin-style tool/resource registration modules in architecture/features sections
- Follow-ups: FEAT-01 can now extend tool/resource modules without editing runtime registration block

- Item: FEAT-01
- Date: 2026-05-21
- Summary: Added reusable file toolkit tools (`read_text_range`, `write_text_safe`, `list_tree_recursive`, `grep_text`) with path-boundary and max-file-size guard enforcement through shared safe I/O helpers.
- Files changed: src/tools/registry.kujo, src/server/runtime.kujo, tests/feat_01_file_toolkit_expansion.sh, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/feat_01_file_toolkit_expansion.sh; bash tests/arc_04_plugin_registration.sh; API smoke checks for health/tools list/tool call/resources list/resources read using kujo run server.kujo --interpreter
- README updated: yes - added File Toolkit feature note and tool table entries for FEAT-01 tools
- Follow-ups: FEAT-02 can build on `grep_text` and recursive tree traversal internals for richer search semantics

- Item: FEAT-02
- Date: 2026-05-21
- Summary: Enhanced `search_files` with filename/content modes, recursive traversal toggle, bounded `max_results`, and enforced timeout budget semantics.
- Files changed: src/tools/registry.kujo, tests/feat_02_search_semantics.sh, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/feat_02_search_semantics.sh; bash tests/feat_01_file_toolkit_expansion.sh; KUJO_BIN=kujo bash tests/arc_04_plugin_registration.sh; API smoke checks for health/tools list/tool call/resources list/resources read using kujo run server.kujo --interpreter
- README updated: yes - documented `search_files` modes and cap/timeout behavior in features and tool table
- Follow-ups: FEAT-04 can reuse the timeout budget pattern for consistent per-tool timeout enforcement

- Item: FEAT-03
- Date: 2026-05-21
- Summary: Added reusable onboarding and checklist workflow MCP resources with discoverable URIs and markdown-backed readers.
- Files changed: src/resources/registry.kujo, src/server/runtime.kujo, docs/onboarding-prompt.md, docs/checklist-loop-workflow.md, tests/feat_03_prompt_workflow_resources.sh, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/feat_03_prompt_workflow_resources.sh; KUJO_BIN=kujo bash tests/arc_04_plugin_registration.sh; resource-focused API smoke checks for health/resources list/resources read using kujo run server.kujo --interpreter
- README updated: yes - added prompt/workflow resources to the Available Resources section
- Follow-ups: DOC-04 can reference these URIs as concrete integration examples

- Item: FEAT-04
- Date: 2026-05-21
- Summary: Activated config-driven timeout defaults for tool execution paths and converted timeout conditions into explicit MCP tool errors.
- Files changed: src/server/runtime.kujo, src/tools/registry.kujo, tests/feat_04_tool_timeout_controls.sh, tests/feat_02_search_semantics.sh, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/feat_04_tool_timeout_controls.sh; bash tests/feat_02_search_semantics.sh; bash tests/feat_01_file_toolkit_expansion.sh; KUJO_BIN=kujo bash tests/arc_04_plugin_registration.sh; API smoke checks for health/tools list/tools call timeout-path using kujo run server.kujo --interpreter
- README updated: yes - documented default timeout behavior and timeout-aware search/grep tool semantics
- Follow-ups: FEAT-05 should consider cooperative cancellation tokens for long-running tools beyond step-budget enforcement

- Item: TEST-01
- Date: 2026-05-21
- Summary: Added a baseline unit-test harness with focused Kujo tests for permission checks, read-only pattern matching, schema helper validation, and integrated config-validation coverage.
- Files changed: tests/test_01_unit_harness.sh, tests/test_01_permission_checks.kujo, tests/test_01_pattern_matching.kujo, tests/test_01_schema_validation.kujo, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/test_01_unit_harness.sh; bash tests/feat_04_tool_timeout_controls.sh; KUJO_BIN=kujo bash tests/arc_04_plugin_registration.sh; MCP smoke checks for health/tools list/resources list using kujo run server.kujo --interpreter
- README updated: yes - added baseline unit harness feature note
- Follow-ups: TEST-03 can consume this harness as part of endpoint integration test gating

- Item: TEST-02
- Date: 2026-05-21
- Summary: Added a dedicated security regression suite runner that executes Tier 0 regressions covering traversal, sibling-prefix bypass, malformed JSON/request validation, over-limit payloads, and host/auth controls.
- Files changed: tests/test_02_security_regression_suite.sh, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/test_02_security_regression_suite.sh; bash tests/test_01_unit_harness.sh; KUJO_BIN=kujo bash tests/arc_04_plugin_registration.sh; direct MCP smoke for /mcp/v1/health and /mcp/v1/tools/list using kujo run server.kujo --interpreter
- README updated: yes - added dedicated security regression suite feature note
- Follow-ups: TEST-04 CI gates should execute test_02_security_regression_suite.sh on pull requests

- Item: TEST-03
- Date: 2026-05-21
- Summary: Added endpoint-level integration coverage for health, tools/list, tools/call, resources/list, and resources/read with explicit happy-path and error-path assertions.
- Files changed: tests/test_03_endpoint_integration.sh, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/test_03_endpoint_integration.sh; bash tests/test_02_security_regression_suite.sh; bash tests/test_01_unit_harness.sh; KUJO_BIN=kujo bash tests/arc_04_plugin_registration.sh
- README updated: yes - added endpoint integration suite feature note
- Follow-ups: TEST-04 CI gate should run the endpoint integration suite as a required PR check

- Item: TEST-04
- Date: 2026-05-21
- Summary: Added a pull-request CI workflow with lint/style checks and a deterministic full-suite harness (`tests/run_all_tests.sh`) to gate merges on test success.
- Files changed: .github/workflows/ci.yml, tests/run_all_tests.sh, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash -n tests/*.sh; python3 -m json.tool mcp-server.json >/dev/null; bash tests/run_all_tests.sh
- README updated: yes - added CI gate feature note
- Follow-ups: DOC-03 should include branch protection guidance to require the CI workflow before merge

- Item: DOC-01
- Date: 2026-05-21
- Summary: Corrected README claims to reflect actual runtime behavior by distinguishing exposed schema metadata from handler-level validation enforcement.
- Files changed: README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/test_03_endpoint_integration.sh; direct MCP checks for tools/list schema metadata and tools/call invalid-mode error using kujo run server.kujo --interpreter
- README updated: yes - revised schema validation claims and added a dedicated Validation Model section
- Follow-ups: DOC-04 examples should explicitly mention handler-level validation and request-shape guarantees

- Item: DOC-02
- Date: 2026-05-21
- Summary: Added a dedicated security model document that defines trust boundaries, in-scope threats, hardening defaults, and operational guidance.
- Files changed: docs/security-model.md, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/test_02_security_regression_suite.sh; bash tests/test_03_endpoint_integration.sh
- README updated: yes - linked the new security model document from the reboot plan section
- Follow-ups: DOC-04 should reference security-model controls in example deployment guidance

- Item: DOC-03
- Date: 2026-05-21
- Summary: Added a contributor workflow playbook documenting branch strategy, single-item checklist loops, and explicit done criteria for agent-driven changes.
- Files changed: docs/contributing-agent-workflow.md, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/test_01_unit_harness.sh; bash tests/test_03_endpoint_integration.sh
- README updated: yes - linked the contributor workflow playbook from the reboot plan section
- Follow-ups: DOC-04 examples should reference this workflow as the implementation path for sample integrations

- Item: DOC-04
- Date: 2026-05-21
- Summary: Added a concrete integration examples guide covering local stdio setup, remote HTTP setup, and generic endpoint call flow for Copilot and other MCP-compatible clients.
- Files changed: docs/example-integrations.md, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/test_03_endpoint_integration.sh; bash tests/test_01_unit_harness.sh
- README updated: yes - linked the new integration examples document from the reboot plan section
- Follow-ups: DOC-05 release policy should define how integration examples evolve with endpoint/version changes

- Item: DOC-05
- Date: 2026-05-21
- Summary: Added a release/versioning policy with semantic versioning rules, changelog conventions, release checklist, and initial CHANGELOG scaffold.
- Files changed: docs/release-versioning-policy.md, CHANGELOG.md, README.md, docs/MCP_REBOOT_CHECKLIST.md
- Validation run: scripts/run_tests.kujo not present; bash tests/test_01_unit_harness.sh; bash tests/test_03_endpoint_integration.sh
- README updated: yes - linked the release/versioning policy from the reboot plan section
- Follow-ups: Future feature/fix loops should append changelog entries under Unreleased as they land
