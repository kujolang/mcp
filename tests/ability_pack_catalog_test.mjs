import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";

const catalog = JSON.parse(await readFile("docs/ability-pack-launch-catalog.json", "utf8"));
const selfPack = JSON.parse(await readFile("packs/mcp_core/pack.json", "utf8"));
assert.equal(catalog.schema, "kujo.ability-pack-catalog/v1");
assert.match(catalog.catalog_version, /^\d+\.\d+\.\d+$/);
assert.equal(catalog.entries.length, 3);
assert.equal(new Set(catalog.entries.map((entry) => `${entry.pack_id}@${entry.pack_version}`)).size, catalog.entries.length);
for (const entry of catalog.entries) {
  assert.match(entry.pack_id, /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*){2,}$/);
  assert.match(entry.pack_version, /^\d+\.\d+\.\d+$/);
  assert.match(entry.source_revision, /^[a-f0-9]{40}$/);
  assert.match(entry.source_repository, /^https:\/\/github\.com\/kujolang\//);
  assert.ok(Number.isSafeInteger(entry.ability_count) && entry.ability_count > 0 && entry.ability_count <= 50);
  assert.ok(entry.effects.length >= 1 && entry.effects.every((effect) => ["read", "write", "delete", "external"].includes(effect)));
  assert.ok(["local-reference-gateway-certified", "repository-fixture-certified"].includes(entry.evidence_level));
  assert.ok(entry.selection_reason.length >= 40 && entry.selection_reason.length <= 500);
}
const selfEntry = catalog.entries.find((entry) => entry.pack_id === selfPack.pack_id);
assert.ok(selfEntry);
assert.equal(selfEntry.pack_version, selfPack.pack_version);
assert.equal(selfEntry.ability_count, selfPack.definitions.length);
assert.deepEqual(selfEntry.effects, selfPack.effects);
assert.deepEqual(catalog.deferred_candidates.sort(), ["howl", "lens", "shipcheck", "fence", "eval", "spec", "dispatch", "watchdog", "runledger", "rag", "scent", "casefile", "kennel"].sort());
for (const entry of catalog.entries) {
  const repositoryName = new URL(entry.source_repository).pathname.split("/").filter(Boolean).at(-1);
  const repositoryPath = repositoryName === "mcp" ? "." : `../${repositoryName}`;
  try { await access(`${repositoryPath}/.git`); } catch { continue; }
  const raw = execFileSync("git", ["-C", repositoryPath, "show", `${entry.source_revision}:${entry.manifest_path}`], { encoding: "utf8" });
  const manifest = JSON.parse(raw);
  assert.equal(manifest.pack_id, entry.pack_id);
  assert.equal(manifest.pack_version, entry.pack_version);
  const count = Array.isArray(manifest.definitions) ? manifest.definitions.length : manifest.entries.length;
  assert.equal(count, entry.ability_count);
}
console.log("Ability Pack launch catalog identity, evidence, and self-pack checks passed");
