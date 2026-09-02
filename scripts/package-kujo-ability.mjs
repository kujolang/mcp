#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const repositoryRoot = resolve(new URL("..", import.meta.url).pathname);
const packageRoot = join(repositoryRoot, "integrations/kujo-ability");
const options = {};
const argumentsList = process.argv.slice(2);
for (let index = 0; index < argumentsList.length; index += 1) {
  const value = argumentsList[index];
  if (!value.startsWith("--")) throw new Error(`unexpected argument: ${value}`);
  const [name, inline] = value.slice(2).split("=", 2);
  if (name === "verify-reproducible") {
    options[name] = true;
    continue;
  }
  const next = inline ?? argumentsList[index + 1];
  if (!next || (inline === undefined && next.startsWith("--"))) throw new Error(`missing value for --${name}`);
  options[name] = next;
  if (inline === undefined) index += 1;
}
const outputDirectory = resolve(options.output || join(repositoryRoot, "dist/kujo-ability"));

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function npmPack(destination) {
  const stdout = execFileSync("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", destination, packageRoot], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, SOURCE_DATE_EPOCH: "0" },
    stdio: ["ignore", "pipe", "inherit"],
  });
  const result = JSON.parse(stdout)[0];
  if (!result?.filename || !Array.isArray(result.files)) throw new Error("npm pack returned invalid metadata");
  return result;
}

async function buildOnce() {
  const temporary = await mkdtemp(join(tmpdir(), "kujo-ability-package-"));
  try {
    const metadata = npmPack(temporary);
    const archive = await readFile(join(temporary, metadata.filename));
    return { metadata, archive };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

function sourceRevision() {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8" }).trim();
}

function sourceDirty() {
  return execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { cwd: repositoryRoot, encoding: "utf8" }).trim() !== "";
}

function npmVersion() {
  return execFileSync("npm", ["--version"], { encoding: "utf8" }).trim();
}

async function spdx(metadata, archiveName, archiveDigest) {
  const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  const files = [];
  for (const entry of [...metadata.files].sort((left, right) => left.path.localeCompare(right.path))) {
    const contents = await readFile(join(packageRoot, entry.path));
    files.push({
      SPDXID: `SPDXRef-File-${sha256(entry.path).slice(0, 16)}`,
      fileName: `./${entry.path}`,
      checksums: [{ algorithm: "SHA256", checksumValue: sha256(contents) }],
    });
  }
  const documentNamespace = `https://kujolang.ai/spdx/kujo-ability/${packageJson.version}/${archiveDigest}`;
  return {
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: `kujo-ability-${packageJson.version}`,
    documentNamespace,
    creationInfo: {
      created: "1970-01-01T00:00:00Z",
      creators: ["Organization: Kujo", "Tool: scripts/package-kujo-ability.mjs"],
    },
    packages: [{
      SPDXID: "SPDXRef-Package-kujo-ability",
      name: packageJson.name,
      versionInfo: packageJson.version,
      downloadLocation: "NOASSERTION",
      filesAnalyzed: true,
      licenseConcluded: packageJson.license,
      licenseDeclared: packageJson.license,
      checksums: [{ algorithm: "SHA256", checksumValue: archiveDigest }],
      externalRefs: [{ referenceCategory: "PACKAGE-MANAGER", referenceType: "purl", referenceLocator: `pkg:npm/${packageJson.name}@${packageJson.version}` }],
      packageFileName: archiveName,
    }],
    files,
    relationships: files.map((file) => ({ spdxElementId: "SPDXRef-Package-kujo-ability", relationshipType: "CONTAINS", relatedSpdxElement: file.SPDXID })),
  };
}

const first = await buildOnce();
if (options["verify-reproducible"]) {
  const second = await buildOnce();
  if (!first.archive.equals(second.archive)) throw new Error("npm package is not byte-for-byte reproducible");
}

const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
const archiveName = `${packageJson.name}-${packageJson.version}.tgz`;
const archiveDigest = sha256(first.archive);
const sbomName = `${packageJson.name}-${packageJson.version}.spdx.json`;
const provenanceName = `${packageJson.name}-${packageJson.version}.provenance.json`;
const sbomBytes = Buffer.from(`${JSON.stringify(await spdx(first.metadata, archiveName, archiveDigest), null, 2)}\n`);
const provenance = {
  _type: "https://in-toto.io/Statement/v1",
  subject: [
    { name: archiveName, digest: { sha256: archiveDigest } },
    { name: sbomName, digest: { sha256: sha256(sbomBytes) } },
  ],
  predicateType: "https://slsa.dev/provenance/v1",
  predicate: {
    buildDefinition: {
      buildType: "https://kujolang.ai/buildtypes/npm-pack/v1",
      externalParameters: { package: "integrations/kujo-ability", npm: npmVersion(), ignoreScripts: true },
      internalParameters: { sourceDateEpoch: "0", sourceDirty: sourceDirty() },
      resolvedDependencies: [{ uri: "git+https://github.com/kujolang/mcp", digest: { gitCommit: sourceRevision() } }],
    },
    runDetails: { builder: { id: "https://github.com/kujolang/mcp/.github/workflows/ci.yml" }, metadata: { invocationId: "local-or-ci-unsigned" } },
  },
};
const provenanceBytes = Buffer.from(`${JSON.stringify(provenance, null, 2)}\n`);
const checksums = [
  `${archiveDigest}  ${archiveName}`,
  `${sha256(sbomBytes)}  ${sbomName}`,
  `${sha256(provenanceBytes)}  ${provenanceName}`,
].join("\n") + "\n";

await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, archiveName), first.archive);
await writeFile(join(outputDirectory, sbomName), sbomBytes);
await writeFile(join(outputDirectory, provenanceName), provenanceBytes);
await writeFile(join(outputDirectory, "SHA256SUMS"), checksums);

process.stdout.write(`${JSON.stringify({
  package: `${packageJson.name}@${packageJson.version}`,
  output: outputDirectory,
  archive: archiveName,
  sha256: archiveDigest,
  integrity: first.metadata.integrity,
  files: first.metadata.entryCount,
  reproducible: Boolean(options["verify-reproducible"]),
  signed: false,
}, null, 2)}\n`);
