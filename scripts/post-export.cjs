#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distDir = path.resolve(process.argv[2] || 'dist');
const publicUrl = process.env.EXPO_PUBLIC_URL || '';

let basePath = '';
if (publicUrl) {
  try {
    const parsed = new URL(publicUrl);
    basePath = parsed.pathname;
  } catch (error) {
    basePath = publicUrl;
  }
}

if (!basePath) {
  basePath = '';
}

basePath = basePath.trim();

if (basePath.endsWith('/')) {
  basePath = basePath.slice(0, -1);
}

if (basePath && !basePath.startsWith('/')) {
  basePath = `/${basePath}`;
}

if (basePath === '/' || basePath === '') {
  console.log('post-export: no base path detected, skipping asset URL patch.');
  process.exit(0);
}

const prefix = basePath;

const patchFile = (filePath, replacements) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content;

  replacements.forEach(({ pattern, replacement }) => {
    updated = updated.replace(pattern, replacement);
  });

  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
    console.log(`post-export: patched ${path.relative(process.cwd(), filePath)}`);
  }
};

patchFile(path.join(distDir, 'index.html'), [
  { pattern: /"\/favicon/g, replacement: `"${prefix}/favicon` },
  { pattern: /"\/_expo/g, replacement: `"${prefix}/_expo` },
  { pattern: /"\/assets/g, replacement: `"${prefix}/assets` },
  { pattern: /"\/node_modules/g, replacement: `"${prefix}/node_modules` },
]);

const webJsDir = path.join(distDir, '_expo', 'static', 'js', 'web');
if (fs.existsSync(webJsDir)) {
  fs.readdirSync(webJsDir)
    .filter((file) => file.endsWith('.js'))
    .forEach((file) => {
      patchFile(path.join(webJsDir, file), [
        { pattern: /"\/_expo/g, replacement: `"${prefix}/_expo` },
        { pattern: /"\/assets/g, replacement: `"${prefix}/assets` },
        { pattern: /"\/node_modules/g, replacement: `"${prefix}/node_modules` },
      ]);
    });
}

console.log(`post-export: applied public path prefix '${prefix}' to exported assets.`);