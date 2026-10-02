# `mcp make` Reference

This page documents the repository-to-server generation flow implemented in the canonical MCP package.

## Command

The Kujo runtime exposes this generator as a first-class command that resolves the canonical MCP package and delegates to it:

```bash
cd my-project
kujo mcp make
```

Without a repository argument the command analyzes the current directory. Any repository can be analyzed explicitly:

```bash
kujo mcp make ./my-project
kujo mcp make /absolute/path/to/my-project
```

`kujo mcp make --help` prints the full generated command surface.

This first-party surface requires Kujo 1.7.0 or newer. The compatible direct invocation remains documented below for development and diagnostics.

## Options

```bash
kujo mcp make <repo-path> --out <generated-server-dir>
kujo mcp make <repo-path> --artifacts <artifacts-dir>
kujo mcp make <repo-path> --ai-sdk-path <ai-sdk-dir>
kujo mcp make <repo-path> --profile-only
kujo mcp make <repo-path> --artifacts-only
kujo mcp make <repo-path> --no-ai
kujo mcp make <repo-path> --validate
kujo mcp make <repo-path> --dry-run
```

Options apply whether or not an explicit repository is supplied; `kujo mcp make --validate` validates generation against the current directory. `--profile-only` and `--artifacts-only` are mutually exclusive.

`--artifacts-only` skips the server scaffold and writes only the repo profile and full artifact packet.

## How the Command Resolves the MCP Package

`kujo mcp make` does not duplicate generator logic in the runtime. It resolves the canonical `mcp` package in this order and delegates to its stable `mcp.kujo make` entrypoint through `kujo run` (no `--interpreter` flag required):

1. `KUJO_MCP_PATH` - explicit package-root override for development, tests, and nonstandard installations.
2. Walk-up discovery: the nearest ancestor of the target repository whose `kennel.toml` declares `[package] name = "mcp"`.
3. The target repository's `kennel.lock`: a locked `[[package]]` entry named `mcp` resolved inside `kennel_packages`.
4. The first-party ecosystem installation root: `$KUJO_INSTALL_ROOT/sources/mcp` (default `~/.kujo/sources/mcp`), populated by the Kujo installer.

If none of these resolve, the CLI fails with install guidance instead of silently substituting another implementation.

## Developer/Diagnostic Primitive

The direct primitive remains available for development and debugging:

```bash
kujo run mcp.kujo --interpreter make <repo-path>
```

This is an internal path, not the normal user-facing workflow.

## What `mcp make` Produces

1. Deterministic `repo-profile.json` with repository structure, language/framework hints, command detection, safety classifications, and confidence notes.
2. `mcp.manifest.json` with generated tool/resource/prompt surfaces and safe-command allowlist.
3. A runnable generated server scaffold (`src/server.kujo`) with:
   - read-only inspection tools
   - allowlisted safe-command tools only
   - resource list/read endpoints
   - `--self-check` mode for non-blocking validation
4. Artifact packet under `artifacts/` for repository review, safety review, validation tracking, and handoff.

## Safety Model

Generated capabilities are assigned to safety tiers:

- `read_only`
- `safe_command`
- `write_scaffold`
- `review_required`
- `blocked`

Default generated exposure:

- enabled: `read_only`, allowlisted `safe_command`
- disabled by default: `review_required`, `blocked`

Blocked-term policy for command inference includes terms like:

- `deploy`, `publish`, `release`, `migrate`, `reset`, `delete`, `remove`, `drop`, `push`, `upload`, `secret`, `token`, `key`

Sensitive paths are detected and reported by path only (for example `.env`, key material hints), without copying secret values.

## Validation Workflow

Validation includes:

- required file existence checks
- JSON validity checks (`repo-profile.json`, `mcp.manifest.json`, `fix-backlog.json`, `mcp-findings.json`)
- manifest consistency checks (tools/resources/prompts/safe command map)
- optional command checks under `--validate`:
  - generated server syntax check
  - generated server `--self-check`

All outcomes are recorded in `artifacts/validation-report.md` with explicit `passed`/`failed`/`skipped` statuses.

## Generated Output Structure

```text
<repo>/
  .mcp/
    generated-server/
      README.md
      repo-profile.json
      mcp.manifest.json
      mcp-server.json
      src/
        server.kujo
        tools/README.md
        resources/README.md
        prompts/*.md
        safety/policy.md
      tests/smoke.sh
      examples/*.md
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

## How This Differs from Manual Server Authoring

- `mcp make` gives a deterministic baseline scaffold and review packet quickly.
- Manual authoring is still useful for richer domain-specific tool implementations.
- Generated outputs are intended to be inspectable, editable, and repeatable, not opaque templates.

## Known Limitations

- AI enrichment is optional. It requires a resolvable Kujo AI SDK path and provider credentials; otherwise generation falls back to deterministic, provenance-labeled inference.
- Script safety classification is heuristic and should be reviewed for high-risk repositories.
