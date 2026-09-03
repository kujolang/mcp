import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = "certification/evidence/vscode-managed-2026-09-02.json";
const raw = await readFile(path, "utf8");
const evidence = JSON.parse(raw);

assert.equal(evidence.schema, "kujo.ability.managed-host-certification/v1");
assert.equal(evidence.host.name, "Visual Studio Code");
assert.match(evidence.host.version, /^\d+\.\d+\.\d+$/);
assert.equal(evidence.endpoint, "https://ability.kujolang.ai/mcp");
assert.match(evidence.source_revisions.mcp, /^[0-9a-f]{40}$/);
assert.match(evidence.source_revisions.ability_gateway, /^[0-9a-f]{40}$/);
assert.equal(evidence.authorization.flow, "authorization_code_pkce_s256");
assert.equal(evidence.authorization.token_response_status, 200);
assert.equal(evidence.authorization.manual_bearer_copy, false);
assert.equal(evidence.authorization.credential_persisted_in_configuration, false);
assert.equal(evidence.mcp.connection_state, "Running");
assert.ok(evidence.mcp.discovered_tools >= 1);
assert.equal(evidence.mcp.invoked_tool, "gateway_echo");
assert.equal(evidence.mcp.output_text, evidence.mcp.input_text);
assert.equal(evidence.mcp.receipt_outcome, "succeeded");
assert.match(evidence.mcp.receipt_id, /^evt_[0-9a-f]{32}$/);
assert.doesNotMatch(raw, /bearer\s+[a-z0-9._~-]+/i);
assert.doesNotMatch(raw, /client_secret|access_token|refresh_token/i);

console.log("VS Code managed gateway evidence validated");
