#!/usr/bin/env node

/**
 * Repository Cleanup Script
 *
 * Removes unused files from the repository:
 * - Unreferenced Markdown files
 * - Unused images
 * - Temporary files and build artifacts
 *
 * Usage:
 *   node scripts/cleanup-repo.mjs [--dry-run] [--force]
 *
 * Flags:
 *   --dry-run  Show what would be deleted without actually deleting
 *   --force    Skip confirmation prompts
 */

import { readdir, readFile, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, relative, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TEMP_FILE_PATTERNS = [
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '*.tmp',
  '*.temp',
  '.cache',
];

const TEMP_DIRECTORIES = [
  'node_modules/.cache',
  'dist',
  '.next',
  '.turbo',
  'coverage',
];

// Critical files that should never be deleted
const PROTECTED_FILES = [
  'README.md',
  'CHANGELOG.md',
  'CLAUDE.md',
  'LICENSE.md',
  'CONTRIBUTING.md',
  '.github/README.md',
  'docs/CONTRIBUTING.md',
  'docs/commands/clean.md', // This command's own documentation
];

// Protected directories - never scan for unreferenced files
const PROTECTED_DIRS = [
  '.claude/commands', // Slash commands are referenced by Claude Code itself
  '.agent', // Agent files are referenced by slash commands
];

// Directories to search for markdown files
const MD_SEARCH_DIRS = ['docs', '.agent', '.claude'];

// Directories to search for images
const IMAGE_SEARCH_DIRS = ['public', 'assets', 'docs', 'static', 'images'];

// Image extensions to check
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Parse CLI Arguments
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Utility Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '━'.repeat(60));
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log('━'.repeat(60) + '\n');
}

async function promptConfirm(message) {
  if (isForce) return true;

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function getFileSizeMB(filePath) {
  try {
    const stats = await stat(filePath);
    return (stats.size / 1024 / 1024).toFixed(2);
  } catch {
    return 0;
  }
}

async function getFilesRecursive(dir, extensions = null) {
  const files = [];

  if (!existsSync(dir)) {
    return files;
  }

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      // Skip node_modules and hidden directories
      if (entry.name === 'node_modules' || entry.name.startsWith('.git')) {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...(await getFilesRecursive(fullPath, extensions)));
      } else if (entry.isFile()) {
        if (!extensions || extensions.includes(extname(entry.name).toLowerCase())) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Silently skip directories we can't read
  }

  return files;
}

async function getAllTrackedFiles() {
  try {
    const output = execSync('git ls-files', { cwd: ROOT_DIR, encoding: 'utf8' });
    return output.split('\n').filter(Boolean).map(f => join(ROOT_DIR, f));
  } catch {
    log('⚠️  Warning: Could not get git tracked files', colors.yellow);
    return [];
  }
}

