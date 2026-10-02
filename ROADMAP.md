# MCP Roadmap

This file is the authoritative roadmap for the repository. Historical review
backlogs and dated verification reports remain evidence, not the current plan.

## Current release: 1.3.0

- Enforce generated-server configuration for network, authentication, body,
  rate, tool, resource, timeout, and file-size controls.
- Serve the standard MCP JSON-RPC lifecycle and tools, resources, and prompts
  methods from both the demo and generated servers.
- Bound recursive traversal by entries, files, and bytes; skip symlinks; expose
  truncation metadata; and provide an opt-in, minute-bounded cache.
- Publish a canonical demo capability manifest and cover the live protocol with
  end-to-end smoke tests.
- Support fail-closed rate-limit attestation from a trusted shared gateway.
- Keep audit logs to bounded metadata and verify that arguments and untrusted
  tool names are never recorded.
- Validate the first-class `kujo mcp` command with Kujo 1.7.

## Next

- Add pagination/cursors for very large tool and resource catalogs.
- Add pluggable structured audit sinks while preserving metadata-only logging.
- Expand live host certificates when new Codex, Cursor, VS Code, or managed
  gateway versions are released.
- Evaluate standard MCP session management once a supported deployment needs
  durable sessions rather than the current stateless HTTP lifecycle.

## Release gates

Every release must pass `bash tests/run_all_tests.sh`, the first-class CLI
preflight, reproducible Ability package checks, and repository host-evidence
freshness checks. Publication remains separate from host certification: an
artifact is not claimed as installed or marketplace-available until that
external state is verified.
