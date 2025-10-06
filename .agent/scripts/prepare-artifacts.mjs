#!/usr/bin/env node

/**
 * Artifacts Preparation Script
 *
 * Sammelt alle generierten Reports, Logs und Screenshots in einem strukturierten
 * artifacts/ Verzeichnis für PR-Artefakte.
 *
 * Nutzung: node .agent/scripts/prepare-artifacts.mjs [agent-name]
 */

import { mkdir, copyFile, readdir, stat, writeFile } from 'fs/promises';
import { join, basename } from 'path';
import { existsSync } from 'fs';

const ARTIFACTS_BASE = 'artifacts';
const SOURCES = {
  'ui-refactor': [
    { src: 'storybook-static', dest: 'storybook-static', type: 'dir' },
    { src: 'playwright-report', dest: 'playwright-report', type: 'dir' },
    { src: 'test-results', dest: 'screenshots', type: 'dir' },
    { src: 'artifacts/lighthouse/lighthouse-home.report.html', dest: 'lighthouse.html', type: 'file' },
  ],
  'pwa-perf': [
    { src: 'artifacts/lighthouse', dest: 'lighthouse', type: 'dir' },
    { src: 'artifacts/bundle/stats.html', dest: 'stats.html', type: 'file' },
    { src: 'artifacts/bundle/bundle-summary.md', dest: 'bundle-summary.md', type: 'file' },
  ],
  'test-guard': [
    { src: 'coverage', dest: 'coverage', type: 'dir' },
    { src: 'playwright-report', dest: 'playwright-report', type: 'dir' },
    { src: 'test-results', dest: 'test-results', type: 'dir' },
  ],
  'docs': [
    { src: 'README.md', dest: 'README.md', type: 'file' },
    { src: 'CLAUDE.md', dest: 'CLAUDE.md', type: 'file' },
    { src: 'CONTRIBUTING.md', dest: 'CONTRIBUTING.md', type: 'file' },
    { src: 'CHANGELOG.md', dest: 'CHANGELOG.md', type: 'file' },
    { src: 'docs/screenshots', dest: 'screenshots', type: 'dir' },
  ],
};

async function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

async function copyRecursive(src, dest) {
  const srcStat = await stat(src);

  if (srcStat.isDirectory()) {
    await ensureDir(dest);
    const entries = await readdir(src);

    for (const entry of entries) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      await copyRecursive(srcPath, destPath);
    }
  } else {
    await ensureDir(join(dest, '..'));
    await copyFile(src, dest);
  }
}

async function generateManifest(agentName, outputDir) {
  const manifest = {
    agent: agentName,
    generated: new Date().toISOString(),
    artifacts: [],
  };

  // List all files in output dir
  const listFiles = async (dir, relativePath = '') => {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = join(relativePath, entry);
      const entryStat = await stat(fullPath);

      if (entryStat.isDirectory()) {
        await listFiles(fullPath, relPath);
      } else {
        manifest.artifacts.push({
          path: relPath,
          size: entryStat.size,
          sizeKB: Math.round(entryStat.size / 1024),
        });
      }
    }
  };

  await listFiles(outputDir);

  // Write manifest
  const manifestPath = join(outputDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ Manifest created: ${manifestPath}`);

  return manifest;
}

async function prepareArtifacts(agentName) {
  console.log(`\n🗂️  Preparing artifacts for: ${agentName}\n`);

  const sources = SOURCES[agentName];
  if (!sources) {
    console.error(`❌ Unknown agent: ${agentName}`);
    console.log(`Available agents: ${Object.keys(SOURCES).join(', ')}`);
    process.exit(1);
  }

  const outputDir = join(ARTIFACTS_BASE, agentName);
  await ensureDir(outputDir);

  let copiedCount = 0;
  let skippedCount = 0;

  for (const source of sources) {
    const srcPath = source.src;
    const destPath = join(outputDir, source.dest);

    if (!existsSync(srcPath)) {
      console.warn(`⚠️  Skipping (not found): ${srcPath}`);
      skippedCount++;
      continue;
    }

    try {
      if (source.type === 'dir') {
        await copyRecursive(srcPath, destPath);
        console.log(`✅ Copied directory: ${srcPath} → ${destPath}`);
      } else {
        await ensureDir(join(destPath, '..'));
        await copyFile(srcPath, destPath);
        console.log(`✅ Copied file: ${srcPath} → ${destPath}`);
      }
      copiedCount++;
    } catch (error) {
      console.error(`❌ Failed to copy ${srcPath}:`, error.message);
      skippedCount++;
    }
  }

  // Generate manifest
  const manifest = await generateManifest(agentName, outputDir);

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   Copied: ${copiedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total artifacts: ${manifest.artifacts.length}`);
  console.log(`   Total size: ${Math.round(manifest.artifacts.reduce((sum, a) => sum + a.size, 0) / 1024)} KB`);
  console.log(`\n✅ Artifacts prepared in: ${outputDir}/`);
}

async function main() {
  const agentName = process.argv[2];

  if (!agentName) {
    console.log('Usage: node .agent/scripts/prepare-artifacts.mjs [agent-name]');
    console.log('');
    console.log('Available agents:');
    Object.keys(SOURCES).forEach(name => {
      console.log(`  - ${name}`);
    });
    console.log('');
    process.exit(1);
  }

  console.log('🚀 Starting Artifacts Preparation...');
  await prepareArtifacts(agentName);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
