#!/usr/bin/env node
import { createInterface } from "node:readline";
import { randomUUID } from "node:crypto";

const server = { name: "kujo-ability", version: "1.1.0" };
const base = (process.env.KUJO_ABILITY_GATEWAY_URL || "http://127.0.0.1:8080").replace(/\/$/, "");
const token = process.env.KUJO_ABILITY_GATEWAY_TOKEN || "";
const allowApprovals = process.env.KUJO_ABILITY_ALLOW_APPROVALS === "1";
const parsed = new URL(base);
if (parsed.protocol !== "https:" && !["127.0.0.1", "localhost", "::1"].includes(parsed.hostname)) throw new Error("KUJO_ABILITY_GATEWAY_URL must use HTTPS unless it is loopback");
const configuredTimeout = Number(process.env.KUJO_ABILITY_REQUEST_TIMEOUT_MS || 30000);
const timeoutMs = Number.isFinite(configuredTimeout) ? Math.min(Math.max(configuredTimeout, 1000), 60000) : 30000;

const write = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
const reply = (id, result) => write({ jsonrpc: "2.0", id, result });
const fail = (id, code, message, data) => write({ jsonrpc: "2.0", id, error: { code, message, ...(data === undefined ? {} : { data }) } });

async function gateway(path, options = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { accept: "application/json", "content-type": "application/json", "x-request-id": randomUUID(), ...(token ? { authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) };
  try {
    const { signal: _externalSignal, ...requestOptions } = options;
    const response = await fetch(`${base}${path}`, { ...requestOptions, headers, signal: controller.signal, redirect: "error" });
    const raw = await response.text();
    if (raw.length > 1_048_576) throw new Error("gateway response exceeded 1 MiB");
    let body;
    try { body = raw ? JSON.parse(raw) : {}; } catch { throw new Error(`gateway returned non-JSON (${response.status})`); }
    if (!response.ok) {
      const error = new Error(body?.error?.message || body?.message || `gateway returned ${response.status}`);
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body?.data ?? body;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", cancel);
  }
}

let toolCache = new Map();
function hostInputSchema(schema) {
  if (!schema || schema.type !== "object" || typeof schema.properties !== "object") return schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      _kujo: {
        type: "object",
        description: "Adapter control values; removed before canonical input validation.",
        properties: {
          invocationId: { type: "string", minLength: 1, maxLength: 240 },
          idempotencyKey: { type: "string", minLength: 1, maxLength: 255 },
          approvalId: { type: "string", minLength: 1, maxLength: 255 },
        },
        additionalProperties: false,
      },
    },
  };
}

async function listTools(signal) {
  const catalog = await gateway("/v1/ai/mcp/tools", { signal });
  const tools = Array.isArray(catalog.tools) ? catalog.tools : [];
  toolCache = new Map(tools.map((tool) => [tool.name, tool]));
  const projected = tools.map(({ name, title, description, inputSchema, outputSchema, annotations, abilityId, abilityVersion, abilityDigest, effects }) => ({
    name, title, description, inputSchema: hostInputSchema(inputSchema), outputSchema, annotations,
    _meta: { "kujo/abilityId": abilityId, "kujo/abilityVersion": abilityVersion, "kujo/abilityDigest": abilityDigest, "kujo/effects": effects },
  }));
  if (allowApprovals) projected.push({
    name: "kujo_ability_issue_approval", title: "Approve a Kujo Ability invocation",
    description: "Issue a one-time server-bound approval after the host has obtained explicit user confirmation.",
    inputSchema: { type: "object", required: ["ability", "invocation_id", "confirm"], properties: { ability: { type: "string" }, invocation_id: { type: "string" }, confirm: { type: "boolean", const: true } }, additionalProperties: false },
    annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
  });
  return projected;
}

const mcpResult = (data, isError = false) => ({ content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data, ...(isError ? { isError: true } : {}) });

async function callTool(name, args, signal) {
  if (name === "kujo_ability_issue_approval") {
    if (!allowApprovals) throw new Error("approval issuance is disabled");
    if (args?.confirm !== true) throw new Error("confirm must be true");
    const parts = String(args.ability || "").split("/");
    if (parts.length !== 2 || !parts.every((part) => /^[a-z0-9][a-z0-9-]*$/.test(part))) throw new Error("ability must be namespace/name");
    return mcpResult(await gateway(`/v1/abilities/${parts[0]}/${parts[1]}/approvals`, { method: "POST", body: JSON.stringify({ invocation_id: args.invocation_id }), signal }));
  }
  if (!toolCache.has(name)) await listTools(signal);
  const tool = toolCache.get(name);
  if (!tool) throw new Error(`unknown tool: ${name}`);
  const invocationId = typeof args?._kujo?.invocationId === "string" ? args._kujo.invocationId : `mcp-${randomUUID()}`;
  const idempotencyKey = typeof args?._kujo?.idempotencyKey === "string" ? args._kujo.idempotencyKey : "";
  const approvalId = typeof args?._kujo?.approvalId === "string" ? args._kujo.approvalId : "";
  const input = { ...(args || {}) }; delete input._kujo;
  const data = await gateway(tool.execution, {
    method: "POST",
    headers: { ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}), ...(approvalId ? { "x-ability-approval": approvalId } : {}) },
    body: JSON.stringify({ input, invocation_id: invocationId, ...(approvalId ? { approval_id: approvalId } : {}) }),
    signal,
  });
  return mcpResult(data);
}

const inflight = new Map();

async function handle(request) {
  const { id, method, params = {} } = request;
  if (method === "notifications/initialized") return;
  if (method === "notifications/cancelled") {
    inflight.get(params.requestId)?.abort();
    return;
  }
  if (method === "initialize") return reply(id, { protocolVersion: "2025-11-25", capabilities: { tools: { listChanged: false } }, serverInfo: server });
  if (method === "ping") return reply(id, {});
  if (method === "tools/list") return reply(id, { tools: await listTools() });
  if (method === "tools/call") {
    const controller = new AbortController();
    inflight.set(id, controller);
    try {
      return reply(id, await callTool(params.name, params.arguments || {}, controller.signal));
    } finally {
      inflight.delete(id);
    }
  }
  fail(id, -32601, `method not found: ${method}`);
}

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
lines.on("line", (line) => {
  if (!line.trim()) return;
  let request;
  try { request = JSON.parse(line); } catch { return fail(null, -32700, "parse error"); }
  Promise.resolve(handle(request)).catch((error) => {
    const details = error?.body?.error?.code ? { code: error.body.error.code, status: error.status } : undefined;
    if (request.id !== undefined) reply(request.id, mcpResult({ ok: false, error: String(error.message || error), ...(details ? { details } : {}) }, true));
  });
});
