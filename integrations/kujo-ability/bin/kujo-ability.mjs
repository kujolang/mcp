#!/usr/bin/env node

import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "1.1.0";
const SERVER_NAME = "kujo-ability";
const bridgePath = fileURLToPath(new URL("./kujo-ability-mcp.mjs", import.meta.url));
const command = process.argv[2] || "serve";

function parseOptions(values) {
  const options = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) throw new Error(`unexpected argument: ${value}`);
    const [rawName, inline] = value.slice(2).split("=", 2);
    if (["dry-run", "json", "skip-health"].includes(rawName)) {
      options[rawName] = true;
      continue;
    }
    const next = inline ?? values[index + 1];
    if (!next || (inline === undefined && next.startsWith("--"))) throw new Error(`missing value for --${rawName}`);
    options[rawName] = next;
    if (inline === undefined) index += 1;
  }
  return options;
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function pathEntries() {
  return (process.env.PATH || "").split(process.platform === "win32" ? ";" : ":").filter(Boolean);
}

async function commandExists(name) {
  for (const directory of pathEntries()) {
    if (await exists(join(directory, name))) return true;
    if (process.platform === "win32" && await exists(join(directory, `${name}.exe`))) return true;
  }
  return false;
}

async function detectHost() {
  if (await commandExists("cursor")) return "cursor";
  if (await commandExists("code")) return "vscode";
  return "generic";
}

function validateHost(host) {
  if (!["auto", "codex", "cursor", "vscode", "generic"].includes(host)) {
    throw new Error(`unsupported host '${host}'; expected auto, codex, cursor, vscode, or generic`);
  }
}

function validateGateway(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("gateway must be an absolute URL");
  }
  const loopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
    throw new Error("non-loopback gateways must use HTTPS");
  }
  return url.origin + url.pathname.replace(/\/$/, "");
}

function defaultOutput(host, scope) {
  if (scope === "user") {
    throw new Error("--output is required for user scope so host settings are never guessed or overwritten");
  }
  if (host === "cursor") return resolve(".cursor/mcp.json");
  if (host === "vscode") return resolve(".vscode/mcp.json");
  if (host === "codex") throw new Error("--output is required for Codex; normal Codex installation is plugin-managed");
  return resolve(".kujo/ability-mcp.json");
}

function statePath(output) {
  return `${output}.kujo-ability-state.json`;
}

function serverEntry(host, gateway) {
  if (host === "codex") {
    return {
      command: process.execPath,
      args: [bridgePath],
      cwd: dirname(bridgePath),
      env_vars: ["KUJO_ABILITY_GATEWAY_URL", "KUJO_ABILITY_GATEWAY_TOKEN", "KUJO_ABILITY_ALLOW_APPROVALS", "KUJO_ABILITY_REQUEST_TIMEOUT_MS"],
      tool_timeout_sec: 60,
    };
  }
  const base = {
    command: process.execPath,
    args: [bridgePath],
    env: { KUJO_ABILITY_GATEWAY_URL: gateway },
  };
  if (host === "vscode") {
    base.type = "stdio";
    base.env.KUJO_ABILITY_GATEWAY_TOKEN = "${input:kujoAbilityToken}";
  } else if (host === "cursor") {
    base.env.KUJO_ABILITY_GATEWAY_TOKEN = "${env:KUJO_ABILITY_GATEWAY_TOKEN}";
  }
  return base;
}

function rootKey(host) {
  if (host === "codex") return null;
  return host === "vscode" ? "servers" : "mcpServers";
}

async function readJson(path, fallback = {}) {
  if (!await exists(path)) return fallback;
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`cannot parse JSON at ${path}: ${error.message}`);
  }
}

async function writeJsonAtomic(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, path);
}

function configuredDocument(existing, host, gateway) {
  const key = rootKey(host);
  const document = key
    ? { ...existing, [key]: { ...(existing[key] || {}), [SERVER_NAME]: serverEntry(host, gateway) } }
    : { ...existing, [SERVER_NAME]: serverEntry(host, gateway) };
  if (host === "vscode") {
    const inputs = Array.isArray(existing.inputs) ? [...existing.inputs] : [];
    if (!inputs.some((input) => input?.id === "kujoAbilityToken")) {
      inputs.push({ id: "kujoAbilityToken", type: "promptString", description: "Least-privilege Kujo Ability bearer token", password: true });
    }
    document.inputs = inputs;
  }
  return document;
}

async function discover(gateway) {
  const headers = { accept: "application/json" };
  if (process.env.KUJO_ABILITY_GATEWAY_TOKEN) headers.authorization = `Bearer ${process.env.KUJO_ABILITY_GATEWAY_TOKEN}`;
  const response = await fetch(`${gateway}/v1/ai/mcp/tools`, { headers, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`gateway discovery failed with HTTP ${response.status}`);
  const payload = await response.json();
  const tools = payload?.data?.tools;
  if (!Array.isArray(tools)) throw new Error("gateway discovery returned an invalid tool catalog");
  return tools.map((tool) => tool.name).filter((name) => typeof name === "string");
}

function printResult(result, json) {
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    process.stdout.write(`${result.message}\n`);
    if (result.output) process.stdout.write(`Configuration: ${result.output}\n`);
    if (result.abilities) process.stdout.write(`Abilities: ${result.abilities.length ? result.abilities.join(", ") : "none visible"}\n`);
  }
}

