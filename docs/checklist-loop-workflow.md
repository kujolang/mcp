# Checklist Loop Workflow

Use one loop per checklist item:

1. Select one scoped, actionable work item from the current task or issue.
2. Create a concise loop todo list focused on that one item.
3. Add or update tests first when practical.
4. Implement the item with the minimum required surface area.
5. Run targeted validations plus related family-level regression checks.
6. Update docs only when behavior or contributor guidance changed.
7. Mark the work item complete and record validation evidence in the relevant task or release notes.
8. Commit exactly once for the loop using `mcp(<ITEM_ID>): <summary>`.

## Done Criteria

- The implementation or documentation change is complete.
- Required tests and regressions pass locally.
- README and checklist updates are accurate and current.
- The task or release notes include changed files and validation evidence.
- The branch has one clean commit for the loop item.
