import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const output = await mkdtemp(join(tmpdir(), "kujo-ability-release-"));
try {
  const result = JSON.parse(execFileSync(process.execPath, ["scripts/package-kujo-ability.mjs", "--output", output, "--verify-reproducible"], { encoding: "utf8" }));
  assert.equal(result.package, "kujo-ability@1.1.0");
  assert.equal(result.reproducible, true);
  assert.equal(result.signed, false);

  const names = (await readdir(output)).sort();
  assert.deepEqual(names, ["SHA256SUMS", "kujo-ability-1.1.0.provenance.json", "kujo-ability-1.1.0.spdx.json", "kujo-ability-1.1.0.tgz"]);
  const archive = await readFile(join(output, result.archive));
  assert.equal(createHash("sha256").update(archive).digest("hex"), result.sha256);

  const sbom = JSON.parse(await readFile(join(output, "kujo-ability-1.1.0.spdx.json"), "utf8"));
  assert.equal(sbom.spdxVersion, "SPDX-2.3");
  assert.ok(sbom.files.some((file) => file.fileName === "./plugin.json"));
  assert.ok(sbom.files.some((file) => file.fileName === "./bin/kujo-ability.mjs"));

  const provenance = JSON.parse(await readFile(join(output, "kujo-ability-1.1.0.provenance.json"), "utf8"));
  assert.equal(provenance.predicateType, "https://slsa.dev/provenance/v1");
  assert.equal(provenance.subject[0].digest.sha256, result.sha256);

  const listing = execFileSync("tar", ["-tzf", join(output, result.archive)], { encoding: "utf8" }).trim().split("\n");
  assert.ok(listing.every((path) => path.startsWith("package/")));
  assert.ok(listing.includes("package/plugin.json"));
  assert.ok(listing.includes("package/com.github.copilot/agents/kujo-ability.agent.md"));
} finally {
  await rm(output, { recursive: true, force: true });
}

console.log("ability release package is reproducible with SBOM and provenance metadata");
