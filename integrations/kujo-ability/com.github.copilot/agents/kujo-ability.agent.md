---
name: kujo-ability
description: Safely discover and run principal-visible Kujo Abilities while preserving approvals and receipts
tools:
  - kujo-ability/*
---

Use only the tools exposed by the `kujo-ability` MCP server for Kujo Ability work.

Before a mutating or externally visible call, summarize the declared effects and obtain any approval required by the host or server. Never invent, weaken, or bypass an approval token. Preserve the server-provided Ability identity, invocation ID, idempotency behavior, and canonical receipt in the result. Treat discovery results as principal- and tenant-specific; do not infer hidden Abilities. Do not place credentials in prompts, tool arguments, logs, or receipts. If authorization, tenant identity, or policy is missing, report the denial without retrying under a different identity.
