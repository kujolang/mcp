# MCP Server Framework

[![Version](https://img.shields.io/badge/version-1.0.0-black)](https://github.com/kujolang/mcp)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)
[![built with Kujo](https://img.shields.io/badge/built%20with-Kujo-white.svg)](https://github.com/kujolang/kujo)
[![CI](https://github.com/kujolang/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/kujolang/mcp/actions/workflows/ci.yml)
![Protocol: MCP](https://img.shields.io/badge/protocol-MCP-0969da)

Build MCP (Model Context Protocol) servers in [Kujo](https://github.com/kujolang/kujo).

This project gives you a local MCP server foundation with configurable tools/resources, bounded file operations, and documented guardrails for controlled remote deployments.

## Readiness at a Glance

`mcp` is ready to use as a local MCP server framework, demo implementation, and guarded repo-specific server generator. It is not a universal enterprise certification package by itself; remote production use still needs environment-specific review of auth, network ingress, secret custody, observability, and capacity limits.

| Area | Current status |
|------|----------------|
| Local MCP server | Ready for local development and integration testing |
| File tools/resources | Guarded by configured roots, read-only patterns, size limits, and argument validation |
| `mcp make` generator | Ready for deterministic repo profiling, generated scaffolds, and review artifacts |
| Remote deployment | Baseline guidance and config template provided; operators must validate their own ingress, TLS, auth, and rate limiting |
| Enterprise operations | Strong foundation, but not a completed managed platform with SSO, centralized audit retention, distributed limits, or formal security certification |

## Why Use This

- Build MCP tools and resources directly in Kujo
- Start fast with a working server and demo workspace
- Ship safer defaults with path guards, request limits, and auth controls
- Scale from local development to reverse-proxy deployments
- Generate reviewable repo-specific MCP scaffolds that showcase Kujo's configuration, safety, and artifact-generation strengths

## Who This Is For

- Teams building MCP servers and agent tooling in Kujo
- Developers who want a practical starting point with deployment guardrails
- Projects that need secure file access patterns and configurable runtime controls

## Who This Is Not For

- Teams looking for a fully managed hosted MCP platform
- Workloads requiring built-in distributed/global rate limiting inside this service process
- Projects that cannot run a reverse proxy and external secret management for remote deployment

## Highlights

- Plugin-style tool/resource registration in dedicated modules
- Multi-root workspace support via `permissions.allowed_directories`
- Runtime endpoint gating via `tools.enabled` and `resources.enabled`
- Request guardrails with body-size and per-minute rate limits
- Config-driven tool timeout controls
- Security and integration regression test suites
- Deployment baseline template included

## Quick Start

### Local Run

```bash
bash scripts/run_server.sh
```

Default endpoint: `http://127.0.0.1:8931/mcp/v1`

Expected health response shape:

```json
{"status":"ok","server":"mcp-demo","version":"1.0.0"}
```

If you want to run the binary directly, resolve the runtime path first:

```bash
bash scripts/find_kujo_runtime.sh
```

### Copilot MCP Config (stdio)

```json
{
  "mcpServers": {
    "mcp": {
      "type": "stdio",
      "command": "kujo-runtime",
      "args": ["run", "/path/to/mcp/server.kujo", "--interpreter"]
    }
  }
}
```

The binary configured in `command` must be the Kujo language runtime binary that supports the `run` subcommand.

Wrapper note: the current top-level `mcp.kujo` surface is intentionally thin. `help` / `--help` work, `version` / `--version` are sparse/noisy, and `mcp make --help` / `mcp make --version` are unsupported.

## Generate Repo-Specific MCP Server

`mcp make` analyzes a local repository and generates a safe, repo-specific MCP server plus review artifacts.

Current invocation in this primitive:

```bash
kujo run mcp.kujo --interpreter make ./repo-folder
```

Equivalent target command shape (runtime command-table gap tracked in findings):

```bash
kujo mcp make ./repo-folder
```

Supported options:

```bash
kujo run mcp.kujo --interpreter make ./repo-folder --out ./repo-folder/.mcp/generated-server
kujo run mcp.kujo --interpreter make ./repo-folder --artifacts ./repo-folder/.mcp/artifacts
kujo run mcp.kujo --interpreter make ./repo-folder --profile-only
kujo run mcp.kujo --interpreter make ./repo-folder --artifacts-only
kujo run mcp.kujo --interpreter make ./repo-folder --no-ai
kujo run mcp.kujo --interpreter make ./repo-folder --validate
kujo run mcp.kujo --interpreter make ./repo-folder --dry-run
```

`--artifacts-only` skips the server scaffold and produces only the profile and review artifacts.

Default output layout:

```text
repo-folder/
  .mcp/
    generated-server/
      README.md
      mcp.manifest.json
      repo-profile.json
      mcp-server.json
      src/
        server.kujo
        tools/
        resources/
        prompts/
        safety/
      tests/
      examples/
    artifacts/
      README.md
      repo-map.md
      mcp-surface-plan.md
      safety-review.md
      validation-report.md
      fix-backlog.md
      fix-backlog.json
      agent-handoff.md
      patchbrief.md
      shipcheck.md
      howto.md
      mcp-findings.md
      mcp-findings.json
```

Safety defaults in generated servers:

- Read-only inspection tools are enabled.
- Safe commands are allowlisted and fixed in `mcp.manifest.json`.
- Arbitrary shell command input is not exposed.
- Risky commands are marked blocked/review-required in artifacts.
- Sensitive files are recorded by path only; secret values are not copied into generated outputs.
- Generated resource reads are constrained to the analyzed repository, generated server directory, and artifact directory.
- Generated POST endpoints enforce a bounded request body size.

See detailed command reference: `docs/mcp-make.md`.

## Remote Deployment Baseline

1. Copy `mcp-server.production.example.json` to your runtime `mcp-server.json`.
2. Set a strong value for `auth.token` outside source control.
3. Run behind a TLS-terminating reverse proxy.
4. Keep ingress restricted to trusted clients/services.
5. Use shared/distributed throttling at the gateway for multi-instance deployments.

See full deployment guidance: `docs/production-deployment.md`.

## Documentation

- `demo/README.md`: guided demo workspace for first-time users
- `docs/mcp-reference.md`: endpoint, tool, resource, and validation reference
- `docs/mcp-make.md`: repository analysis and generated-server command reference
- `docs/security-model.md`: trust boundaries, threat model, and hardening defaults
- `docs/example-integrations.md`: local and remote integration examples
- `docs/production-deployment.md`: operational deployment baseline and scaling notes
- `docs/contributing-agent-workflow.md`: contributor workflow and completion criteria
- `docs/release-versioning-policy.md`: release and versioning conventions
- `docs/contributing-agent-workflow.md`: implementation and validation workflow
- `docs/MCP_REVIEW_BACKLOG_2026_06_19.md`: next-session production-readiness backlog

## Project Structure

```text
mcp/
├── server.kujo
├── mcp.kujo
├── mcp-server.json
├── mcp-server.production.example.json
├── src/
│   ├── core/framework.kujo
│   ├── server/runtime.kujo
│   ├── tools/registry.kujo
│   └── resources/registry.kujo
├── tests/
├── docs/
└── demo/
```

## Testing

```bash
bash tests/run_all_tests.sh
```

## Readiness

This repository is launch-honest as a local protocol-compatible MCP server foundation, repo-specific scaffold generator, and remote-deployment baseline. Production use still requires environment-specific validation, especially for auth, ingress, rate-limit, monitoring, backup, and incident-response settings described in `docs/production-deployment.md`, `docs/security-model.md`, and `docs/MCP_REVIEW_BACKLOG_2026_06_19.md`.
