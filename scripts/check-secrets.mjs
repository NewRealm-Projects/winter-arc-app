#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  'node_modules',
  'dist',
  'coverage',
  '.vercel',
]);

const MAX_FILE_BYTES = 1024 * 1024; // 1MB safety cap

const SECRET_PATTERNS = [
  { id: 'rsa-private-key', regex: /-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/ },
  { id: 'generic-private-key', regex: /-----BEGIN PRIVATE KEY-----/ },
  { id: 'aws-access-key', regex: /AKIA[0-9A-Z]{16}/ },
  { id: 'aws-secret-key', regex: /(?<![A-Z0-9])[A-Za-z0-9\/+]{40}(?![A-Z0-9])/ },
  { id: 'google-api-key', regex: /AIza[0-9A-Za-z\-_]{35}/ },
  { id: 'slack-token', regex: /xox[baprs]-[0-9A-Za-z\-]{10,48}/ },
  { id: 'github-token', regex: /gh[pousr]_[0-9A-Za-z]{36}/ },
  { id: 'heroku-api-key', regex: /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/ },
  { id: 'google-client-secret', regex: /[0-9A-Za-z-_]{24}\.[0-9A-Za-z-_]{6}\.[0-9A-Za-z-_]{27}/ },
  { id: 'potential-password', regex: /password\s*[:=]\s*['\"][^'"\n]{6,}['\"]/i },
];

const TEXT_ENCODINGS = ['utf8', 'utf16le', 'latin1'];

async function* walk(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    if (IGNORED_DIRECTORIES.has(dirent.name)) {
      continue;
    }
    const resolved = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* walk(resolved);
    } else if (dirent.isFile()) {
      yield resolved;
    }
  }
}

function isBinary(buffer) {
  const textSample = buffer.slice(0, 256);
  for (const byte of textSample) {
    if (byte === 0) {
      return true;
    }
  }
  return false;
}

async function readTextFile(filePath) {
  const stat = await fs.stat(filePath);
  if (stat.size === 0 || stat.size > MAX_FILE_BYTES) {
    return null;
  }
  const buffer = await fs.readFile(filePath);
  if (isBinary(buffer)) {
    return null;
  }
  for (const encoding of TEXT_ENCODINGS) {
    try {
      return buffer.toString(encoding);
    } catch {
      /* continue trying */
    }
  }
  return null;
}

async function scanFile(filePath) {
  const content = await readTextFile(filePath);
  if (!content) {
    return [];
  }
  const matches = [];
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.regex.test(content)) {
      matches.push(pattern.id);
    }
  }
  return matches;
}

async function main() {
  const repoRoot = process.cwd();
  const findings = [];

  for await (const filePath of walk(repoRoot)) {
    const matches = await scanFile(filePath);
    if (matches.length > 0) {
      findings.push({ file: path.relative(repoRoot, filePath), matches });
    }
  }

  if (findings.length > 0) {
    console.error('\nSecret scan failed: potential secrets detected.');
    for (const { file, matches } of findings) {
      console.error(` - ${file}: ${matches.join(', ')}`);
    }
    console.error('\nResolve the findings before committing. If false positives, update the checker to whitelist intentionally committed values.');
    process.exit(1);
  }

  console.log('✅ Secret scan passed: no obvious secrets detected.');
}

main().catch((error) => {
  console.error('Secret scan error:', error);
  process.exit(1);
});
