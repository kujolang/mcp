#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const evidencePath = resolve(process.argv[2] || "certification/evidence/ability-hosts-local.json");
const outputPath = resolve(process.argv[3] || "docs/generated/ability-host-compatibility.md");
const maxAgeDays = Number(process.env.KUJO_CERTIFICATION_MAX_AGE_DAYS || "30");
const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
if (evidence.schema !== "kujo.ability.host-certification/v1") throw new Error("unsupported host certification evidence schema");
const generatedAt = Date.parse(evidence.generated_at);
if (!Number.isFinite(generatedAt) || Date.now() - generatedAt > maxAgeDays * 86_400_000 || generatedAt - Date.now() > 300_000) throw new Error("host certification evidence is stale or future-dated");
if (!Array.isArray(evidence.checks) || !evidence.checks.length || evidence.checks.some((check) => check.status !== "passed" || !check.output_sha256 || !check.command || !check.artifact)) throw new Error("host certification evidence contains a missing or failed check");
for (const check of evidence.checks) {
  if (!/^certification\/evidence\/[a-z0-9._-]+\.json$/.test(check.artifact)) throw new Error("host certification evidence contains an unsafe artifact path");
  await access(resolve(check.artifact));
}
const evidenceRevision = evidence.source_revisions?.mcp;
if (typeof evidenceRevision !== "string" || !/^[0-9a-f]{40}$/.test(evidenceRevision)) throw new Error("host certification evidence has an invalid MCP source revision");
for (const [name, directory] of Object.entries({
  "ability-gateway": resolve("../ability-gateway"),
  "agents-sdk": resolve("../agents-sdk"),
  "kujo-pi": resolve("../kujo-pi"),
})) {
  const expected = evidence.source_revisions?.[name];
  if (typeof expected !== "string" || !/^[0-9a-f]{40}$/.test(expected)) throw new Error(`host certification evidence has an invalid ${name} source revision`);
  const current = spawnSync("git", ["rev-parse", "HEAD"], { cwd: directory, encoding: "utf8" });
  if (current.status !== 0 || current.stdout.trim() !== expected) throw new Error(`host certification evidence does not cover the current ${name} source`);
}
const certifiedPathspecs = [
  ".agents/plugins/marketplace.json",
  ".github/workflows/ability-spec-drift.yml",
  ".github/workflows/ci.yml",
  "integrations/kujo-ability",
  "scripts/certify-ability-hosts.mjs",
  "scripts/check-agent-plugin-spec-drift.sh",
  "scripts/generate-ability-compatibility.mjs",
  "scripts/package-kujo-ability.mjs",
  ":(glob)tests/ability_*",
  "tests/codex_clean_profile_test.mjs",
  "tests/portable_ability_plugin_test.mjs",
  "tests/run_all_tests.sh",
  "tests/vscode_clean_profile_test.mjs",
];
const ancestor = spawnSync("git", ["merge-base", "--is-ancestor", evidenceRevision, "HEAD"], { encoding: "utf8" });
if (ancestor.status !== 0) throw new Error("host certification evidence revision is not an ancestor of the current source");
const sourceDiff = spawnSync("git", ["diff", "--quiet", evidenceRevision, "HEAD", "--", ...certifiedPathspecs], { encoding: "utf8" });
if (sourceDiff.status !== 0) throw new Error("host certification evidence does not cover the current Ability connector source");
const sourceStatus = spawnSync("git", ["status", "--porcelain=v1", "--untracked-files=all", "--", ...certifiedPathspecs], { encoding: "utf8" });
if (sourceStatus.status !== 0 || sourceStatus.stdout.trim()) throw new Error("Ability connector source is dirty; certify and publish an immutable source revision");

const labels = { codex: "Codex", cursor: "Cursor", "vscode-copilot": "VS Code / Copilot package", "vscode-managed": "VS Code managed MCP", "generic-stdio": "Generic STDIO MCP", "generic-streamable-http": "Generic Streamable HTTP MCP", "agents-sdk": "Agents SDK", "kujo-pi": "Kujo Pi" };
const order = ["codex", "cursor", "vscode-copilot", "vscode-managed", "generic-stdio", "generic-streamable-http", "agents-sdk", "kujo-pi"];
const rows = order.map((host) => {
  const check = evidence.checks.find((item) => item.host === host);
  if (!check) throw new Error(`missing required host evidence: ${host}`);
  const limitations = check.limitations?.length ? check.limitations.join(" ") : "None recorded for this tier.";
  const artifact = check.artifact === "certification/evidence/ability-hosts-local.json"
    ? "../../certification/evidence/ability-hosts-local.json"
    : `../../${check.artifact}`;
  return `| ${labels[host]} | ${check.tier} | [\`${check.id}\`](${artifact}) | ${limitations} |`;
});
const date = new Date(generatedAt).toISOString().slice(0, 10);
const document = `# Generated Ability host compatibility\n\nEvidence date: ${date}\n\nPackage: \`${evidence.versions.package}\`  \nGateway contract: \`${evidence.versions.gateway_contract}\`  \nMCP protocol: \`${evidence.versions.mcp_protocol}\`\n\n| Host | Proven tier | Automated evidence | Limitation |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n\nA row proves only its named tier. \`configuration-validated\` does not mean an installed host was exercised; \`installed-configuration-validated\` does not mean an interactive agent invoked a tool; \`certified-mcp-read-only\` does not cover mutating operations; \`install-validated\` does not mean authenticated host execution. The main evidence source is [the local certification artifact](../../certification/evidence/ability-hosts-local.json). Matrix generation fails when required evidence is missing, failed, future-dated, older than ${maxAgeDays} days, lacks an artifact link, or does not cover the current immutable Ability connector source.\n`;
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, document);
console.log(`Ability compatibility matrix written: ${outputPath}`);
