import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const directory = await mkdtemp(join(tmpdir(), "kujo-ability-connector-"));
const output = join(directory, "mcp.json");
const cli = "integrations/kujo-ability/bin/kujo-ability.mjs";

function run(...args) {
  const result = spawnSync(process.execPath, [cli, ...args, "--json"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

try {
  await writeFile(output, `${JSON.stringify({ mcpServers: { preserved: { command: "preserved" } }, note: "keep" })}\n`);

  const connected = run("connect", "--host", "generic", "--scope", "project", "--gateway", "http://127.0.0.1:8080", "--output", output, "--skip-health");
  assert.equal(connected.host, "generic");
  let document = JSON.parse(await readFile(output, "utf8"));
  assert.equal(document.note, "keep");
  assert.equal(document.mcpServers.preserved.command, "preserved");
  assert.equal(document.mcpServers["kujo-ability"].env.KUJO_ABILITY_GATEWAY_URL, "http://127.0.0.1:8080");
  assert.equal(document.mcpServers["kujo-ability"].env.KUJO_ABILITY_GATEWAY_TOKEN, undefined);

  run("connect", "--host", "generic", "--gateway", "http://localhost:9090", "--output", output, "--skip-health");
  document = JSON.parse(await readFile(output, "utf8"));
  assert.equal(document.mcpServers["kujo-ability"].env.KUJO_ABILITY_GATEWAY_URL, "http://localhost:9090");

  const diagnosed = run("doctor", "--output", output, "--skip-health");
  assert.equal(diagnosed.configured, true);
  assert.equal(diagnosed.enabled, true);

  run("disable", "--output", output);
  document = JSON.parse(await readFile(output, "utf8"));
  assert.equal(document.mcpServers["kujo-ability"], undefined);
  assert.equal(document.mcpServers.preserved.command, "preserved");
  const disabledState = JSON.parse(await readFile(`${output}.kujo-ability-state.json`, "utf8"));
  assert.equal(disabledState.enabled, false);

  run("connect", "--host", "generic", "--gateway", "http://localhost:9090", "--output", output, "--skip-health");
  run("uninstall", "--output", output);
  document = JSON.parse(await readFile(output, "utf8"));
  assert.equal(document.mcpServers["kujo-ability"], undefined);
  await assert.rejects(readFile(`${output}.kujo-ability-state.json`, "utf8"), { code: "ENOENT" });

  for (const host of ["cursor", "vscode"]) {
    const hostOutput = join(directory, `${host}.json`);
    await writeFile(hostOutput, `${JSON.stringify({ preserved: host })}\n`);
    run("connect", "--host", host, "--gateway", "https://gateway.example.test", "--output", hostOutput, "--skip-health");
    const hostDocument = JSON.parse(await readFile(hostOutput, "utf8"));
    const root = host === "vscode" ? hostDocument.servers : hostDocument.mcpServers;
    assert.equal(hostDocument.preserved, host);
    assert.equal(root["kujo-ability"].env.KUJO_ABILITY_GATEWAY_URL, "https://gateway.example.test");
    assert.doesNotMatch(JSON.stringify(hostDocument), /test-secret|Bearer /);
    if (host === "vscode") {
      assert.equal(root["kujo-ability"].type, "stdio");
      assert.equal(hostDocument.inputs[0].password, true);
    } else {
      assert.equal(root["kujo-ability"].env.KUJO_ABILITY_GATEWAY_TOKEN, "${env:KUJO_ABILITY_GATEWAY_TOKEN}");
    }
    run("disable", "--output", hostOutput);
    const disabled = JSON.parse(await readFile(hostOutput, "utf8"));
    const disabledRoot = host === "vscode" ? disabled.servers : disabled.mcpServers;
    assert.equal(disabledRoot["kujo-ability"], undefined);
    run("uninstall", "--output", hostOutput);
    await assert.rejects(readFile(`${hostOutput}.kujo-ability-state.json`, "utf8"), { code: "ENOENT" });
  }

  const insecure = spawnSync(process.execPath, [cli, "connect", "--host", "generic", "--gateway", "http://example.com", "--output", output, "--skip-health"], { encoding: "utf8" });
  assert.equal(insecure.status, 1);
  assert.match(insecure.stderr, /must use HTTPS/);
} finally {
  await rm(directory, { recursive: true, force: true });
}

console.log("ability connector CLI lifecycle passed");
