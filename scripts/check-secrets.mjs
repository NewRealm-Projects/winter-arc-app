#!/usr/bin/env node
/**
 * Security Check Script - Detects exposed secrets in code and git history
 *
 * Usage:
 *   npm run lint:secrets              # Check working directory (git ls-files)
 *   node scripts/check-secrets.mjs --history  # Check git history
 *   node scripts/check-secrets.mjs --staged   # Check staged files (for pre-commit hook)
 *
 * Exit codes:
 *   0 - No secrets found
 *   1 - Secrets detected
 *   2 - Script error
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

// ANSI color codes
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Define secret patterns to detect
const SECRET_PATTERNS = [
  {
    name: 'Google API Key',
    pattern: /AIza[0-9A-Za-z_-]{35}/g,
    severity: 'critical',
    description: 'Google API Key (Firebase, Maps, etc.)',
  },
  {
    name: 'Firebase Project ID',
    pattern: /(?:firebase_project_id|VITE_FIREBASE_PROJECT_ID)["':\s=]+([a-z0-9-]+)/gi,
    severity: 'high',
    description: 'Firebase Project ID (should be in .env)',
  },
  {
    name: 'Generic API Key',
    pattern: /(?:api[_-]?key|apikey)["':\s=]+([a-zA-Z0-9_-]{20,})/gi,
    severity: 'high',
    description: 'Generic API Key pattern',
  },
  {
    name: 'AWS Access Key',
    pattern: /(?:AKIA|ASIA)[0-9A-Z]{16}/g,
    severity: 'critical',
    description: 'AWS Access Key ID',
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'critical',
    description: 'Private Key (RSA, EC, SSH)',
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
    severity: 'high',
    description: 'JSON Web Token (JWT)',
  },
  {
    name: 'Bearer Token',
    pattern: /Bearer\s+[a-zA-Z0-9_-]{20,}/gi,
    severity: 'high',
    description: 'Bearer authentication token',
  },
  {
    name: 'Sentry DSN',
    pattern: /https:\/\/[a-f0-9]{32}@[a-z0-9]+\.ingest\.sentry\.io\/\d+/gi,
    severity: 'medium',
    description: 'Sentry DSN (should be in .env)',
  },
];

// Files and directories to ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.vscode/,
  /\.idea/,
  /\.env\.example$/,
  /\.env\.1password\./,
  /\.example\.json$/,
  /CLAUDE\.md$/,
  /check-secrets\.(ts|js|mjs)$/,
  /1password/i,
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /vite-env\.d\.ts$/,
  /-env\.d\.ts$/,
  /\.md$/,
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
];

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function isFalsePositive(match, line) {
  // Skip comments
  if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
    return true;
  }

  // Skip 1Password secret references (op://vault/item/field)
  if (line.includes('op://') || line.includes('op read') || line.includes('op item')) {
    return true;
  }

  // Skip .env.1password files (only contain references, not secrets)
  if (line.includes('.env.1password')) {
    return true;
  }

  // Skip example/placeholder values
  const placeholders = [
    'your-api-key',
    'YOUR_API_KEY',
    'example.com',
    'EXAMPLE',
    'xxx',
    '***',
  ];
  if (placeholders.some((ph) => match.includes(ph))) {
    return true;
  }

  // Skip .env.example patterns (template variables)
  if (line.includes('=') && match.startsWith('${')) {
    return true;
  }

  return false;
}

function scanFileContent(filePath, content) {
  const matches = [];
  const lines = content.split('\n');

  for (const pattern of SECRET_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      let match;

      while ((match = regex.exec(line)) !== null) {
        // Skip false positives
        if (isFalsePositive(match[0], line)) continue;

        matches.push({
          file: filePath,
          line: i + 1,
          match: match[0],
          pattern,
        });
      }
    }
  }

  return matches;
}

function scanGitTrackedFiles() {
  const matches = [];

  try {
    const trackedFiles = execSync('git ls-files', { cwd: repoRoot, encoding: 'utf8' })
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f && !shouldIgnoreFile(f));

    for (const file of trackedFiles) {
      const absolutePath = path.join(repoRoot, file);
      if (!existsSync(absolutePath)) continue;

      let stats;
      try {
        stats = statSync(absolutePath);
      } catch (_err) {
        continue;
      }

      if (!stats.isFile() || stats.size > 10_000_000) continue; // Skip files > 10MB

      try {
        const content = readFileSync(absolutePath, 'utf-8');
        const fileMatches = scanFileContent(file, content);
        matches.push(...fileMatches);
      } catch (_err) {
        // Skip binary files or files with encoding issues
      }
    }
  } catch (err) {
    console.error(`${RED}Error scanning git tracked files:${RESET}`, err);
  }

  return matches;
}

function scanGitHistory() {
  const matches = [];

  try {
    // First scan all tracked files
    matches.push(...scanGitTrackedFiles());

    // Also check git log for secrets in commit messages
    const commitLog = execSync('git log --all --format=%B', {
      cwd: repoRoot,
      encoding: 'utf-8',
    });
    const commitMatches = scanFileContent('[commit messages]', commitLog);
    matches.push(...commitMatches);
  } catch (err) {
    console.error(`${RED}Error scanning git history:${RESET}`, err);
  }

  return matches;
}

function scanStagedFiles() {
  const matches = [];

  try {
    const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
      cwd: repoRoot,
      encoding: 'utf-8',
    })
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f && !shouldIgnoreFile(f));

    for (const file of stagedFiles) {
      const absolutePath = path.join(repoRoot, file);
      if (!existsSync(absolutePath)) continue;

      try {
        const content = readFileSync(absolutePath, 'utf-8');
        const fileMatches = scanFileContent(file, content);
        matches.push(...fileMatches);
      } catch (_err) {
        // Skip binary files
      }
    }
  } catch (err) {
    console.error(`${RED}Error scanning staged files:${RESET}`, err);
  }

  return matches;
}

function printResults(matches) {
  if (matches.length === 0) {
    console.log(`\n${GREEN}✓ No secrets detected${RESET}\n`);
    return;
  }

  console.log(
    `\n${RED}${BOLD}⚠ SECURITY WARNING: ${matches.length} potential secret(s) detected${RESET}\n`
  );

  // Group by severity
  const critical = matches.filter((m) => m.pattern.severity === 'critical');
  const high = matches.filter((m) => m.pattern.severity === 'high');
  const medium = matches.filter((m) => m.pattern.severity === 'medium');

  function printMatches(title, items) {
    if (items.length === 0) return;

    console.log(`${BOLD}${title}${RESET}`);
    for (const match of items) {
      console.log(`  ${RED}✗${RESET} ${match.file}:${match.line}`);
      console.log(`    ${BLUE}Type:${RESET} ${match.pattern.name}`);
      console.log(`    ${BLUE}Match:${RESET} ${match.match.substring(0, 50)}...`);
      console.log(`    ${BLUE}Description:${RESET} ${match.pattern.description}`);
      console.log();
    }
  }

  printMatches(`🔴 CRITICAL (${critical.length})`, critical);
  printMatches(`🟠 HIGH (${high.length})`, high);
  printMatches(`🟡 MEDIUM (${medium.length})`, medium);

  console.log(`${YELLOW}${BOLD}IMMEDIATE ACTION REQUIRED:${RESET}`);
  console.log(`  1. DO NOT commit these changes`);
  console.log(`  2. Remove secrets from code and use environment variables`);
  console.log(`  3. Rotate/regenerate any exposed credentials`);
  console.log(`  4. Add secrets to .env and ensure .env is in .gitignore`);
  console.log();
}

function main() {
  const args = process.argv.slice(2);
  const checkHistory = args.includes('--history');
  const checkStaged = args.includes('--staged');

  console.log(`${BOLD}🔒 Winter Arc Security Check${RESET}\n`);

  let matches = [];

  if (checkHistory) {
    console.log('Scanning git history...');
    matches = scanGitHistory();
  } else if (checkStaged) {
    console.log('Scanning staged files...');
    matches = scanStagedFiles();
  } else {
    console.log('Scanning git tracked files...');
    matches = scanGitTrackedFiles();
  }

  printResults(matches);

  // Exit with error if secrets found
  if (matches.length > 0) {
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(`${RED}Script error:${RESET}`, err);
  process.exit(2);
}
