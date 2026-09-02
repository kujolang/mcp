import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createInterface } from "node:readline";

const requests = [];
const usedApprovals = new Set();
const validApprovals = new Set(["approval-external-1", "approval-external-2"]);
const idempotencyInputs = new Map();
const server = createServer(async (request, response) => {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  requests.push({ headers: request.headers, body: raw ? JSON.parse(raw) : null });
  response.setHeader("content-type", "application/json");
  if (request.url === "/v1/ai/mcp/tools") return response.end(JSON.stringify({ ok: true, data: { tools: [
    { name: "cms__inspect", title: "Inspect", description: "Inspect the CMS", inputSchema: { type: "object", properties: {}, additionalProperties: false }, outputSchema: { type: "object" }, annotations: { readOnlyHint: true }, abilityId: "kujo.cms.site.inspect", abilityVersion: "1.0.0", abilityDigest: "a".repeat(64), effects: [{ kind: "read", resource: "kujo.cms.site" }], execution: "/v1/abilities/cms/inspect/run" },
    { name: "cms__slow", title: "Slow", description: "Exercise cancellation", inputSchema: { type: "object", properties: {}, additionalProperties: false }, outputSchema: { type: "object" }, annotations: { readOnlyHint: true }, abilityId: "kujo.cms.site.slow", abilityVersion: "1.0.0", abilityDigest: "b".repeat(64), effects: [{ kind: "read", resource: "kujo.cms.site" }], execution: "/v1/abilities/cms/slow/run" },
    { name: "cms__publish", title: "Publish", description: "Exercise approval and idempotency", inputSchema: { type: "object", properties: { title: { type: "string" } }, required: ["title"], additionalProperties: false }, outputSchema: { type: "object" }, annotations: { destructiveHint: true }, abilityId: "kujo.cms.site.publish", abilityVersion: "1.0.0", abilityDigest: "c".repeat(64), effects: [{ kind: "write", resource: "kujo.cms.site" }], execution: "/v1/abilities/cms/publish/run" },
  ] } }));
  if (request.url === "/v1/abilities/cms/inspect/run") return response.end(JSON.stringify({ ok: true, data: { result: { healthy: true }, receipt: { schema: "kujo.ability.receipt/v1", status: "succeeded" } } }));
  if (request.url === "/v1/abilities/cms/slow/run") {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!response.destroyed) response.end(JSON.stringify({ ok: true, data: { receipt: { schema: "kujo.ability.receipt/v1", status: "succeeded" } } }));
    return;
  }
  if (request.url === "/v1/abilities/cms/publish/run") {
    const approval = request.headers["x-ability-approval"];
    const idempotencyKey = request.headers["idempotency-key"];
    const normalizedInput = JSON.stringify(requests.at(-1).body.input);
    if (!approval) {
      response.statusCode = 403;
      return response.end(JSON.stringify({ error: { code: "approval_required", message: "approval required" } }));
    }
    if (!validApprovals.has(approval)) {
      response.statusCode = 403;
      return response.end(JSON.stringify({ error: { code: "approval_invalid", message: "approval invalid" } }));
    }
    if (idempotencyInputs.has(idempotencyKey) && idempotencyInputs.get(idempotencyKey) !== normalizedInput) {
      response.statusCode = 409;
      return response.end(JSON.stringify({ error: { code: "idempotency_conflict", message: "idempotency input conflict" } }));
    }
    if (usedApprovals.has(approval)) {
      response.statusCode = 409;
      return response.end(JSON.stringify({ error: { code: "approval_replayed", message: "approval already used" } }));
    }
    usedApprovals.add(approval);
    idempotencyInputs.set(idempotencyKey, normalizedInput);
    return response.end(JSON.stringify({ ok: true, data: { result: { published: true }, receipt: { schema: "kujo.ability.receipt/v1", status: "succeeded", invocation_id: requests.at(-1).body.invocation_id } } }));
  }
  response.statusCode = 404; response.end(JSON.stringify({ error: { message: "not found" } }));
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const child = spawn(process.execPath, ["integrations/kujo-ability/bin/kujo-ability-mcp.mjs"], { env: { ...process.env, KUJO_ABILITY_GATEWAY_URL: `http://127.0.0.1:${server.address().port}`, KUJO_ABILITY_GATEWAY_TOKEN: "test-secret", KUJO_ABILITY_ALLOW_APPROVALS: "1" }, stdio: ["pipe", "pipe", "pipe"] });
const messages = [];
createInterface({ input: child.stdout }).on("line", (line) => messages.push(JSON.parse(line)));
const send = (value) => child.stdin.write(`${JSON.stringify(value)}\n`);
const waitFor = async (id) => {
  for (let count = 0; count < 100; count += 1) {
    const found = messages.find((message) => message.id === id);
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`timed out waiting for ${id}`);
};

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
const initialized = await waitFor(1);
assert.equal(initialized.result.serverInfo.name, "kujo-ability");
assert.equal(initialized.result.serverInfo.version, "1.1.0");
send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
const listed = await waitFor(2);
assert.equal(listed.result.tools[0].name, "cms__inspect");
assert.equal(listed.result.tools[0]._meta["kujo/abilityId"], "kujo.cms.site.inspect");
assert.equal(listed.result.tools[0].inputSchema.properties._kujo.additionalProperties, false);
assert.equal(listed.result.tools.some((tool) => tool.name === "kujo_ability_issue_approval"), false);
send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "cms__inspect", arguments: { _kujo: { invocationId: "invoke-1", idempotencyKey: "same-input-only" } } } });
const called = await waitFor(3);
assert.equal(called.result.structuredContent.receipt.status, "succeeded");
assert.equal(requests[0].headers.authorization, "Bearer test-secret");
assert.equal(requests[1].headers["idempotency-key"], "same-input-only");
assert.equal(requests[1].body.invocation_id, "invoke-1");
assert.deepEqual(requests[1].body.input, {});

