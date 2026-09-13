# Command Code + Ollama + Kujo proof video

This 25-second BB Kujo-themed video visualizes the verified live run recorded in
`../../certification/evidence/command-code-ollama-live-2026-09-13.json`.

- Host: Command Code 1.53.1
- Model: `ollama/glm-5.3:cloud`
- Transport: standard STDIO MCP
- Ability: `kujo.cms.site.inspect@1.0.0`
- Result: canonical succeeded receipt with policy `allow` and audit written

The project contains no credentials or captured hidden reasoning. Model identity
comes from the host's `model_request_start` event. The video uses the BB Kujo
palette, Departure Mono asset, workflow artwork, thin rails, and restrained
signal treatment from the local `bb-kujo` repository.

```bash
npm run check
npm run render -- --quality high --output command-code-ollama-kujo-proof.mp4
```
