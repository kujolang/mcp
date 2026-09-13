# Command Code gap analysis

## Works without bespoke code

- Dynamic Ability discovery and schema projection over STDIO MCP.
- Direct Streamable HTTP MCP and OAuth/PKCE against the managed gateway.
- Structured calls, outputs, errors, effects metadata, receipts, cancellation, keyed idempotency, and externally issued approvals.
- Automatic availability of newly exposed Abilities after the next `tools/list`.
- Canonical Kujo Agent Skills through `.agents/skills` or `--skill`.
- Host restart: configuration is project-persistent; the bridge is stateless and rediscovers tools.
- Gateway restart: each bridge operation uses a fresh HTTP request; failures are explicit MCP errors and later calls can recover.

## Partial support

- Cancellation aborts the bridge request, but Ability v1 cannot guarantee hard interruption or resumability inside every handler.
- Host/session/agent/model identity can be carried as invocation metadata by native projections, but Command Code does not export a trustworthy generic MCP context envelope.
- Effects are preserved as metadata and receipts; Command Code does not natively render or authorize from Kujo's effect vocabulary.
- Command Code session persistence and Kujo application persistence coexist, but are not one transaction.
- Agent delegation can call MCP tools, but Command Code only supports one subagent level and does not implement Kujo's Chain of Command semantics.

## Missing portable host concepts

Ability v1 is intentionally an operation contract. It does not model host lifecycle, bidirectional capability negotiation, candidate completion, host event streams, host-native agent spawning, or verified model/session identity. These belong in a separate generic Host Capability contract, not in Command Code-named fields and not in MCP transport semantics.

The most valuable candidate is a fail-closed `HostCompletionGate`: a host declares support; sends candidate completion plus stable run identity and evidence; Kujo returns pass, revise, or deny; the host resumes work with bounded, observable attempts. It must define failure policy and recovery. Command Code mods are experimental, fail-open on hook errors, execute unsandboxed, and cap continuation, so they are not yet a dependable implementation.

## Unnecessary host-specific features

- A `kujo-commandcode` implementation of Kujo primitives.
- Per-Ability Command Code tool registration.
- Command Code-specific copies of Spec, Eval, Dispatch, RunLedger, Watchdog, Shipcheck, Fence, Muzzle, Leash, or Jidoka.
- Hand-copied Command Code skills.
- A mod used merely to wrap existing MCP tools.
- Mapping Command Code permission prompts to Kujo approvals.

## Worthwhile host-specific value

Today: only exact configuration generation and documentation. Later, if a stable API exists: a disposable projection of a generic Host Capability contract for lifecycle telemetry, verified context exchange, native workers, and completion gating. Such a projection must contain no Kujo business logic, negotiate every optional capability, fail explicitly, and be safe to remove.

