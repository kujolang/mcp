import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { delimiter, join } from "node:path";
import { tmpdir } from "node:os";

const required = process.env.KUJO_REQUIRE_COMMAND_CODE === "1";
const pinnedVersion = "1.53.1";

async function executableOnPath(name) {
  for (const directory of (process.env.PATH || "").split(delimiter).filter(Boolean)) {
    const candidate = join(directory, process.platform === "win32" ? `${name}.cmd` : name);
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Keep looking.
    }
  }
  return null;
}

async function commandCode() {
  if (process.env.COMMAND_CODE_BIN) return { executable: process.env.COMMAND_CODE_BIN, prefix: [] };
  for (const name of process.platform === "win32" ? ["cmdc", "command-code", "commandcode"] : ["cmd", "command-code", "commandcode", "cmdc"]) {
    const executable = await executableOnPath(name);
    if (executable) return { executable, prefix: [] };
  }
  if (required) return { executable: "npx", prefix: ["--yes", "--package", `command-code@${pinnedVersion}`, "--", process.platform === "win32" ? "cmdc" : "cmd"] };
  return null;
}

function run(command, args, cwd, env = {}, timeoutMs = 30_000) {
  return new Promise((resolve) => {
    const child = spawn(command.executable, [...command.prefix, ...args], {
      cwd,
      env: { ...process.env, COMMANDCODE_SKIP_UPDATES: "1", DO_NOT_TRACK: "1", ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ status: -1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on("close", (status) => {
      clearTimeout(timer);
      resolve({ status: status ?? -1, stdout, stderr });
    });
  });
}

const binary = await commandCode();
if (!binary) {
  console.log("Command Code clean-profile test skipped (set KUJO_REQUIRE_COMMAND_CODE=1 to require command-code 1.53.1)");
  process.exit(0);
}

const directory = await mkdtemp(join(tmpdir(), "kujo-command-code-"));
const requests = [];
const gateway = createServer(async (request, response) => {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  requests.push({ url: request.url, method: request.method, body: raw });
  response.setHeader("content-type", "application/json");
  if (request.url === "/v1/ai/mcp/tools") {
    return response.end(JSON.stringify({ ok: true, data: { tools: [{
      name: "repository__inspect",
      title: "Repository inspection",
      description: "Inspect a bounded repository fixture.",
      inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"], additionalProperties: false },
      outputSchema: { type: "object", properties: { files: { type: "integer" } }, required: ["files"], additionalProperties: false },
      annotations: { readOnlyHint: true },
      abilityId: "kujo.repo.inspect.run",
      abilityVersion: "1.0.0",
      abilityDigest: "a".repeat(64),
      effects: [{ kind: "read", resource: "kujo.repo.files" }],
      execution: "/v1/abilities/repo/inspect/run",
    }] } }));
  }
  if (request.url === "/v1/abilities/repo/inspect/run") {
    const body = JSON.parse(raw);
    return response.end(JSON.stringify({ ok: true, data: {
      result: { files: 3 },
      receipt: { schema: "kujo.ability.receipt/v1", status: "succeeded", invocation_id: body.invocation_id },
    } }));
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ error: { message: "not found" } }));
});

try {
  gateway.listen(0, "127.0.0.1");
  await once(gateway, "listening");
  const origin = `http://127.0.0.1:${gateway.address().port}`;
  const connector = await run(
    { executable: process.execPath, prefix: [] },
    [join(process.cwd(), "integrations/kujo-ability/bin/kujo-ability.mjs"), "connect", "--host", "command-code", "--gateway", origin, "--output", join(directory, ".mcp.json"), "--skip-health", "--json"],
    process.cwd(),
  );
  assert.equal(connector.status, 0, connector.stderr);
  const config = JSON.parse(await readFile(join(directory, ".mcp.json"), "utf8"));
  assert.equal(config.mcpServers["kujo-ability"].transport, "stdio");
  assert.equal(config.mcpServers["kujo-ability"].enabled, true);
  assert.equal(config.mcpServers["kujo-ability"].env.KUJO_ABILITY_GATEWAY_TOKEN, undefined);

  const version = await run(binary, ["--version"], directory);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, new RegExp(`(?:Command Code v)?${pinnedVersion.replaceAll(".", "\\.")}`));

  const listed = await run(binary, ["mcp", "list"], directory);
  assert.equal(listed.status, 0, listed.stderr);
  assert.match(listed.stdout, /kujo-ability\s+stdio\s+project/);
  const details = await run(binary, ["mcp", "get", "kujo-ability"], directory);
  assert.equal(details.status, 0, details.stderr);
  assert.match(details.stdout, /Transport:\s+stdio/);
  assert.match(details.stdout, /Status:\s+enabled/);

  assert.equal(requests.length, 0, "configuration inspection must not contact the Ability gateway");
  console.log(`Command Code clean-profile MCP configuration passed (${version.stdout.trim()})`);
} finally {
  gateway.close();
  await rm(directory, { recursive: true, force: true });
}
