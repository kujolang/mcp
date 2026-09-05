import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = "certification/evidence/ability-gateway-live-2026-09-05.json";
const raw = await readFile(path, "utf8");
const evidence = JSON.parse(raw);

assert.equal(evidence.schema, "kujo.ability.gateway-live-conformance/v1");
assert.equal(evidence.origin, "https://ability.kujolang.ai");
assert.equal(evidence.mode, "read-only");
assert.match(evidence.runner_source_revision, /^[0-9a-f]{40}$/);
assert.match(evidence.deployed_source_revision, /^[0-9a-f]{40}$/);
assert.match(evidence.worker_version, /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/);
assert.ok(Date.parse(evidence.completed_at) >= Date.parse(evidence.started_at));
assert.deepEqual(evidence.checks, [
  "oauth_metadata",
  "wrong_audience_rejected",
  "authorization_code_pkce",
  "browser_https_loopback_relay",
  "tenant_catalog",
  "read_execution_receipt",
  "audit_receipt_redaction",
  "refresh_rotation",
  "refresh_replacement_activated",
  "old_refresh_rejected",
  "revocation",
  "revoked_token_rejected",
]);
assert.equal(evidence.secrets_persisted, false);
assert.doesNotMatch(raw, /bearer\s+[a-z0-9._~-]+/i);
assert.doesNotMatch(raw, /"(?:client_secret|access_token|refresh_token|authorization_code)"\s*:/i);

console.log("Ability Gateway live conformance evidence validated");