send({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "cms__slow", arguments: {} } });
await new Promise((resolve) => setTimeout(resolve, 25));
send({ jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: 4, reason: "test cancellation" } });
const cancelled = await waitFor(4);
assert.equal(cancelled.result.isError, true);
assert.match(cancelled.result.structuredContent.error, /abort/i);

send({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "cms__publish", arguments: { title: "First", _kujo: { invocationId: "publish-1", idempotencyKey: "publish-key" } } } });
const denied = await waitFor(5);
assert.equal(denied.result.isError, true);
assert.equal(denied.result.structuredContent.details.code, "approval_required");
assert.equal(denied.result.structuredContent.details.status, 403);

send({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "kujo_ability_issue_approval", arguments: { ability: "cms/publish", invocation_id: "publish-1", confirm: true } } });
const selfApproval = await waitFor(6);
assert.equal(selfApproval.result.isError, true);
assert.match(selfApproval.result.structuredContent.error, /unknown tool/);
send({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "cms__publish", arguments: { title: "First", _kujo: { invocationId: "publish-1", idempotencyKey: "publish-key", approvalId: "approval-external-1" } } } });
const published = await waitFor(7);
assert.equal(published.result.structuredContent.receipt.status, "succeeded");
assert.equal(published.result.structuredContent.receipt.invocation_id, "publish-1");

send({ jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "cms__publish", arguments: { title: "First", _kujo: { invocationId: "publish-1", idempotencyKey: "publish-key", approvalId: "approval-external-1" } } } });
const replayed = await waitFor(8);
assert.equal(replayed.result.isError, true);
assert.equal(replayed.result.structuredContent.details.code, "approval_replayed");

send({ jsonrpc: "2.0", id: 10, method: "tools/call", params: { name: "cms__publish", arguments: { title: "Changed", _kujo: { invocationId: "publish-2", idempotencyKey: "publish-key", approvalId: "approval-external-2" } } } });
const conflicted = await waitFor(10);
assert.equal(conflicted.result.isError, true);
assert.equal(conflicted.result.structuredContent.details.code, "idempotency_conflict");

child.kill(); server.close();
console.log("ability host bridge contract passed");
