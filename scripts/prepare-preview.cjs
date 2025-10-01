#!/usr/bin/env node

/**
 * Prepare preview build for local testing
 * Creates winter-arc-app subdirectory to match production paths
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const previewDir = path.join(__dirname, '..', 'preview');
const targetDir = path.join(previewDir, 'winter-arc-app');

console.log('Preparing preview build...');

// Remove existing preview directory
if (fs.existsSync(previewDir)) {
  fs.rmSync(previewDir, { recursive: true, force: true });
  console.log('✓ Cleaned preview directory');
}

// Create preview/winter-arc-app directory
fs.mkdirSync(targetDir, { recursive: true });
console.log('✓ Created preview directory structure');

// Copy dist contents to preview/winter-arc-app
function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(distDir, targetDir);
console.log('✓ Copied dist files to preview/winter-arc-app');

console.log('\nPreview build ready!');
console.log('Run: npx http-server preview -p 8080');
console.log('Open: http://localhost:8080/winter-arc-app');
