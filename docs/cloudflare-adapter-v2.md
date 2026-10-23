# Cloudflare catalog adapter v2

The catalog adapter now consumes `__KUJO_MCP_DATA__` with `_search_index` and a
`registry` exported by the product's Kujo generator. Registry fields are `tools`,
`resources`, `prompts`, `resource_contents`, `prompt_templates`, `installations`,
`overview`, and `discovery`. This replaces duplicated schema/resource/prompt text
and repeated normalization. Update the catalog generator and framework pin together.
The ordinary framework demo, generated repo servers, and Ability gateway are unchanged.

The adapter bounds streamed UTF-8 request bytes before parsing, caps nesting,
rejects duplicate decoded keys, validates JSON-RPC/arguments and modern metadata,
rejects browser Origin, and accepts only the catalog custom hostname. It retains
legacy protocol/headerless clients and compact text plus structured tool content.
It does not implement distributed quotas, authentication, storage, subrequests,
execution, or live Cloudflare settings. Public deployment remains separately authorized.

`bash tests/feat_07_cloudflare_target.sh` covers the fixture contract;
`bash tests/run_all_tests.sh` covers the framework. Product HTTP differential,
stream-cancellation, quota/auth, catalog mutation and benchmark evidence lives in
`kujolang/kujolang-mcp` on `codex/mcp-production-hardening-20261023`.
