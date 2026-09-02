import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

const kennel = await read("kennel.toml");
const lock = await read("kennel.lock");
const packageVersion = kennel.match(/\[package\][\s\S]*?\nversion = "([^"]+)"/)?.[1];
const abilityCommit = kennel.match(/\[dependencies\.ability\][\s\S]*?\ncommit = "([0-9a-f]{40})"/)?.[1];
assert.ok(packageVersion);
assert.ok(abilityCommit);
assert.match(lock, new RegExp(`requested = "${abilityCommit}"`));
assert.match(lock, new RegExp(`resolved_commit = "${abilityCommit}"`));
assert.match(lock, /\nversion = "1\.0\.1"/);

const portable = await json("integrations/kujo-ability/plugin.json");
const codex = await json("integrations/kujo-ability/.codex-plugin/plugin.json");
const npm = await json("integrations/kujo-ability/package.json");
const server = await json("mcp-server.json");
assert.equal(packageVersion, portable.version);
assert.equal(codex.version, portable.version);
assert.equal(npm.version, portable.version);
assert.equal(server.server.version, portable.version);

const cli = await read("integrations/kujo-ability/bin/kujo-ability.mjs");
const bridge = await read("integrations/kujo-ability/bin/kujo-ability-mcp.mjs");
assert.match(cli, new RegExp(`const VERSION = "${portable.version.replaceAll(".", "\\.")}"`));
assert.match(bridge, new RegExp(`version: "${portable.version.replaceAll(".", "\\.")}"`));
assert.match(bridge, /protocolVersion: "2025-11-25"/);

const abilitySources = await readdir(new URL("../src/abilities/", import.meta.url));
assert.deepEqual(abilitySources.filter((name) => /schema|definition/i.test(name)), []);
for (const name of abilitySources.filter((item) => item.endsWith(".kujo"))) {
  const source = await read(`src/abilities/${name}`);
  assert.match(source, /^from ability import /, `${name} must import canonical Ability contracts`);
  assert.doesNotMatch(source, /["']kujo\.ability\/v1["']/, `${name} must not copy the canonical schema identifier`);
}

console.log("ability contract drift checks passed");