async function connect(options) {
  const requestedHost = options.host || "auto";
  validateHost(requestedHost);
  const host = requestedHost === "auto" ? await detectHost() : requestedHost;
  const scope = options.scope || "project";
  if (!["project", "user"].includes(scope)) throw new Error("scope must be project or user");
  const gateway = validateGateway(options.gateway || process.env.KUJO_ABILITY_GATEWAY_URL || "");
  const output = resolve(options.output || defaultOutput(host, scope));
  const existing = await readJson(output);
  const document = configuredDocument(existing, host, gateway);
  const abilities = options["skip-health"] ? null : await discover(gateway);
  const state = { schema: "kujo.ability.connector-state/v1", version: VERSION, host, scope, gateway, output, enabled: true };
  if (!options["dry-run"]) {
    await writeJsonAtomic(output, document);
    await writeJsonAtomic(statePath(output), state);
  }
  printResult({ ok: true, message: options["dry-run"] ? "Connection configuration validated (dry run)." : "Kujo Ability connection configured.", host, scope, gateway, output, abilities }, options.json);
}

async function removeConnection(options, uninstall) {
  const output = options.output ? resolve(options.output) : null;
  if (!output) throw new Error("--output is required for disable and uninstall");
  const state = await readJson(statePath(output), null);
  const host = options.host || state?.host;
  if (!host || host === "auto") throw new Error("host is missing; provide --host or use a connector-managed configuration");
  validateHost(host);
  const document = await readJson(output);
  const key = rootKey(host);
  let updated;
  if (key) {
    const servers = { ...(document[key] || {}) };
    delete servers[SERVER_NAME];
    updated = { ...document, [key]: servers };
  } else {
    updated = { ...document };
    delete updated[SERVER_NAME];
  }
  if (!options["dry-run"]) {
    await writeJsonAtomic(output, updated);
    if (uninstall) await rm(statePath(output), { force: true });
    else await writeJsonAtomic(statePath(output), { ...(state || {}), version: VERSION, host, output, enabled: false });
  }
  printResult({ ok: true, message: uninstall ? "Kujo Ability connector configuration uninstalled." : "Kujo Ability connector disabled.", host, output }, options.json);
}

async function doctor(options) {
  const output = options.output ? resolve(options.output) : null;
  const state = output ? await readJson(statePath(output), null) : null;
  const gateway = validateGateway(options.gateway || state?.gateway || process.env.KUJO_ABILITY_GATEWAY_URL || "");
  const abilities = options["skip-health"] ? null : await discover(gateway);
  const configured = output ? await exists(output) : false;
  printResult({ ok: true, message: "Kujo Ability diagnostics passed.", gateway, output, configured, enabled: state?.enabled ?? null, abilities }, options.json);
}

function help() {
  process.stdout.write(`Kujo Ability ${VERSION}

Usage: kujo-ability <command> [options]

Commands:
  serve       Start the STDIO MCP bridge (default)
  connect     Configure a host and verify principal-visible discovery
  doctor      Verify a saved or explicit gateway connection
  disable     Remove the managed MCP entry while preserving connector state
  uninstall   Remove the managed MCP entry and connector state
  version     Print the package version
  help        Show this help

Connector options:
  --gateway URL             Gateway origin (or KUJO_ABILITY_GATEWAY_URL)
  --host HOST               auto, codex, cursor, vscode, or generic
  --scope SCOPE             project or user (default: project)
  --output FILE             Explicit host configuration file
  --dry-run                 Validate without writing files
  --skip-health             Skip gateway discovery (offline packaging/tests only)
  --json                    Emit machine-readable output

Tokens are read only from KUJO_ABILITY_GATEWAY_TOKEN or the host's secure input.
User-scope configuration requires --output so host settings are never guessed.
`);
}

try {
  const options = parseOptions(process.argv.slice(3));
  if (command === "serve") await import("./kujo-ability-mcp.mjs");
  else if (command === "connect") await connect(options);
  else if (command === "doctor") await doctor(options);
  else if (command === "disable") await removeConnection(options, false);
  else if (command === "uninstall") await removeConnection(options, true);
  else if (command === "version" || command === "--version" || command === "-V") process.stdout.write(`kujo-ability ${VERSION}\n`);
  else if (command === "help" || command === "--help" || command === "-h") help();
  else {
    process.stderr.write(`error: unknown command: ${command}\n`);
    process.exitCode = 2;
  }
} catch (error) {
  process.stderr.write(`error: ${error.message}\n`);
  process.exitCode = 1;
}
