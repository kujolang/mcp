# Kujo Ability platform baseline — 2026-09-02

This is the immutable local baseline for the universal Ability platform implementation. It distinguishes repository evidence from intended work and records pre-existing worktree state so later changes are attributable.

## Repository inventory

| Repository | Baseline commit | Worktree at capture | Current Ability responsibility |
| --- | --- | --- | --- |
| `ability` | `ec054ad9a89beeafc4cb9713ca0026f9b9b4156d` | clean | Canonical `kujo.ability/v1` definitions, runtime semantics, schemas, compatibility, and consumer conformance |
| `mcp` | `465ff63c73b6b8eb599796c58237295d343b09f2` | clean | Ability-to-MCP projection, executable gateway adapter, STDIO host bridge, and host packaging |
| `cms` | `dca9f99cfd5ec4052e96e0c0d2bde1dcd0c9b19c` | clean | Reference application bindings, handlers, identity, authorization, approval, idempotency, audit, and CMS data |
| `ssg` | `4df56ef475e81a8bfe5c98c6bd7d419663877b6d` | clean | SSG-owned definitions and handlers; no certified SSG Ability Pack was proven in this baseline |
| `agents-sdk` | `913210f2baddddfac60bb7c1a45d4840cbe37acf` | pre-existing untracked maintenance-agent work | Native Ability tool projection and gateway adapter; do not mix unrelated maintenance-agent files into this project |
| `kujo-pi` | `9d977bdda760830e3cb00c1e0e756ab2d9acfe1e` | clean | Opt-in native Ability discovery/execution tools and independent host approval |
| `kujo` | `30f39c933fc0800356e688889b87ac65eeebfb68` | pre-existing network/DNS source and docs edits; branch behind upstream | Language/runtime and CLI ownership; unavailable for unrelated Ability CLI edits until the existing work is resolved |
| `kennel` | `b5e0cf290aa2af7a90b637a7c3bdb4324ea4f66d` | clean | Package/dependency resolution and trust policy; not the runtime Ability registry |
| `kujo-skills` | `db4a7f3c290b45a87339c4ab805ec34e7ca85c8c` | clean | Agent workflow instructions only |
| `kujolang.ai-source` | no commit | entirely untracked source snapshot | Possible public website source, but ownership and a committed baseline are not proven; website edits are blocked pending confirmation |

The expected `pi` and `kujolang.ai` directory names did not exist. The actual candidate checkouts are `kujo-pi` and `kujolang.ai-source`.

## Verified MCP baseline

- MCP package and server version: `1.1.0`.
- Canonical Ability dependency: `kujolang/ability` version `1.0.1`, pinned by `kennel.toml` and `kennel.lock` to commit `4aa354da8d02b027c459f692f69b523f96e97056`.
- Protocol projection: canonical identity, schemas, effects, digest, and receipt preservation.
- Executable topology: local STDIO bridge to an application-owned loopback or HTTPS gateway.
- Host artifacts at capture: Codex manifest, bundled MCP configuration, skill, Cursor/VS Code/generic configuration examples, and one STDIO bridge contract test.
- Baseline verification: `KUJO_BIN=/Users/robertdevore/2026/Kujolang/kujo-repos/kujo/target/release/kujo bash tests/run_all_tests.sh` passed on 2026-09-02.

## Claims not proven by this baseline

- Agent Plugins 1.0 conformance or portable root package.
- Public npm, Codex, Cursor, or VS Code marketplace availability.
- Clean-profile automated certification on current host versions.
- Streamable HTTP client support in the packaged bridge.
- OAuth onboarding or a Kujo-managed privileged execution service.
- SSO, SCIM, enterprise control plane, formal security review, or enterprise readiness.
- Certified SSG or broader ecosystem Ability Packs.
- Public website ownership, build, or claim verification.

## Ownership rule

`ability` owns portable semantic contracts. Applications own handlers, identity, authorization, policy, durable approval/idempotency/audit stores, and product data. `mcp` owns protocol projection and host transport packaging. Host overlays may improve installation and interaction but must not redefine an Ability or weaken application enforcement.

## Baseline maintenance

Do not rewrite this dated record. Add a new dated inventory or generated certification artifact when repository state changes. Current support claims belong in `ability-host-conformance.md`, not in this snapshot.
