import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = "certification/evidence/command-code-ollama-live-2026-09-13.json";
const raw = await readFile(path, "utf8");
const evidence = JSON.parse(raw);

assert.equal(evidence.schema, "kujo.ability.command-code-ollama-live/v1");
assert.equal(evidence.host.name, "Command Code");
assert.equal(evidence.host.version, "1.53.1");
assert.equal(evidence.host.mode, "local-only-byok");
assert.equal(evidence.host.command_code_account_session, false);
assert.equal(evidence.provider.name, "Ollama");
assert.equal(evidence.provider.model, "ollama/glm-5.3:cloud");
assert.equal(evidence.provider.ollama_cloud_authenticated, true);
assert.equal(evidence.mcp.transport, "stdio");
assert.equal(evidence.mcp.server, "kujo-ability");
assert.equal(evidence.mcp.tool_call_count, 1);
assert.equal(evidence.ability.id, "kujo.cms.site.inspect");
assert.equal(evidence.ability.status, "succeeded");
assert.equal(evidence.ability.policy_outcome, "allow");
assert.equal(evidence.ability.audit_written, true);
assert.match(evidence.ability.invocation_id, /^mcp-[0-9a-f-]{36}$/);
assert.match(evidence.ability.receipt_id, /^receipt-[0-9a-f]{24}$/);
assert.equal(evidence.command_code_observation.model_request_start, evidence.provider.model);
assert.equal(evidence.command_code_observation.run_exit_code, 0);
assert.equal(evidence.secrets_persisted, false);
assert.doesNotMatch(raw, /bearer\s+[a-z0-9._~-]+/i);
assert.doesNotMatch(raw, /"(?:api_key|access_token|refresh_token|gateway_token)"\s*:/i);

console.log("Command Code + Ollama live Ability evidence validated");
