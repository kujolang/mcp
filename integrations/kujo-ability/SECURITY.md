# Security

Report suspected vulnerabilities privately to <contact@kujolang.ai>. Do not include credentials, customer content, approval tokens, or private receipts in a public issue.

The bridge is not an authorization boundary. The application gateway must authenticate discovery, authorize every invocation, enforce approvals and idempotency, isolate tenants, and issue canonical receipts. Non-loopback gateway URLs must use HTTPS.
