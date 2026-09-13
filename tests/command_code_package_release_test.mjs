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
console.log("Command Code package release artifact passed");
