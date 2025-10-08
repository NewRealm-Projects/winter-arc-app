import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

function maskSecret(secret) {
  return `${secret.slice(0, 6)}…${secret.slice(-4)}`;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function scanForGoogleApiKeys() {
  const trackedFiles = execSync('git ls-files', { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .map((filePath) => filePath.trim())
    .filter(Boolean);

  const googleApiKeyPattern = /AIza[0-9A-Za-z_\-]{35}/g;
  const findings = [];

  for (const relativePath of trackedFiles) {
    const absolutePath = path.join(repoRoot, relativePath);
    const stats = statSync(absolutePath);

    if (!stats.isFile()) {
      continue;
    }

    // Skip very large files (likely binaries or generated artifacts)
    if (stats.size > 1_000_000) {
      continue;
    }

    let content;
    try {
      content = readFileSync(absolutePath, 'utf8');
    } catch (error) {
      // Binary or unreadable file – skip silently
      continue;
    }

    let match;
    while ((match = googleApiKeyPattern.exec(content)) !== null) {
      findings.push({
        file: relativePath,
        line: getLineNumber(content, match.index),
        secret: maskSecret(match[0]),
      });
    }
  }

  if (findings.length > 0) {
    console.error('❌ Potential Google API keys detected in tracked files:');
    for (const finding of findings) {
      console.error(`  - ${finding.file}:${finding.line} → ${finding.secret}`);
    }
    console.error('\nPlease remove the leaked secrets, rotate the affected Google API keys, and force-push the cleaned history.');
    process.exitCode = 1;
    return;
  }

  console.log('✅ No Google API keys detected in tracked files.');
}

try {
  scanForGoogleApiKeys();
} catch (error) {
  console.error('⚠️ Secret scan failed to complete:', error);
  process.exitCode = 1;
}
