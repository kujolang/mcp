# Kujo CMD threat model

## Scope and boundaries

```text
untrusted prompt/repository
  ↓
Command Code model + permission UI       host boundary
  ↓ local STDIO MCP
Kujo local Ability host                  policy boundary
  ↓ canonical argument-array process
Kujo product CLI                         effect boundary
  ↓
local artifacts + append-only receipts
```

The installer and updater cross npm/GitHub acquisition boundaries. Normal
execution is local. Watchdog, when enabled, is loopback-only. A compromised
local OS user is outside the isolation promise.

| Threat | Mitigation | Residual risk |
| --- | --- | --- |
| Malicious tool descriptions/schema poisoning | Catalog is package-owned, bounded, validated, versioned, and digest-addressed | Treat descriptions and results as untrusted model input |
| Capability spoofing | Exact Ability ID/version/digest in discovery and receipt; source commits pinned and recorded | Git commit trust follows reviewed upstream refs |
| Prompt injection from repository | JSON schema, profile exposure, separate policy, no shell interpolation | Read tools can still return malicious text to the model |
| Approval bypass/confused deputy | Non-read effects fail closed; approval is human CLI-only and bound to principal/digest/input/invocation/expiry | Command Code permission is not itself Kujo approval |
| Approval replay | Atomic serialized state and one-time consumption | Local state deletion invalidates history, not completed effects |
| Duplicate effects | Required idempotency key and persisted receipt replay | Non-idempotent upstream tools must not be marked keyed without proof |
| Path traversal/symlink escape | Workspace/file paths remain under project; symlink workspace roots rejected | Product-specific internal path handling remains its owner's boundary |
| Shell execution/injection | Child processes receive argument arrays; no shell; output/time bounded | Eval intentionally runs configured commands and therefore requires approval |
| Network escalation | Default catalog is local; Watchdog accepts loopback HTTP only; RAG is local | Dispatch/RAG product configuration may itself name providers when expanded |
| Forged host/model identity | Metadata is labeled caller-asserted | A future host-attestation contract is needed for trusted identity |
| Receipt tampering | Mode-0600 local files, definition digest, append-only JSONL | Receipts are not signed against a malicious local user |
| Restart/races | State survives process restart; in-process state transactions are serialized | Multiple simultaneous MCP server processes do not yet share an OS file lock |
| Cancellation ambiguity | Abort terminates child and emits cancelled receipt | External effects may race termination; inspect before retry |
| Source/update compromise | Exact public commits, detached checkout, no lifecycle scripts from source repos | Commit allowlist updates require maintainer review |
| Host/mod impersonation | No mod is installed; exact local MCP command path is generated | Untrusted projects can contain competing MCP configuration |

Security rules are enforced by the local Ability host, not inferred from MCP
annotations. Profiles reduce discovery but never grant authority. New
write/delete/external catalog entries must remain approval-gated and receive
idempotency, path, concurrency, restart, and failure tests.
