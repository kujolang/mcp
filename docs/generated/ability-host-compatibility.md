# Generated Ability host compatibility

Evidence date: 2026-09-02

Package: `1.1.0`  
Gateway contract: `1.0.0`  
MCP protocol: `2025-11-25`

| Host | Proven tier | Automated check | Limitation |
| --- | --- | --- | --- |
| Codex | install-validated | `codex-clean-profile` | Authenticated execution was not driven by the Codex host. |
| Cursor | configuration-validated | `cursor-config` | Cursor binary was unavailable; no installed-host run. |
| VS Code / Copilot | configuration-validated | `vscode-config` | VS Code binary was unavailable; no extension-host run. |
| Generic STDIO MCP | protocol-certified | `generic-stdio` | None recorded for this tier. |
| Agents SDK | native-conformant | `agents-sdk` | None recorded for this tier. |
| Kujo Pi | native-conformant | `kujo-pi` | None recorded for this tier. |

A row proves only its named tier. `configuration-validated` does not mean installed-host execution; `install-validated` does not mean authenticated host execution. The evidence source is [the local certification artifact](../../certification/evidence/ability-hosts-local.json). Matrix generation fails when required evidence is missing, failed, future-dated, or older than 30 days.
