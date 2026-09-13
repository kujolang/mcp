# Command Code Ability integration threat model

## 1. Scope and assumptions

Scope is Command Code 1.53.1 → MCP (HTTP or the packaged STDIO bridge) → Ability Gateway/application gateway → Ability runtime. Kujo primitive internals and Command Code's model providers are dependencies, not reimplemented components. The host and model are potentially confused deputies; MCP descriptions, tool inputs, repository content, and remote responses are untrusted. A trusted gateway policy authority and approval issuer exist outside the agent process. Availability attacks by a fully compromised local user are out of scope.

Assets: gateway credentials, approval tokens, principal and host identity, Ability definitions/digests, input/output, policy decisions, receipts/artifacts, audit trails, application state, filesystem/process/network authority. Security objectives: least privilege, authentic definitions and receipts, no approval bypass/replay, effect visibility, bounded transport, explicit degradation, and correlation across calls.

## 2. System model and boundaries

```text
Untrusted prompt/repository
  ↓
Command Code model + local permissions [host trust boundary]
  ↓ stdio child process or HTTPS OAuth MCP
Kujo MCP projection             [transport boundary]
  ↓ authenticated HTTPS/loopback REST when STDIO
Ability Gateway                 [authorization boundary]
  ↓ exact digest/version, policy, approval, idempotency
Ability handler                 [effect boundary]
  ↓ canonical receipt/artifact
Gateway → MCP structured result → host
```

The STDIO child inherits environment credentials, so project configuration must never embed them. Remote HTTP crosses network and tenant boundaries and requires TLS/OAuth. Discovery is principal-filtered but does not grant invocation. The Ability runtime, not host metadata or MCP annotations, authorizes effects.

## 3. Threats and mitigations

| Threat | Impact | Existing mitigation | Residual / required control |
| --- | --- | --- | --- |
| Malicious descriptions/schema poisoning | Prompt influence, hidden capabilities | Descriptor validation, bounded catalog, exact schemas/digests | Treat all descriptions as data; gateway allowlists and size limits |
| Untrusted MCP server or host impersonation | Credential/data theft | Explicit server config, HTTPS, OAuth PKCE, loopback-only plaintext | Verify deployment origin; do not install unknown project mods/config |
| Capability spoofing or stale definition | Wrong handler/effects | Ability ID/version/digest validation and receipt provenance | Pin/alert on unexpected digest changes for high-risk automation |
| Approval bypass/confused deputy | Unauthorized mutation | Runtime policy, server-bound approvals, no in-band approval tool | Approval issuer must be separate and bind principal/ability/input/expiry |
| Approval replay | Repeat effects | One-time consumption and idempotency | Persist consumption atomically across gateway restart |
| Forged effect metadata | Misleading host | Runtime authorizes independently; receipt is canonical | UI metadata is advisory; validate receipt at trust boundary |
| Receipt tampering | False audit history | Authenticated gateway channel and definition digest | Signed receipts remain a future option across untrusted storage |
| Tool/input prompt injection | Arbitrary effect request | JSON schema, policy, surface exposure, host permission | Handlers must treat repository/network content as untrusted |
| Credential leakage | Gateway compromise | Connector writes env references, redacts diagnostics | Least-privilege short-lived credentials; no approval-minting secret in host |
| Filesystem/shell/network escalation | Host compromise | Effects declared; runtime policy; Command Code permission rules | Do not equate annotations with sandboxing; constrain handler runtime |
| Cancellation race / killed operation | Unknown completion | MCP abort and explicit error; receipts/audit server-side | Query by invocation ID before retry; handlers need cooperative cancellation where required |
| Concurrent/repeated calls | Duplicate or conflicting effects | Invocation IDs, keyed idempotency, approval consumption | Transactional gateway stores and same-input key binding |
| Restart/stale identity | Replay or lost state | Gateway persistence and canonical receipts; stateless bridge | Host session identity is advisory until a verified host-context contract exists |
| Experimental mod failure | Completion/authorization bypass | No mod shipped | Any future lifecycle bridge must fail closed and be capability-negotiated |
| Discovery leak | Sensitive capability names/schema | Principal-visible surface exposure | Keep discovery authorization separate and minimize descriptions |
| Oversized/non-JSON response | memory/parser abuse | 1 MiB bridge bound and strict JSON | Equivalent limits required on direct HTTP gateway |

## 4. Security requirements and validation

- Kujo policy, approval, identity, idempotency, effects, and receipt logic remain server-side.
- No ordinary tool call can issue its own approval.
- Reject non-loopback plaintext, embedded URL credentials/query/fragment, invalid descriptors, duplicate names, oversized/non-JSON responses, and unknown tools.
- Preserve Ability ID/version/digest/effects in discovery and invocation/receipt identity in results.
- Treat Command Code permissions as defense in depth only.
- Use capability negotiation and fail-closed behavior for any future lifecycle/completion bridge.

Automated bridge tests cover descriptor fidelity, read invocation, authorization header handling, cancellation, approval-required denial, no self-approval tool, valid external approval, replay denial, and idempotency conflict. Connector tests cover secret-free configuration and non-destructive lifecycle. The remaining live-host limitation is an authenticated Command Code model-driven invocation; no credential was available in the clean test environment.

