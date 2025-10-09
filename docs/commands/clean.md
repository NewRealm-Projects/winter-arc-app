# /clean Command

## Overview

The `/clean` command is a repository cleanup tool that automatically removes unused files to keep your codebase tidy and optimized.

## Usage

### Via Slash Command

```bash
/clean
```

### Via npm Script

```bash
npm run clean
```

### Via Direct Execution

```bash
node scripts/cleanup-repo.mjs [--dry-run] [--force]
```

## Features

The cleanup tool performs the following tasks:

### 1. **Unreferenced Markdown Files**
Scans for `.md` files in:
- `docs/`
- `.agent/`
- `.claude/`

Protected files (never deleted):
- `README.md`
- `CHANGELOG.md`
- `CLAUDE.md`
- `LICENSE.md`
- `CONTRIBUTING.md`
- `.github/README.md`

### 2. **Unused Images**
Scans for unreferenced images in:
- `public/`
- `assets/`
- `docs/`
- `static/`
- `images/`

Supported formats:
- PNG, JPG, JPEG, GIF, SVG, WebP, ICO

### 3. **Temporary Files**
Removes:
- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)
- `*.log` files
- `*.tmp`, `*.temp` files
- Cache directories (`node_modules/.cache`, `.next`, `.turbo`)
- Build artifacts (`dist/`, `coverage/`)

## Flags

### `--dry-run`
Preview what would be deleted without actually removing files.

**Example:**
```bash
npm run clean -- --dry-run
```

**Output:**
```
🔍 DRY RUN MODE - No files will be deleted

📋 Markdown Files:
  Would delete: docs/old-guide.md (0.05 MB)
  Would delete: .agent/archived.md (0.02 MB)

✅ Cleanup Complete
  Would delete: 5 files
  Would free: 1.23 MB
```

### `--force`
Skip confirmation prompts and proceed with deletion automatically.

**Example:**
```bash
npm run clean -- --force
```

## Output

### Example Cleanup Session

```
╔════════════════════════════════════════════════════════════╗
║          🧹 Repository Cleanup Tool                        ║
╚════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Scanning for unreferenced Markdown files
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Checking docs/old-setup.md...
    ❌ Not referenced
  Checking docs/guide.md...
    ✓ Referenced

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖼️  Scanning for unused images
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Checking public/logo-old.png...
    ❌ Not used
  Checking public/logo.png...
    ✓ Used

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗑️  Scanning for temporary files
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Found: .DS_Store
  Found directory: dist (42 files)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Cleanup Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Unreferenced Markdown files: 1
  Unused images: 1
  Temporary files: 43
  Total files to delete: 45

🚨 Proceed with deletion? (y/N): y

🗑️  Markdown Files:
  Deleting: docs/old-setup.md (0.05 MB)

🗑️  Image Files:
  Deleting: public/logo-old.png (0.12 MB)

🗑️  Temporary Files:
  Deleting: .DS_Store (0.00 MB)
  Deleting: dist/index.html (0.01 MB)
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Cleanup Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Deleted: 45 files
  Freed: 12.34 MB

🎉 Repository cleaned successfully!
```

## Safety Features

1. **Protected Files**: Critical documentation files are never deleted
2. **Reference Checking**: Files are only deleted if they're completely unreferenced
3. **Confirmation Prompt**: Asks for confirmation before deletion (unless `--force`)
4. **Dry Run Mode**: Test the cleanup without actually deleting anything
5. **Error Handling**: Gracefully handles missing directories and unreadable files
6. **Git Awareness**: Uses `git ls-files` to check only tracked files

## When to Use

Run the cleanup tool:

- **Before releases** - Remove unused documentation and images
- **After refactoring** - Clean up orphaned files
- **Weekly maintenance** - Keep the repository lean
- **CI/CD checks** - Ensure no temporary files are committed

## Integration

### Pre-commit Hook

Add to `.husky/pre-commit`:
```bash
npm run clean -- --dry-run
```

### CI Pipeline

Add to `.github/workflows/ci.yml`:
```yaml
- name: Check for orphaned files
  run: |
    node scripts/cleanup-repo.mjs --dry-run
    if [ $? -ne 0 ]; then
      echo "⚠️ Found orphaned files. Run 'npm run clean' locally."
      exit 1
    fi
```

## Troubleshooting

### "Cannot find module"
Make sure you're running the script from the repository root:
```bash
cd /path/to/winter-arc-app
npm run clean
```

### "Permission denied"
On Unix systems, make the script executable:
```bash
chmod +x scripts/cleanup-repo.mjs
```

### "Too many files deleted"
First run with `--dry-run` to preview:
```bash
npm run clean -- --dry-run
```

If legitimate files are being flagged, add them to `PROTECTED_FILES` in the script.

## Advanced Configuration

Edit `scripts/cleanup-repo.mjs` to customize:

```javascript
// Add protected files
const PROTECTED_FILES = [
  'README.md',
  'CHANGELOG.md',
  'your-custom-file.md',
];

// Add search directories
const MD_SEARCH_DIRS = ['docs', '.agent', 'custom-docs'];

// Add temp file patterns
const TEMP_FILE_PATTERNS = [
  '.DS_Store',
  'Thumbs.db',
  '*.custom-temp',
];
```

## See Also

- [Repository Structure](../architecture.md)
- [CI/CD Pipeline](../ci-cd.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)
