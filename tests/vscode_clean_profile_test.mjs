import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bridge = join(repository, "integrations/kujo-ability/bin/kujo-ability-mcp.mjs");
const pluginRoot = join(repository, "integrations/kujo-ability");
const candidates = [
  process.env.KUJO_VSCODE_BIN,
  "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
  "/Applications/Visual Studio Code 2.app/Contents/Resources/app/bin/code",
  join(process.env.HOME || "", "Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"),
].filter(Boolean);

async function findCode() {
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {}
  }
  const pathProbe = spawnSync("which", ["code"], { encoding: "utf8" });
  return pathProbe.status === 0 ? pathProbe.stdout.trim() : "";
}

const code = await findCode();
if (!code) {
  const message = "VS Code clean-profile certification skipped: VS Code CLI is unavailable";
  if (process.env.KUJO_REQUIRE_VSCODE === "1") {
    console.error(message);
    process.exit(1);
  }
  console.log(message);
  process.exit(0);
}

const versionProbe = spawnSync(code, ["--version"], { encoding: "utf8", timeout: 30_000 });
assert.equal(versionProbe.status, 0, versionProbe.stderr || versionProbe.error?.message);
const [version, commit, architecture] = versionProbe.stdout.trim().split("\n");
assert.match(version, /^\d+\.\d+\.\d+$/);
assert.match(commit, /^[0-9a-f]{40}$/);
assert.match(architecture, /^(arm64|x64)$/);

const profile = await mkdtemp(join(tmpdir(), "kujo-ability-vscode-profile-"));
try {
  const definition = JSON.stringify({
    name: "kujo-ability",
    command: "node",
    args: [bridge],
    cwd: pluginRoot,
  });
  const result = spawnSync(code, [
    "--user-data-dir", join(profile, "user"),
    "--extensions-dir", join(profile, "extensions"),
    "--add-mcp", definition,
  ], { encoding: "utf8", timeout: 30_000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.match(result.stdout, /Added MCP servers: kujo-ability/);

  const configured = JSON.parse(await readFile(join(profile, "user/User/mcp.json"), "utf8"));
  assert.deepEqual(configured.servers["kujo-ability"], {
    command: "node",
    args: [bridge],
    cwd: pluginRoot,
  });
  assert.deepEqual(configured.inputs, []);
  assert.doesNotMatch(JSON.stringify(configured), /TOKEN|SECRET|PASSWORD/i);
} finally {
  await rm(profile, { recursive: true, force: true });
}

console.log(`VS Code clean-profile MCP registration passed (${version}, ${commit}, ${architecture})`);
