import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const root = new URL("../integrations/kujo-ability/", import.meta.url);
const readJson = async (name) => JSON.parse(await readFile(new URL(name, root), "utf8"));

const manifest = await readJson("plugin.json");
const manifestKeys = new Set(["$schema", "name", "version", "description", "author", "homepage", "repository", "license", "keywords", "extensions"]);
assert.equal(manifest.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
assert.match(manifest.name, /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/);
assert.ok(manifest.name.length <= 64);
assert.deepEqual(Object.keys(manifest).filter((key) => !manifestKeys.has(key)), []);
assert.deepEqual(Object.keys(manifest.author).filter((key) => !["name", "email", "url"].includes(key)), []);

const mcp = await readJson("mcp.json");
assert.equal(mcp.$schema, "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json");
assert.deepEqual(Object.keys(mcp).sort(), ["$schema", "mcpServers"].sort());
assert.ok(Object.keys(mcp.mcpServers).length > 0);
for (const server of Object.values(mcp.mcpServers)) {
  assert.equal(server.type, "stdio");
  assert.match(server.command, /^[^/\\]+$/);
  assert.ok(server.args.every((arg) => typeof arg === "string"));
  assert.match(server.cwd, /^\$\{PLUGIN_(?:ROOT|DATA)\}(?:\/|$)|^\.\//);
  assert.ok(server.args.some((arg) => arg.includes("${PLUGIN_ROOT}")));
  assert.deepEqual(Object.keys(server).filter((key) => !["type", "command", "args", "env", "cwd"].includes(key)), []);
}

const skillDirectories = await readdir(new URL("skills/", root), { withFileTypes: true });
assert.ok(skillDirectories.some((entry) => entry.isDirectory()));
for (const entry of skillDirectories.filter((item) => item.isDirectory())) {
  const skill = await readFile(new URL(`skills/${entry.name}/SKILL.md`, root), "utf8");
  assert.match(skill, /^---\nname: [a-z0-9-]+\ndescription: .+\n---\n/s);
}

const codexManifest = await readJson(".codex-plugin/plugin.json");
assert.equal(codexManifest.name, manifest.name);
assert.equal(codexManifest.version, manifest.version);
assert.equal(codexManifest.mcpServers, undefined);
const codexMcp = await readJson(".mcp.json");
assert.ok(codexMcp["kujo-ability"]);
assert.equal(codexMcp.mcpServers, undefined);

const packageJson = await readJson("package.json");
assert.equal(packageJson.name, manifest.name);
assert.equal(packageJson.version, manifest.version);
assert.equal(packageJson.bin["kujo-ability"], "bin/kujo-ability.mjs");
assert.ok(packageJson.files.includes("com.github.copilot/"));

const copilotAgent = await readFile(new URL("com.github.copilot/agents/kujo-ability.agent.md", root), "utf8");
assert.match(copilotAgent, /^---\nname: kujo-ability\ndescription: .+\ntools:\n  - kujo-ability\/\*\n---\n/s);
assert.match(copilotAgent, /approval token/);
assert.match(copilotAgent, /canonical receipt/);
assert.match(copilotAgent, /Do not place credentials/);

async function allFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await allFiles(path));
    else files.push(path);
  }
  return files;
}

for (const file of await allFiles(root.pathname)) {
  if (!/\.(?:json|md|mjs)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  assert.doesNotMatch(text, /\/Users\/|[A-Za-z]:\\Users\\|\/absolute\/path/,
    `release artifact contains a developer-specific path: ${relative(root.pathname, file)}`);
  assert.doesNotMatch(text, /(?:Bearer|token)[ =:]+[A-Za-z0-9_-]{16,}/i,
    `release artifact appears to contain a credential: ${relative(root.pathname, file)}`);
}

console.log("portable Ability plugin contract passed");
