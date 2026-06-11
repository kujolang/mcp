# `mcp make` Reference

This page documents the repository-to-server generation flow implemented in this MCP primitive.

## Command

Current invocation:

```bash
kujo run mcp.kujo --interpreter make <repo-path>
```

Target shape:

```bash
kujo mcp make <repo-path>
```

The runtime command-table gap is tracked in generated `mcp-findings.*` artifacts.
The current wrapper surface is intentionally minimal; `mcp make --help` and `mcp make --version` are unsupported and exit with an unknown-flag error.

## Options

```bash
kujo run mcp.kujo --interpreter make <repo-path> --out <generated-server-dir>
kujo run mcp.kujo --interpreter make <repo-path> --artifacts <artifacts-dir>
kujo run mcp.kujo --interpreter make <repo-path> --profile-only
kujo run mcp.kujo --interpreter make <repo-path> --artifacts-only
kujo run mcp.kujo --interpreter make <repo-path> --no-ai
kujo run mcp.kujo --interpreter make <repo-path> --validate
kujo run mcp.kujo --interpreter make <repo-path> --dry-run
```

Minimum supported surface:

- `make <repo-path>`
- `make <repo-path> --out <dir>`

`--artifacts-only` skips the server scaffold and writes only the repo profile and full artifact packet.

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

- Native `kujo mcp make` command dispatch is not yet in the runtime command table; use `kujo run mcp.kujo --interpreter make ...`.
- AI enrichment is optional and currently not wired in this primitive path; inference is deterministic and labeled accordingly.
- Script safety classification is heuristic and should be reviewed for high-risk repositories.

## Future: Native Runtime Command

The intended long-term invocation is:

```bash
kujo mcp make ./repo-folder
```

This requires a new `Mcp` variant in the Kujo runtime `Commands` enum (`src/main.rs`). The required Rust source change pattern:

```rust
// In the Commands enum:
Mcp {
    #[command(subcommand)]
    action: McpAction,
}

// New sub-enum:
#[derive(Subcommand)]
enum McpAction {
    Make {
        /// Path to the target repository
        repo: PathBuf,
        /// Custom output directory
        #[arg(long)]
        out: Option<PathBuf>,
        /// Custom artifacts directory
        #[arg(long)]
        artifacts: Option<PathBuf>,
        /// Profile generation only
        #[arg(long)]
        profile_only: bool,
        /// Artifacts only (skip server scaffold)
        #[arg(long)]
        artifacts_only: bool,
        /// Disable AI enrichment
        #[arg(long)]
        no_ai: bool,
        /// Run extended command validations
        #[arg(long)]
        validate: bool,
        /// Dry run (no file writes)
        #[arg(long)]
        dry_run: bool,
    },
}

// In the match arm:
Commands::Mcp { action } => match action {
    McpAction::Make { repo, out, artifacts, profile_only, artifacts_only, no_ai, validate, dry_run } => {
        // Delegate to: kujo run mcp.kujo --interpreter make <args>
    }
},
```

Until this lands in a Kujo runtime release, the reliable invocation remains:

```bash
kujo run mcp.kujo --interpreter make ./repo-folder
```

For Kennel users, a `make` script alias is available in `kennel.toml` as a convenience wrapper.
