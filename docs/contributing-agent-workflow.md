# Contributing Agent Workflow

This playbook defines how contributors and coding agents should implement checklist items safely and consistently.

## Branch Strategy

- Use a short-lived branch per checklist item or tightly related item group.
- Branch names should include the item ID when possible (for example: `feat/test-03-endpoint-integration`).
- Keep one logical change per commit and include the checklist item ID in commit messages.
- Open pull requests early for visibility, then keep updates incremental and reviewable.

## Checklist Loop Workflow

Use one loop per item:

1. Select the first unchecked actionable item in `docs/MCP_REBOOT_CHECKLIST.md`.
2. Create a concise loop todo list focused on that one item.
3. Add/update tests first when practical.
4. Implement the item with the minimum required surface area.
5. Run targeted validations plus related family-level regression checks.
6. Update docs only when behavior or contributor guidance changed.
7. Mark the checklist item complete and append a Work Log entry.
8. Commit exactly once for the loop using `mcp(<ITEM_ID>): <summary>`.

## Done Criteria

A checklist item is done only when all conditions below are met:

- The implementation or documentation change is complete.
- Required tests and regressions pass locally.
- README/checklist updates are accurate and current.
- Work Log entry includes files changed and validation evidence.
- The branch has one clean commit for the loop item.

## Pull Request Expectations

- Include a concise summary of behavior changes.
- List exact validation commands and outcomes.
- Call out residual risks, deferred work, and follow-up IDs.
- Ensure CI checks pass before requesting final review.
