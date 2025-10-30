#!/usr/bin/env node

/**
 * Bundle Analyzer Wrapper
 *
 * Generiert Bundle-Statistiken und analysiert große Chunks.
 * Nutzung: node .agent/scripts/bundle-report.mjs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, stat, mkdir, copyFile } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

const DIST_DIR = 'dist/assets';
const OUTPUT_DIR = 'artifacts/bundle';
const SIZE_WARNING_KB = 200; // Warn for chunks > 200kb

async function ensureOutputDir() {
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created output directory: ${OUTPUT_DIR}`);
  }
}

async function buildWithAnalyzer() {
  console.log('🔨 Building with Bundle Analyzer...\n');

  try {
    // Vite build already includes rollup-plugin-visualizer
    await execAsync('npm run build');
    console.log('✅ Build completed\n');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

async function analyzeChunks() {
  console.log('📊 Analyzing Chunks...\n');

  if (!existsSync(DIST_DIR)) {
    console.error(`❌ Dist directory not found: ${DIST_DIR}`);
    process.exit(1);
  }

  const files = await readdir(DIST_DIR);
  const jsFiles = files.filter(f => extname(f) === '.js');

  const chunks = [];
  for (const file of jsFiles) {
    const filePath = join(DIST_DIR, file);
    const stats = await stat(filePath);
    const sizeKB = Math.round(stats.size / 1024);

    chunks.push({ name: file, sizeKB });
  }

  // Sort by size (descending)
  chunks.sort((a, b) => b.sizeKB - a.sizeKB);

  console.log('📦 JavaScript Chunks:\n');
  chunks.forEach(chunk => {
    const warning = chunk.sizeKB > SIZE_WARNING_KB ? '⚠️ ' : '✅';
    console.log(`   ${warning} ${chunk.name}: ${chunk.sizeKB} KB`);
  });

  console.log('');

  // Check for oversized chunks
  const oversized = chunks.filter(c => c.sizeKB > SIZE_WARNING_KB);
  if (oversized.length > 0) {
    console.warn(`⚠️  Warning: ${oversized.length} chunk(s) exceed ${SIZE_WARNING_KB}KB:\n`);
    oversized.forEach(c => {
      console.warn(`   - ${c.name}: ${c.sizeKB} KB`);
    });
    console.warn('\n💡 Consider code-splitting or lazy loading for these chunks.\n');
  }

  // Total size
  const totalKB = chunks.reduce((sum, c) => sum + c.sizeKB, 0);
  console.log(`📦 Total JS Bundle Size: ${totalKB} KB\n`);

  return { chunks, totalKB, oversized };
}

async function copyStatsFile() {
  const statsFile = 'stats.html';
  if (existsSync(statsFile)) {
    await copyFile(statsFile, join(OUTPUT_DIR, 'stats.html'));
    console.log(`✅ Bundle visualizer copied to ${OUTPUT_DIR}/stats.html`);
  } else {
    console.warn(`⚠️  stats.html not found (rollup-plugin-visualizer might not be configured)`);
  }
}

async function generateSummary(analysisResult) {
  const { chunks, totalKB, oversized } = analysisResult;

  const summary = `# Bundle Analysis Summary

**Generated**: ${new Date().toISOString()}
**Total JS Size**: ${totalKB} KB

## Chunks (by size)

${chunks.map(c => `- **${c.name}**: ${c.sizeKB} KB ${c.sizeKB > SIZE_WARNING_KB ? '⚠️' : '✅'}`).join('\n')}

## Oversized Chunks (> ${SIZE_WARNING_KB}KB)

${oversized.length > 0
  ? oversized.map(c => `- **${c.name}**: ${c.sizeKB} KB`).join('\n')
  : '✅ No oversized chunks'}

## Recommendations

${oversized.length > 0
  ? `- Consider code-splitting for large chunks
- Use dynamic imports for heavy libraries
- Check for duplicate dependencies in bundle`
  : '✅ All chunks are within acceptable size limits'}

## Visualizer

Open \`${OUTPUT_DIR}/stats.html\` in a browser for interactive bundle visualization.
`;

  const { writeFile } = await import('fs/promises');
  await writeFile(join(OUTPUT_DIR, 'bundle-summary.md'), summary);
  console.log(`✅ Summary saved to ${OUTPUT_DIR}/bundle-summary.md\n`);
}

async function main() {
  console.log('🚀 Starting Bundle Analysis...\n');

  await ensureOutputDir();
  await buildWithAnalyzer();
  const analysisResult = await analyzeChunks();
  await copyStatsFile();
  await generateSummary(analysisResult);

  console.log(`✅ Bundle analysis completed! Reports saved in ${OUTPUT_DIR}/`);
  console.log(`\n💡 Open ${OUTPUT_DIR}/stats.html in a browser for interactive visualization.\n`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
