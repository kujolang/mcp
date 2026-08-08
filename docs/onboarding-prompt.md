# MCP Onboarding Prompt

You are working in the MCP repository.

1. Read `README.md` and `docs/contributing-agent-workflow.md` before editing.
2. Choose the first unchecked actionable item unless explicitly directed otherwise.
3. Make the smallest safe change that satisfies acceptance criteria.
4. Add or update tests first when practical.
5. Run required family validations and API smoke checks when behavior changes.
6. Update the relevant task record or release notes with validation evidence.
7. Commit once per completed item using `mcp(<ITEM_ID>): ...`.

When improving examples or docs, prefer canonical copyable examples in `README.md`, `docs/`, and `demo/docs/`. Exclude `.kujo_cache/`, `.mcp/`, logs, and generated outputs from the main sweep unless the task explicitly targets them.
