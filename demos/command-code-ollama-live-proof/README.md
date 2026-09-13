# Actual Command Code + Ollama + Kujo demo

This is a recording of the real Command Code 1.53.1 terminal interface—not a
mock UI. Command Code runs `ollama/glm-5.3:cloud`, dynamically discovers the
Kujo CMS site-info Ability through standard MCP, invokes it once, and describes
the portable integration from inside the host.

The final response visibly includes the MCP tool name, Ability identity, policy
decision, invocation ID, receipt ID, and succeeded status. No credentials or
hidden reasoning are captured.

```bash
npm run check
npm run render -- --quality high --output command-code-ollama-kujo-live.mp4
```

Re-record the session (requires Command Code, Ollama, `glm-5.3:cloud`,
`asciinema`, `agg`, FFmpeg, and the sibling Kujo CMS repository):

```bash
../../scripts/record-command-code-ollama-live-demo.sh
```
