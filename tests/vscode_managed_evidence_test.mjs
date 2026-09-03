import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = "certification/evidence/vscode-managed-2026-09-03.json";
const raw = await readFile(path, "utf8");
const evidence = JSON.parse(raw);

assert.equal(evidence.schema, "kujo.ability.managed-host-certification/v1");
assert.equal(evidence.host.name, "Visual Studio Code");
assert.match(evidence.host.version, /^\d+\.\d+\.\d+$/);
assert.equal(evidence.endpoint, "https://ability.kujolang.ai/mcp");
assert.match(evidence.source_revisions.mcp, /^[0-9a-f]{40}$/);
assert.match(evidence.source_revisions.ability_gateway, /^[0-9a-f]{40}$/);
assert.equal(evidence.authorization.flow, "authorization_code_pkce_s256");
assert.equal(evidence.worker_observations.authorization_cpu_ms, 14);
assert.equal(evidence.worker_observations.tools_list_cpu_ms, 10);
assert.equal(evidence.worker_observations.gateway_echo_cpu_ms, 5);
assert.equal(evidence.authorization.token_response_status, 200);
assert.equal(evidence.authorization.manual_bearer_copy, false);
assert.equal(evidence.authorization.credential_persisted_in_configuration, false);
assert.equal(evidence.authorization.native_callback_received, true);
assert.equal(evidence.authorization.native_code_exchange, true);
assert.equal(evidence.authorization.refreshable_session_created, true);
assert.equal(evidence.authorization.session_restored_after_host_restart, true);
assert.deepEqual(evidence.authorization.scopes, [
  "mcp:read",
  "ability:invoke",
  "approval:request",
  "audit:read",
]);
assert.equal(evidence.mcp.protocol_version, "2025-11-25");
assert.equal(evidence.mcp.connection_state, "Running");
assert.equal(evidence.mcp.discovered_tools, 2);
assert.deepEqual(evidence.mcp.tool_names, ["gateway_echo", "gateway_publish_preview"]);
assert.equal(evidence.mcp.invocation_api, "vscode.lm.invokeTool");
assert.equal(evidence.mcp.invoked_tool, "gateway_echo");
assert.equal(evidence.mcp.output_text, evidence.mcp.input_text);
assert.equal(evidence.mcp.receipt.outcome, "succeeded");
assert.match(evidence.mcp.receipt.id, /^evt_[0-9a-f]{32}$/);
assert.equal(evidence.mcp.receipt.tenant_id, "tenant_kujolang");
assert.match(evidence.mcp.receipt.subject_id, /^github:\d+$/);
assert.equal(evidence.mcp.receipt.ability_id, "gateway.echo");
assert.match(evidence.mcp.receipt.request_digest, /^[0-9a-f]{64}$/);
assert.doesNotMatch(raw, /bearer\s+[a-z0-9._~-]+/i);
assert.doesNotMatch(raw, /client_secret|access_token|refresh_token/i);

console.log("VS Code managed gateway evidence validated");
