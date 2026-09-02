import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createInterface } from "node:readline";

const requests = [];
const server = createServer(async (request, response) => {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  requests.push({ headers: request.headers, body: raw ? JSON.parse(raw) : null });
  response.setHeader("content-type", "application/json");
  if (request.url === "/v1/ai/mcp/tools") return response.end(JSON.stringify({ ok: true, data: { tools: [
    { name: "cms__inspect", title: "Inspect", description: "Inspect the CMS", inputSchema: { type: "object", properties: {}, additionalProperties: false }, outputSchema: { type: "object" }, annotations: { readOnlyHint: true }, abilityId: "kujo.cms.site.inspect", abilityVersion: "1.0.0", abilityDigest: "a".repeat(64), effects: [{ kind: "read", resource: "kujo.cms.site" }], execution: "/v1/abilities/cms/inspect/run" },
    { name: "cms__slow", title: "Slow", description: "Exercise cancellation", inputSchema: { type: "object", properties: {}, additionalProperties: false }, outputSchema: { type: "object" }, annotations: { readOnlyHint: true }, abilityId: "kujo.cms.site.slow", abilityVersion: "1.0.0", abilityDigest: "b".repeat(64), effects: [{ kind: "read", resource: "kujo.cms.site" }], execution: "/v1/abilities/cms/slow/run" },
  ] } }));
  if (request.url === "/v1/abilities/cms/inspect/run") return response.end(JSON.stringify({ ok: true, data: { result: { healthy: true }, receipt: { schema: "kujo.ability.receipt/v1", status: "succeeded" } } }));
  if (request.url === "/v1/abilities/cms/slow/run") {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!response.destroyed) response.end(JSON.stringify({ ok: true, data: { receipt: { schema: "kujo.ability.receipt/v1", status: "succeeded" } } }));
    return;
  }
  response.statusCode = 404; response.end(JSON.stringify({ error: { message: "not found" } }));
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const child = spawn(process.execPath, ["integrations/kujo-ability/bin/kujo-ability-mcp.mjs"], { env: { ...process.env, KUJO_ABILITY_GATEWAY_URL: `http://127.0.0.1:${server.address().port}`, KUJO_ABILITY_GATEWAY_TOKEN: "test-secret" }, stdio: ["pipe", "pipe", "pipe"] });
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

child.kill(); server.close();
console.log("ability host bridge contract passed");
