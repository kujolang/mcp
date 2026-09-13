---
workflow: general-video
flow: automation
storyboard: no
message: "Kujo Abilities work in Command Code through standard MCP with Ollama Cloud—no bespoke host adapter"
destination: product-demo
aspect: 1920x1080
language: en
audience: Kujo developers and early adopters
length: 25s
angle: verified technical proof
---

## Intent

A concise, silent product-proof video showing an actual Command Code 1.53.1 run
using `ollama/glm-5.3:cloud` to discover and invoke a real Kujo CMS Ability. The
look follows the recent BB Kujo theme demo: black technical canvas, restrained
monochrome hierarchy, Departure Mono labels, thin rails, and a brief signal edge.

## Assets

- `.media/images/image_001.webp` — the existing BB Kujo workflow artwork, used as faint background architecture.
- `assets/DepartureMono-Regular.woff2` — the existing BB Kujo technical display face.

## Customizations

- Show the exact verified model route, tool name, Ability identity, policy outcome, invocation ID, and receipt ID from the live run.
- End on the architectural verdict: standard MCP projection, zero bespoke Command Code adapter.
- Include a companion composition built from a real Command Code TUI capture in which GLM 5.3 invokes the Ability and explains the integration.

## Notes

- Deliberate silence keeps the proof readable and appropriate for a terminal-style technical demo.
- Do not show credentials, hidden model reasoning, or a fabricated Command Code UI.
- The model routing identity comes from Command Code's `model_request_start` event, not the model's untrusted self-description.