async function searchFileReferences(searchContent, filePath) {
  const fileName = relative(ROOT_DIR, filePath);
  const fileNameOnly = fileName.split('/').pop();
  const fileNameWithoutExt = fileNameOnly.replace(extname(fileNameOnly), '');

  // Search patterns
  const patterns = [
    fileName,
    fileNameOnly,
    fileNameWithoutExt,
    fileName.replace(/\\/g, '/'), // Unix paths
    fileName.replace(/\//g, '\\'), // Windows paths
  ];

  // Check if file is in protected directory
  for (const protectedDir of PROTECTED_DIRS) {
    if (fileName.startsWith(protectedDir.replace(/\//g, '\\'))) {
      return true;
    }
  }

  // Check manifest.webmanifest for PWA icons
  const manifestPath = join(ROOT_DIR, 'manifest.webmanifest');
  if (existsSync(manifestPath)) {
    try {
      const manifestContent = await readFile(manifestPath, 'utf8');
      for (const pattern of patterns) {
        if (manifestContent.includes(pattern)) {
          return true;
        }
      }
    } catch {
      // Ignore
    }
  }

  // Check index.html for linked resources
  const indexPath = join(ROOT_DIR, 'index.html');
  if (existsSync(indexPath)) {
    try {
      const indexContent = await readFile(indexPath, 'utf8');
      for (const pattern of patterns) {
        if (indexContent.includes(pattern)) {
          return true;
        }
      }
    } catch {
      // Ignore
    }
  }

  const trackedFiles = await getAllTrackedFiles();

  for (const trackedFile of trackedFiles) {
    if (trackedFile === filePath) continue;

    try {
      const content = await readFile(trackedFile, 'utf8');

      // Check if any pattern is referenced
      for (const pattern of patterns) {
        if (content.includes(pattern)) {
          return true;
        }
      }
    } catch {
      // Skip files we can't read
    }
  }

  return false;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Cleanup Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function findUnreferencedMarkdownFiles() {
  logSection('🔍 Scanning for unreferenced Markdown files');

  const unreferencedFiles = [];
  const protectedPaths = PROTECTED_FILES.map(f => join(ROOT_DIR, f));

  for (const dir of MD_SEARCH_DIRS) {
    const dirPath = join(ROOT_DIR, dir);
    const mdFiles = await getFilesRecursive(dirPath, ['.md']);

    for (const mdFile of mdFiles) {
      // Skip protected files
      if (protectedPaths.includes(mdFile)) {
        continue;
      }

      const relativePath = relative(ROOT_DIR, mdFile);
      log(`  Checking ${relativePath}...`, colors.gray);

      const isReferenced = await searchFileReferences('', mdFile);

      if (!isReferenced) {
        unreferencedFiles.push(mdFile);
        log(`    ❌ Not referenced`, colors.red);
      } else {
        log(`    ✓ Referenced`, colors.green);
      }
    }
  }

  return unreferencedFiles;
}

async function findUnusedImages() {
  logSection('🖼️  Scanning for unused images');

  const unusedImages = [];

  for (const dir of IMAGE_SEARCH_DIRS) {
    const dirPath = join(ROOT_DIR, dir);
    const imageFiles = await getFilesRecursive(dirPath, IMAGE_EXTENSIONS);

    for (const imageFile of imageFiles) {
      const relativePath = relative(ROOT_DIR, imageFile);
      log(`  Checking ${relativePath}...`, colors.gray);

      const isReferenced = await searchFileReferences('', imageFile);

      if (!isReferenced) {
        unusedImages.push(imageFile);
        log(`    ❌ Not used`, colors.red);
      } else {
        log(`    ✓ Used`, colors.green);
      }
    }
  }

  return unusedImages;
}

async function findTempFiles() {
  logSection('🗑️  Scanning for temporary files');

  const tempFiles = [];

  // Find temp files by pattern
  const allFiles = await getFilesRecursive(ROOT_DIR);

  for (const file of allFiles) {
    const fileName = file.split('/').pop();

    for (const pattern of TEMP_FILE_PATTERNS) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      if (regex.test(fileName)) {
        tempFiles.push(file);
        log(`  Found: ${relative(ROOT_DIR, file)}`, colors.gray);
        break;
      }
    }
  }

  // Check for temp directories
  for (const dir of TEMP_DIRECTORIES) {
    const dirPath = join(ROOT_DIR, dir);
    if (existsSync(dirPath)) {
      const files = await getFilesRecursive(dirPath);
      tempFiles.push(...files);
      log(`  Found directory: ${dir} (${files.length} files)`, colors.gray);
    }
  }

  return tempFiles;
}

async function deleteFiles(files, category) {
  if (files.length === 0) {
    log(`\n✓ No ${category} to delete`, colors.green);
    return { count: 0, size: 0 };
  }

  let totalSize = 0;
  for (const file of files) {
    const size = await getFileSizeMB(file);
    totalSize += parseFloat(size);
  }

  log(`\n${isDryRun ? '📋' : '🗑️'}  ${category}:`, colors.yellow);
  for (const file of files) {
    const relativePath = relative(ROOT_DIR, file);
    const size = await getFileSizeMB(file);
    log(`  ${isDryRun ? 'Would delete' : 'Deleting'}: ${relativePath} (${size} MB)`, colors.gray);

    if (!isDryRun) {
      try {
        await unlink(file);
      } catch (error) {
        log(`    ⚠️  Failed to delete: ${error.message}`, colors.red);
      }
    }
  }

  return { count: files.length, size: totalSize };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', colors.blue);
  log('║          🧹 Repository Cleanup Tool                        ║', colors.blue);
  log('╚════════════════════════════════════════════════════════════╝', colors.blue);

  if (isDryRun) {
    log('\n🔍 DRY RUN MODE - No files will be deleted\n', colors.yellow);
  }

  if (isForce) {
    log('⚡ FORCE MODE - Skipping confirmations\n', colors.yellow);
  }

  // Scan for files
  const unreferencedMd = await findUnreferencedMarkdownFiles();
  const unusedImages = await findUnusedImages();
  const tempFiles = await findTempFiles();

  // Summary
  logSection('📊 Cleanup Summary');
  log(`  Unreferenced Markdown files: ${unreferencedMd.length}`, colors.yellow);
  log(`  Unused images: ${unusedImages.length}`, colors.yellow);
  log(`  Temporary files: ${tempFiles.length}`, colors.yellow);
  log(`  Total files to ${isDryRun ? 'be' : ''} delete: ${unreferencedMd.length + unusedImages.length + tempFiles.length}\n`, colors.yellow);

  if (unreferencedMd.length === 0 && unusedImages.length === 0 && tempFiles.length === 0) {
    log('\n✅ Repository is already clean!\n', colors.green);
    process.exit(0);
  }

  // Confirm deletion
  if (!isDryRun) {
    const confirmed = await promptConfirm('\n🚨 Proceed with deletion?');
    if (!confirmed) {
      log('\n❌ Cleanup cancelled\n', colors.red);
      process.exit(0);
    }
  }

  // Delete files
  const mdResult = await deleteFiles(unreferencedMd, 'Markdown Files');
  const imgResult = await deleteFiles(unusedImages, 'Image Files');
  const tempResult = await deleteFiles(tempFiles, 'Temporary Files');

  // Final summary
  logSection('✅ Cleanup Complete');

  const totalCount = mdResult.count + imgResult.count + tempResult.count;
  const totalSize = (mdResult.size + imgResult.size + tempResult.size).toFixed(2);

  log(`  ${isDryRun ? 'Would delete' : 'Deleted'}: ${totalCount} files`, colors.green);
  log(`  ${isDryRun ? 'Would free' : 'Freed'}: ${totalSize} MB\n`, colors.green);

  if (isDryRun) {
    log('💡 Run without --dry-run to actually delete these files\n', colors.blue);
  } else {
    log('🎉 Repository cleaned successfully!\n', colors.green);
  }
}

// Run
main().catch((error) => {
  log(`\n❌ Error: ${error.message}\n`, colors.red);
  process.exit(1);
});
