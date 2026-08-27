# Cloudflare Worker target

The Cloudflare target is a reusable deployment adapter for Kujo-authored,
stateless MCP services. A product repository supplies its generated data and
registry contract; this framework supplies request admission, JSON-RPC envelope
handling, bounded responses, defensive headers, and the Workers module handler.

## Boundary

Product behavior remains in Kujo. The product generator reads reviewed inputs and
renders a deterministic Worker artifact from `src/cloudflare/worker_template.js`.
The generated JavaScript is what Workers executes; Cloudflare does not execute
Kujo source directly. Product repositories must not hand-edit generated tools,
schemas, catalog entries, recommendations, or safety logic.

## Adoption contract

1. Keep a pure Kujo protocol handler as the reference implementation.
2. Create a Kujo generator that injects only reviewed, serialized product data.
3. Track the generated Worker, integrity receipt, source metadata, and parity
   fixtures when the deployment requires reviewable output.
4. Run native and Worker fixtures for success, errors, limits, and ordering.
5. Use a `wrangler.jsonc` with no storage, network, or paid bindings unless the
   service has separately approved those capabilities.

The adapter enforces `/health`, `/mcp`, and the optional `/mcp/v1` compatibility
path, accepts JSON POST requests only, rejects oversized bodies and unknown
hostnames, returns deterministic JSON-RPC errors, and emits no request-body logs.

## Validation and deployment

The target itself is covered by `tests/feat_07_cloudflare_target.sh`. A consuming
repository should validate its generator, run its native tests, regenerate twice,
check the integrity receipt, run local Worker requests, and enforce its bundle
budget before `wrangler deploy`. Keep preview verification separate from the
production Custom Domain. Roll back by deploying the last known-good Worker
version and re-running health plus protocol fixtures.

The current Cloudflare Free plan documents 100,000 requests per day and 10 ms
CPU per invocation. These are operational assumptions, not guarantees; review
the official pricing and limits documentation before each production launch.
