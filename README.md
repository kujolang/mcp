# MCP Server Framework

[![CI](https://github.com/kujolang/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/kujolang/mcp/actions/workflows/ci.yml)
![Language: Kujo](https://img.shields.io/badge/language-Kujo-2ea44f)
![Protocol: MCP](https://img.shields.io/badge/protocol-MCP-0969da)
![Deployment Baseline](https://img.shields.io/badge/profile-deployment%20baseline-brightgreen)

Build MCP (Model Context Protocol) servers in [Kujo](https://github.com/kujolang/kujo).

This project gives you a local MCP server foundation with configurable tools/resources, bounded file operations, and documented guardrails for controlled remote deployments.

## Why Use This

- Build MCP tools and resources directly in Kujo
- Start fast with a working server and demo workspace
- Ship safer defaults with path guards, request limits, and auth controls
- Scale from local development to reverse-proxy deployments

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
      "command": "/absolute/path/to/kujo-runtime",
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
- `docs/MCP_REBOOT_CHECKLIST.md`: implementation and hardening backlog

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

This repository is launch-honest as a local protocol-compatible MCP server foundation and remote-deployment baseline. Production use still requires environment-specific validation, especially for auth, ingress, and rate-limit settings described in `docs/production-deployment.md` and `docs/security-model.md`.
