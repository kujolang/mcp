import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const directory = await mkdtemp(join(tmpdir(), "kujo-ability-matrix-"));
const source = JSON.parse(await readFile("certification/evidence/ability-hosts-local.json", "utf8"));
function generate(evidence, name) {
  const input = join(directory, `${name}.json`); const output = join(directory, `${name}.md`);
  return writeFile(input, JSON.stringify(evidence)).then(() => spawnSync("node", ["scripts/generate-ability-compatibility.mjs", input, output], { encoding: "utf8" })).then(async (result) => ({ result, output, text: result.status === 0 ? await readFile(output, "utf8") : "" }));
}

try {
  const current = await generate(source, "current");
  assert.equal(current.result.status, 0, current.result.stderr);
  assert.match(current.text, /Codex \| install-validated/);
  assert.match(current.text, /Cursor \| configuration-validated/);
  assert.match(current.text, /VS Code \/ Copilot package \| installed-configuration-validated/);
  assert.match(current.text, /VS Code managed MCP \| certified-mcp-read-only/);
  assert.match(current.text, /Generic Streamable HTTP MCP \| protocol-certified/);
  assert.match(current.text, /vscode-managed-2026-09-03\.json/);
  assert.doesNotMatch(current.text, /Cursor \| certified/);
  assert.equal(current.text, await readFile("docs/generated/ability-host-compatibility.md", "utf8"), "committed compatibility matrix must match current evidence");

  const failed = structuredClone(source); failed.checks[0].status = "failed";
  assert.notEqual((await generate(failed, "failed")).result.status, 0);
  const missing = structuredClone(source); missing.checks = missing.checks.filter((check) => check.host !== "kujo-pi");
  assert.notEqual((await generate(missing, "missing")).result.status, 0);
  const missingArtifact = structuredClone(source); delete missingArtifact.checks[0].artifact;
  assert.notEqual((await generate(missingArtifact, "missing-artifact")).result.status, 0);
  const unsafeArtifact = structuredClone(source); unsafeArtifact.checks[0].artifact = "../../outside.json";
  assert.notEqual((await generate(unsafeArtifact, "unsafe-artifact")).result.status, 0);
  const stale = structuredClone(source); stale.generated_at = "2020-01-01T00:00:00Z";
  assert.notEqual((await generate(stale, "stale")).result.status, 0);
  const wrongRevision = structuredClone(source); wrongRevision.source_revisions.mcp = "d80722e67b9a2a0661d5ab05d474d7e4a1da1ce0";
  assert.notEqual((await generate(wrongRevision, "wrong-revision")).result.status, 0);
  const wrongGatewayRevision = structuredClone(source); wrongGatewayRevision.source_revisions["ability-gateway"] = "d80722e67b9a2a0661d5ab05d474d7e4a1da1ce0";
  assert.notEqual((await generate(wrongGatewayRevision, "wrong-gateway-revision")).result.status, 0);
} finally {
  await rm(directory, { recursive: true, force: true });
}

console.log("Ability compatibility matrix freshness and fail-closed checks passed");
