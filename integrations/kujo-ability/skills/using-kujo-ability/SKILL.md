---
name: using-kujo-ability
description: Discover and run Kujo Ability operations exposed by the configured application gateway.
---

# Using Kujo Ability

Use the `kujo-ability` MCP server to discover the tools available to the current authenticated principal.

- Prefer read-only tools when they satisfy the request.
- Explain the concrete effect before calling a write, delete, or external tool.
- Never invent approval IDs or idempotency keys.
- When a result requires approval, preserve its invocation ID and stop. Approval must come from a trusted host or out-of-band application UI; this MCP server cannot issue it. Retry only after the host supplies the resulting `_kujo.approvalId`.
- Supply `_kujo.idempotencyKey` for keyed operations. Reuse it only for the same operation and input.
- Treat the returned canonical receipt as execution evidence. Do not claim success when its status is not `succeeded`.

The gateway, not this skill, authenticates the principal, authorizes the operation, binds approvals, stores idempotency records, and audits execution.
