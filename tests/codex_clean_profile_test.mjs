import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const probe = spawnSync("codex", ["--version"], { encoding: "utf8" });
if (probe.error?.code === "ENOENT") {
  console.log("Codex clean-profile certification skipped: codex CLI is unavailable");
  process.exit(0);
}
assert.equal(probe.status, 0, probe.stderr);

const version = probe.stdout.trim();
const codexHome = await mkdtemp(join(tmpdir(), "kujo-ability-codex-profile-"));
const repository = resolve(new URL("..", import.meta.url).pathname);

function run(args, expectedStatus = 0) {
  const result = spawnSync("codex", args, {
    cwd: repository,
    env: { ...process.env, CODEX_HOME: codexHome },
    encoding: "utf8",
  });
  assert.equal(result.status, expectedStatus, `${result.stderr}\n${result.stdout}`);
  return result.stdout;
}

try {
  const marketplace = JSON.parse(run(["plugin", "marketplace", "add", repository, "--json"]));
  assert.equal(marketplace.marketplaceName, "kujo-local");

  const available = run(["plugin", "list"]);
  assert.match(available, /kujo-ability@kujo-local\s+not installed/);

  const installed = JSON.parse(run(["plugin", "add", "kujo-ability@kujo-local", "--json"]));
  assert.equal(installed.version, "1.1.0");
  const installedRoot = installed.installedPath;
  await access(join(installedRoot, ".mcp.json"));
  await access(join(installedRoot, "bin", "kujo-ability-mcp.mjs"));
  await access(join(installedRoot, "skills", "using-kujo-ability", "SKILL.md"));
  const mcp = JSON.parse(await readFile(join(installedRoot, ".mcp.json"), "utf8"));
  assert.equal(mcp["kujo-ability"].command, "node");
  assert.ok(mcp["kujo-ability"].args.some((value) => value.includes("${PLUGIN_ROOT}")));

  const enabled = run(["plugin", "list"]);
  assert.match(enabled, /kujo-ability@kujo-local\s+installed, enabled\s+1\.1\.0/);

  run(["plugin", "remove", "kujo-ability@kujo-local"]);
  const removed = run(["plugin", "list"]);
  assert.match(removed, /kujo-ability@kujo-local\s+not installed/);
  run(["plugin", "marketplace", "remove", "kujo-local"]);
  assert.doesNotMatch(run(["plugin", "marketplace", "list"]), /kujo-local/);
} finally {
  await rm(codexHome, { recursive: true, force: true });
}

console.log(`Codex clean-profile plugin lifecycle passed (${version})`);
