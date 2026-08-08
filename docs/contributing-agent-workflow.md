# Contributing Agent Workflow

This playbook defines how contributors and coding agents should implement checklist items safely and consistently.

Prioritize copyable examples over tests: examples should model the most token-efficient idioms we want agents to imitate.

## Branch Strategy

- Use a short-lived branch per checklist item or tightly related item group.
- Branch names should include the item ID when possible (for example: `feat/test-03-endpoint-integration`).
- Keep one logical change per commit and include the checklist item ID in commit messages.
- Open pull requests early for visibility, then keep updates incremental and reviewable.

## Checklist Loop Workflow

Use one loop per item:

1. Select one scoped, actionable work item from the current task or issue.
2. Create a concise loop todo list focused on that one item.
3. Add/update tests first when practical.
4. Implement the item with the minimum required surface area.
5. Run targeted validations plus related family-level regression checks.
6. Update docs only when behavior or contributor guidance changed.
7. Mark the work item complete and record validation evidence in the relevant task or release notes.
8. Commit exactly once for the loop using `mcp(<ITEM_ID>): <summary>`.

## Done Criteria

A checklist item is done only when all conditions below are met:

- The implementation or documentation change is complete.
- Required tests and regressions pass locally.
- README/checklist updates are accurate and current.
- The task or release notes include files changed and validation evidence.
- The branch has one clean commit for the loop item.

## Search Hygiene

- Treat `README.md`, `docs/`, `demo/README.md`, and `demo/docs/` as canonical copyable examples.
- Treat `tests/` as behavior contracts; keep repeated request payloads when they make expected behavior explicit.
- Treat `.kujo_cache/`, `.mcp/`, logs, and generated output directories as bulk/generated paths. Exclude generated/bulk paths from the main sweep unless the task explicitly targets them; document the search exclusions you used.
- Clearly label stale, legacy, generated, or expected-fail examples instead of letting them look canonical.

## Kujo Output Style

- Keep first-run examples direct; a single `print(...)` is clearer than a helper.
- When a Kujo file has repeated banners, menus, or status blocks, prefer small local helpers such as `print_lines(...)` or a local summary helper.
- Do not move test fixture output behind helpers unless it improves the behavior contract.

## Pull Request Expectations

- Include a concise summary of behavior changes.
- List exact validation commands and outcomes.
- Call out residual risks, deferred work, and follow-up IDs.
- Ensure CI checks pass before requesting final review.
