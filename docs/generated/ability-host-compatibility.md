# Generated Ability host compatibility

Evidence date: 2026-09-05

Package: `1.1.1`  
Gateway contract: `1.0.0`  
MCP protocol: `2025-11-25`

| Host | Proven tier | Automated evidence | Limitation |
| --- | --- | --- | --- |
| Codex | install-validated | [`codex-clean-profile`](../../certification/evidence/ability-hosts-local.json) | Authenticated execution was not driven by the Codex host. |
| Cursor | configuration-validated | [`cursor-config`](../../certification/evidence/ability-hosts-local.json) | Cursor binary was unavailable; no installed-host run. |
| VS Code / Copilot package | installed-configuration-validated | [`vscode-clean-profile`](../../certification/evidence/ability-hosts-local.json) | The installed VS Code CLI accepted a clean-profile MCP registration; an interactive Copilot tool invocation was not driven. |
| VS Code managed MCP | certified-mcp-read-only | [`vscode-managed-read`](../../certification/evidence/vscode-managed-2026-09-03.json) | The certificate covers managed OAuth, discovery, session restoration, and a read-only invocation. Mutating editor conformance remains a separate gate. |
| Generic STDIO MCP | protocol-certified | [`generic-stdio`](../../certification/evidence/ability-hosts-local.json) | None recorded for this tier. |
| Generic Streamable HTTP MCP | protocol-certified | [`generic-streamable-http`](../../certification/evidence/ability-hosts-local.json) | The generic client is a controlled Workers fixture with injected authenticated principal properties; the production OAuth transport is exercised separately by the managed VS Code certificate. |
| Agents SDK | native-conformant | [`agents-sdk`](../../certification/evidence/ability-hosts-local.json) | None recorded for this tier. |
| Kujo Pi | native-conformant | [`kujo-pi`](../../certification/evidence/ability-hosts-local.json) | None recorded for this tier. |

A row proves only its named tier. `configuration-validated` does not mean an installed host was exercised; `installed-configuration-validated` does not mean an interactive agent invoked a tool; `certified-mcp-read-only` does not cover mutating operations; `install-validated` does not mean authenticated host execution. The main evidence source is [the local certification artifact](../../certification/evidence/ability-hosts-local.json). Matrix generation fails when required evidence is missing, failed, future-dated, older than 30 days, lacks an artifact link, or does not cover the current immutable Ability connector source. External source revisions are also matched exactly whenever their sibling worktrees are available.
