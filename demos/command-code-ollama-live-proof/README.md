# Actual Command Code + Ollama + Kujo demo

This is a recording of the real Command Code 1.53.1 terminal interface—not a
mock UI. Command Code runs `ollama/glm-5.3:cloud`, dynamically discovers the
Kujo CMS site-info Ability through standard MCP, invokes it once, and describes
the portable integration from inside the host.

The final response visibly includes the MCP tool name, Ability identity, policy
decision, invocation ID, receipt ID, and succeeded status. No credentials or
hidden reasoning are captured.

The surrounding proof frame uses Command Code's `#E4CCFF` accent. The narration
script is locked in `narration.txt` and voiced with ElevenLabs Brian, whose
provider metadata identifies it as American English.

```bash
python3 scripts/generate-narration.py
npm run check
npm run render -- --quality high --output command-code-ollama-kujo-live.mp4
```

Narration generation reads `ELEVENLABS_API_KEY` or the existing macOS Keychain
entry `kujo-videoops-elevenlabs` / `videoops`; it never writes the credential.

Re-record the session (requires Command Code, Ollama, `glm-5.3:cloud`,
`asciinema`, `agg`, FFmpeg, and the sibling Kujo CMS repository):

```bash
../../scripts/record-command-code-ollama-live-demo.sh
```

After `@kujolang/kujo-cmd@0.1.0` is public, replace the assets with a clean
registry-install proof using:

```bash
../../scripts/record-command-code-kujo-cmd-published-demo.sh
```

That command installs the published package into an isolated temporary home,
runs `setup` and `doctor`, then records the same real Command Code interface
calling the local Kujo Ability catalog with GLM 5.3. The captured run is also
the post-publication smoke test; it is not a staged or locally packed build.
