---
name: using-kujo-ability
description: Discover and run Kujo Ability operations exposed by the configured application gateway.
---

# Using Kujo Ability

Use the `kujo-ability` MCP server to discover the tools available to the current authenticated principal.

- Prefer read-only tools when they satisfy the request.
- Explain the concrete effect before calling a write, delete, or external tool.
- Never invent approval IDs or idempotency keys.
- When a result requires approval, preserve its invocation ID. Ask for explicit user confirmation before calling `kujo_ability_issue_approval`, then retry with `_kujo.invocationId` and `_kujo.approvalId`.
- Supply `_kujo.idempotencyKey` for keyed operations. Reuse it only for the same operation and input.
- Treat the returned canonical receipt as execution evidence. Do not claim success when its status is not `succeeded`.

The gateway, not this skill, authenticates the principal, authorizes the operation, binds approvals, stores idempotency records, and audits execution.
