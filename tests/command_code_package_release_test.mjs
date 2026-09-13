import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { resolve } from "node:path";

const exec = promisify(execFile); const root = resolve("integrations/kujo-cmd");
const { stdout } = await exec("npm", ["pack", "--dry-run", "--json"], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
const report = JSON.parse(stdout)[0]; const files = new Set(report.files.map((file) => file.path));
for (const required of ["bin/kujo-cmd.mjs", "bin/kujo-cmd-mcp.mjs", ".generated/local-runtime.mjs", "catalog/abilities.json", "catalog/profiles.json", "catalog/sources.json", "README.md", "SECURITY.md"]) assert.ok(files.has(required), `missing ${required}`);
assert.ok(![...files].some((path) => path.includes("node_modules") || path.endsWith(".tgz")));
assert.equal(report.name, "@kujolang/kujo-cmd"); assert.equal(report.version, "0.1.0");
const packageJson = JSON.parse(await readFile(`${root}/package.json`, "utf8")); assert.equal(packageJson.dependencies["@kujolang/kujo-runtime"], "1.4.0");
for (const workflowPath of [".github/workflows/kujo-cmd.yml", ".github/workflows/kujo-cmd-release.yml"]) {
  const workflow = await readFile(workflowPath, "utf8");
  assert.ok(!/uses:\s+[^\s]+@(v\d+|main|master)\b/.test(workflow), `${workflowPath} contains a mutable action ref`);
}
const releaseWorkflow = await readFile(".github/workflows/kujo-cmd-release.yml", "utf8");
assert.ok(!/ubuntu-latest/.test(releaseWorkflow), "release workflow contains a mutable runner");
assert.match(releaseWorkflow, /npm@11\.19\.0/);
assert.match(releaseWorkflow, /merge-base --is-ancestor/);
assert.match(releaseWorkflow, /Check for an identical existing publication/);
assert.match(releaseWorkflow, /npm diff --diff=/);
assert.match(releaseWorkflow, /if: steps\.registry\.outputs\.published != 'true'/);
console.log("Command Code package release artifact passed");
