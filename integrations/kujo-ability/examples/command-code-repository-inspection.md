# Example: repository inspection from Command Code

This exercises a real read Ability, preserves correlation, and requires no Command Code extension.

1. Start the application gateway that exposes `kujo.repo.inspect.run` with a declared read effect.
2. In `integrations/kujo-ability`, run `node bin/kujo-ability.mjs connect --host command-code` with `KUJO_ABILITY_GATEWAY_URL` set.
3. Start Command Code in execution mode and ask: “Use the Kujo repository inspection Ability on this workspace. Set `_kujo.invocationId` to `command-code-inspect-001`. Report the receipt ID and verification result.”
4. Confirm discovery exposes the exact input/output schema and `kujo/effects` contains the repository read effect.
5. Confirm the structured response contains a succeeded canonical receipt correlated to `command-code-inspect-001`.

For a controlled modification, create a Spec first, invoke the application-owned write Ability with a stable idempotency key and externally issued approval ID, run the verification Ability, and retain both receipts in RunLedger. If verification fails, do not fabricate success: keep the failed receipt and return to implementation. A dangerous write without the trusted approval must return `approval_required`.
