#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const evidencePath = resolve(process.argv[2] || "certification/evidence/ability-hosts-local.json");
const outputPath = resolve(process.argv[3] || "docs/generated/ability-host-compatibility.md");
const maxAgeDays = Number(process.env.KUJO_CERTIFICATION_MAX_AGE_DAYS || "30");
const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
if (evidence.schema !== "kujo.ability.host-certification/v1") throw new Error("unsupported host certification evidence schema");
const generatedAt = Date.parse(evidence.generated_at);
if (!Number.isFinite(generatedAt) || Date.now() - generatedAt > maxAgeDays * 86_400_000 || generatedAt - Date.now() > 300_000) throw new Error("host certification evidence is stale or future-dated");
if (!Array.isArray(evidence.checks) || !evidence.checks.length || evidence.checks.some((check) => check.status !== "passed" || !check.output_sha256 || !check.command)) throw new Error("host certification evidence contains a missing or failed check");
const evidenceRevision = evidence.source_revisions?.mcp;
if (typeof evidenceRevision !== "string" || !/^[0-9a-f]{40}$/.test(evidenceRevision)) throw new Error("host certification evidence has an invalid MCP source revision");
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
];
const ancestor = spawnSync("git", ["merge-base", "--is-ancestor", evidenceRevision, "HEAD"], { encoding: "utf8" });
if (ancestor.status !== 0) throw new Error("host certification evidence revision is not an ancestor of the current source");
const sourceDiff = spawnSync("git", ["diff", "--quiet", evidenceRevision, "HEAD", "--", ...certifiedPathspecs], { encoding: "utf8" });
if (sourceDiff.status !== 0) throw new Error("host certification evidence does not cover the current Ability connector source");
const sourceStatus = spawnSync("git", ["status", "--porcelain=v1", "--untracked-files=all", "--", ...certifiedPathspecs], { encoding: "utf8" });
if (sourceStatus.status !== 0 || sourceStatus.stdout.trim()) throw new Error("Ability connector source is dirty; certify and publish an immutable source revision");

const labels = { codex: "Codex", cursor: "Cursor", "vscode-copilot": "VS Code / Copilot", "generic-stdio": "Generic STDIO MCP", "agents-sdk": "Agents SDK", "kujo-pi": "Kujo Pi" };
const order = ["codex", "cursor", "vscode-copilot", "generic-stdio", "agents-sdk", "kujo-pi"];
const rows = order.map((host) => {
  const check = evidence.checks.find((item) => item.host === host);
  if (!check) throw new Error(`missing required host evidence: ${host}`);
  const limitations = check.limitations?.length ? check.limitations.join(" ") : "None recorded for this tier.";
  return `| ${labels[host]} | ${check.tier} | \`${check.id}\` | ${limitations} |`;
});
const date = new Date(generatedAt).toISOString().slice(0, 10);
const document = `# Generated Ability host compatibility\n\nEvidence date: ${date}\n\nPackage: \`${evidence.versions.package}\`  \nGateway contract: \`${evidence.versions.gateway_contract}\`  \nMCP protocol: \`${evidence.versions.mcp_protocol}\`\n\n| Host | Proven tier | Automated check | Limitation |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n\nA row proves only its named tier. \`configuration-validated\` does not mean installed-host execution; \`install-validated\` does not mean authenticated host execution. The evidence source is [the local certification artifact](../../certification/evidence/ability-hosts-local.json). Matrix generation fails when required evidence is missing, failed, future-dated, older than ${maxAgeDays} days, or does not cover the current immutable Ability connector source.\n`;
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, document);
console.log(`Ability compatibility matrix written: ${outputPath}`);
