# Release and Versioning Policy

This document defines how versions are assigned and how changelog entries are written for this repository.

## Versioning Strategy

- Use semantic versioning: `MAJOR.MINOR.PATCH`.
- `MAJOR`: incompatible API/protocol or behavior changes.
- `MINOR`: backward-compatible features, tools/resources additions, and workflow improvements.
- `PATCH`: backward-compatible fixes, docs corrections, and security hardening that does not break integrations.

## Release Triggers

Create a release when one of the following is true:

- A completed checklist milestone meaningfully changes runtime behavior.
- A security fix should be distributed independently.
- A batch of user-visible features or integration improvements is complete.

## Changelog Conventions

Maintain a top-level `CHANGELOG.md` with date-stamped release entries.

Each release entry should include:

- Version and date.
- Summary paragraph.
- Changes grouped by type:
  - Added
  - Changed
  - Fixed
  - Security
  - Docs

For each bullet, include:

- Checklist item ID when applicable.
- A concise behavior-oriented statement.
- Notes for migrations or follow-up work when needed.

## Pre-Release Checklist

Before tagging a release:

1. Ensure all intended checklist items are marked complete with Work Log entries.
2. Run `bash tests/run_all_tests.sh`.
3. Confirm README and docs reflect current behavior.
4. Confirm CI checks pass on the release branch.
5. Update `CHANGELOG.md` with final release notes.

### First-class `kujo mcp` release handoff

The first MCP release that makes `kujo mcp make` the default user path depends
on a published Kujo runtime containing the command group. Prepare that handoff
in this order:

1. Publish and artifact-verify the Kujo runtime release. Do not point MCP CI at
   an unreleased branch or mutable source revision.
2. Run the command and installed-package resolution preflight against the exact
   reviewed runtime binary:

   ```bash
   EXPECTED_KUJO_VERSION=vX.Y.Z \
     KUJO_BIN=/path/to/released/kujo \
     bash scripts/preflight-first-class-cli-release.sh
   ```

3. Update the exact Kujo version used by `.github/workflows/ci.yml`.
4. Refresh Ability host certification with
   `scripts/certify-ability-hosts.mjs` before changing certified pathspecs.
5. Add `tests/feat_08_first_class_cli.sh` to `tests/run_all_tests.sh`, regenerate
   the compatibility matrix, and run the complete suite.
6. Remove the Kujo 1.6 compatibility qualification from user documentation
   only after the released-runtime preflight and CI both pass.

Until these steps are complete, the direct `mcp.kujo` invocation remains the
released-runtime-compatible path. The native command implementation and its
standalone regression suite can still be validated from a reviewed Kujo source
build without changing published-version claims.

## Tagging and Publishing

- Tag format: `v<MAJOR>.<MINOR>.<PATCH>` (for example: `v0.2.0`).
- Create the tag from a green commit on `main`.
- Publish release notes from the corresponding changelog entry.

## Breaking-Change Communication

For major releases:

- Add a dedicated migration section in release notes.
- Highlight endpoint/tool/resource compatibility impacts.
- Call out config changes required for safe upgrades.
