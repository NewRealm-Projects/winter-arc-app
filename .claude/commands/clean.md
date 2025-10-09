Run the repository cleanup script to remove unused files:

```bash
node scripts/cleanup-repo.mjs
```

This will scan the repository for:
- Unreferenced Markdown files (.md)
- Unused images in assets/, public/, docs/
- Temporary files and build artifacts

Use `--dry-run` to preview changes without deleting anything.
Use `--force` to skip confirmation prompts.

Example: `node scripts/cleanup-repo.mjs --dry-run`
