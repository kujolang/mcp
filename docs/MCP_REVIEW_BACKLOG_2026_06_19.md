# MCP Review Backlog - 2026-06-19

## Purpose

This backlog captures the next high-value work after the 2026-06-19 production-readiness review. The current project is a strong local MCP framework, demo server, and repo-specific scaffold generator, but it should not be marketed as universally enterprise-complete until the remaining operational and platform gaps below are addressed.

## Current Verdict

- Local framework readiness: strong.
- Generated-server readiness: improved with resource-root checks, bounded request bodies, manifest validation, and review artifacts.
- Remote production readiness: baseline only; requires deployment-specific auth, TLS, ingress, monitoring, and rate-limit validation.
- Enterprise platform readiness: not complete; missing managed identity integrations, centralized audit retention, distributed throttling, and formal security review.

## Next Work Items

### P0 - Production Safety

1. Add generated-server auth and host-policy support
   - Why: generated servers currently bind locally and are intended for local use; remote exposure should have the same auth/host controls as the demo server.
   - Acceptance: generated `mcp-server.json` drives auth, host, request-size, and rate-limit behavior in generated `src/server.kujo`.
   - Validation: endpoint tests for authorized, unauthorized, host mismatch, over-limit body, and disabled resources/tools.

2. Add distributed rate-limit guidance plus adapter hook
   - Why: the built-in limiter is process-local and should not be mistaken for a multi-instance enterprise control.
   - Acceptance: docs and config expose a clear gateway/shared-limiter integration point without implying bundled distributed throttling.
   - Validation: docs review plus tests that process-local limits remain deterministic.

3. Add audit-safe log redaction
   - Why: logs should not accidentally preserve large payloads, tokens, or sensitive request details.
   - Acceptance: log entries include tool/resource names, status, timing, and bounded metadata only.
   - Validation: security regression test with token-like payloads and oversized request bodies.

### P1 - Performance and Scale

4. Add bounded recursive traversal limits by file count and byte budget
   - Why: `grep_text`, `search_files`, and `list_tree_recursive` use step budgets but should also bound total scanned files/bytes for large workspaces.
   - Acceptance: config supports max files scanned and max bytes scanned; responses identify truncation vs timeout.
   - Validation: synthetic large-tree integration test.

5. Add optional cached file-tree index for read-heavy sessions
   - Why: repeated agent searches over the same allowed roots can rescan unchanged trees.
   - Acceptance: cache is disabled by default, invalidates predictably, and never expands allowed roots.
   - Validation: tests for cache hit, cache invalidation, and permission-boundary preservation.

### P1 - Functionality

6. Add a formal tool capability manifest for the demo server
   - Why: generated servers have `mcp.manifest.json`; the demo server should expose an equivalent canonical manifest for discoverability.
   - Acceptance: demo manifest includes tools, resources, prompts, safety tiers, and config dependencies.
   - Validation: schema contract test and endpoint/resource exposure test.

7. Add prompt listing endpoints for generated servers
   - Why: generated manifests include prompts, but the generated runtime does not expose prompt list/read endpoints yet.
   - Acceptance: generated server supports prompt discovery and prompt content reads.
   - Validation: generated-server integration test for prompt list/read.

8. Add richer generated server smoke tests
   - Why: self-check proves startup metadata only; endpoint smoke tests would prove live behavior.
   - Acceptance: generated `tests/smoke.sh` can start the server, call health/tools/resources, and stop cleanly.
   - Validation: `mcp make --validate` records the smoke result.

### P2 - Presentation and Adoption

9. Add a polished guided demo script
   - Why: this repo is meant to showcase Kujo; the first-run demo should make the value obvious in minutes.
   - Acceptance: one command generates a sample MCP server and points users to the key artifacts.
   - Validation: clean-machine walkthrough from README.

10. Add an architecture diagram
   - Why: users should quickly understand the demo runtime, generated-server path, and safety layers.
   - Acceptance: README or docs diagram covers config, tool registry, resource registry, path guards, make pipeline, and artifacts.
   - Validation: docs review.

11. Add release checklist tied to readiness language
   - Why: "enterprise-grade" claims need repeatable evidence.
   - Acceptance: release checklist maps claims to tests, docs, and explicit non-goals.
   - Validation: checklist can be completed without relying on tribal knowledge.

## Root Layout Notes

Root-level `server.kujo`, `mcp.kujo`, `mcp-server.json`, and `mcp-server.production.example.json` remain intentional high-signal entry/config files. Runtime logs such as `mcp-calls.log`, `server.log`, and `test_output.log` are ignored and should remain untracked.

## Suggested First Step Next Session

Start with P0 item 1: make generated servers consume their generated config for auth, host, request, tool, and resource controls. This will make the generated path match the main demo server's security posture more closely and gives the cleanest next proof point for production-readiness messaging.
