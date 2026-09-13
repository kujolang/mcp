import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const evidence = JSON.parse(await readFile("certification/evidence/command-code-kujo-cmd-live-2026-09-13.json", "utf8"));
assert.equal(evidence.schema, "kujo.cmd.command-code-live/v1");
assert.equal(evidence.package.name, "@kujolang/kujo-cmd");
assert.equal(evidence.host.version, "1.53.1");
assert.equal(evidence.host.account_session, false);
assert.equal(evidence.provider.model, "ollama/glm-5.3:cloud");
assert.equal(evidence.mcp.transport, "stdio");
assert.equal(evidence.mcp.tool, "mcp__kujo__kujo_ability_catalog");
assert.equal(evidence.mcp.tool_call_count, 1);
assert.equal(evidence.ability.status, "succeeded");
assert.equal(evidence.ability.policy_outcome, "allow");
assert.equal(evidence.ability.profile, "kujo.profile.essentials");
assert.equal(evidence.hosted_kujo_service, false);
assert.equal(evidence.command_code_observation.run_exit_code, 0);
assert.match(evidence.ability.definition_digest, /^[0-9a-f]{64}$/);
console.log("Command Code Kujo CMD live evidence passed");
