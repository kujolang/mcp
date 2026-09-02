import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["tests/codex_clean_profile_test.mjs"], {
  env: { PATH: "/definitely-missing", KUJO_REQUIRE_CODEX: "1" },
  encoding: "utf8",
});

assert.equal(result.status, 1);
assert.match(result.stderr, /codex CLI is unavailable/);

console.log("required Codex certification fails closed when the CLI is unavailable");
