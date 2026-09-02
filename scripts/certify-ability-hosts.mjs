#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = resolve(root, "..");
const output = resolve(process.argv[2] || join(root, "certification/evidence/ability-hosts-local.json"));

function command(executable, args, cwd, env = {}) {
  const started = Date.now();
  const result = spawnSync(executable, args, { cwd, env: { ...process.env, ...env }, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const combined = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  const preferredSummary = (result.status === 0 ? result.stdout : result.stderr) || combined;
  return {
    status: result.status === 0 ? "passed" : "failed",
    exit_code: result.status ?? -1,
    duration_ms: Date.now() - started,
    output_sha256: createHash("sha256").update(combined).digest("hex"),
    summary: preferredSummary.split("\n").filter(Boolean).slice(-1)[0] || "no output",
  };
}
function revision(repository) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repository, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`cannot resolve revision for ${repository}`);
  return result.stdout.trim();
}
function record(id, host, tier, displayCommand, result, limitations = []) {
  return { id, host, tier, command: displayCommand, ...result, limitations };
}

const kujoBin = join(workspace, "kujo/target/debug/kujo");
const checks = [];
checks.push(record("portable-package", "portable", "package-validated", "node tests/portable_ability_plugin_test.mjs", command("node", ["tests/portable_ability_plugin_test.mjs"], root)));
checks.push(record("generic-stdio", "generic-stdio", "protocol-certified", "node tests/ability_host_bridge_test.mjs", command("node", ["tests/ability_host_bridge_test.mjs"], root)));
checks.push(record("codex-clean-profile", "codex", "install-validated", "KUJO_REQUIRE_CODEX=1 node tests/codex_clean_profile_test.mjs", command("node", ["tests/codex_clean_profile_test.mjs"], root, { KUJO_REQUIRE_CODEX: "1" }), ["Authenticated execution was not driven by the Codex host."]));
const connector = command("node", ["tests/ability_connector_cli_test.mjs"], root);
checks.push(record("cursor-config", "cursor", "configuration-validated", "node tests/ability_connector_cli_test.mjs", connector, ["Cursor binary was unavailable; no installed-host run."]));
const vscode = command("node", ["tests/vscode_clean_profile_test.mjs"], root, { KUJO_REQUIRE_VSCODE: "1" });
checks.push(record("vscode-clean-profile", "vscode-copilot", "installed-configuration-validated", "KUJO_REQUIRE_VSCODE=1 node tests/vscode_clean_profile_test.mjs", vscode, ["The installed VS Code CLI accepted a clean-profile MCP registration; an interactive Copilot tool invocation was not driven."]));
checks.push(record("agents-sdk", "agents-sdk", "native-conformant", "kujo test-run tests/ability_contract_tests.kujo -v", command(kujoBin, ["test-run", "tests/ability_contract_tests.kujo", "-v"], join(workspace, "agents-sdk"))));
checks.push(record("kujo-pi", "kujo-pi", "native-conformant", "npm test", command("npm", ["test"], join(workspace, "kujo-pi"))));

const codexVersion = command("codex", ["--version"], root);
const artifact = {
  schema: "kujo.ability.host-certification/v1",
  generated_at: new Date().toISOString(),
  source_revisions: { mcp: revision(root), "agents-sdk": revision(join(workspace, "agents-sdk")), "kujo-pi": revision(join(workspace, "kujo-pi")) },
  versions: { package: "1.1.0", gateway_contract: "1.0.0", mcp_protocol: "2025-11-25", codex: codexVersion.status === "passed" ? codexVersion.summary : "unavailable", cursor: "unavailable", vscode: vscode.status === "passed" ? vscode.summary.match(/\((\d+\.\d+\.\d+),/)?.[1] || "installed" : "unavailable" },
  checks,
};

if (checks.some((check) => check.status !== "passed")) {
  process.stderr.write(`${JSON.stringify(artifact, null, 2)}\n`);
  process.exit(1);
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Ability host evidence written: ${output}`);
