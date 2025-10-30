#!/usr/bin/env node

/**
 * Lighthouse Runner für Key Screens
 *
 * Führt Lighthouse-Audits für wichtige Seiten aus und speichert Reports.
 * Nutzung: node .agent/scripts/run-lighthouse.mjs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

// Konfiguration
const BASE_URL = 'http://localhost:4173'; // Preview Server (Production Build)
const OUTPUT_DIR = 'artifacts/lighthouse';
const SCREENS = [
  { name: 'home', path: '/' },
  { name: 'leaderboard', path: '/leaderboard' },
  { name: 'notes', path: '/notes' },
];

const MIN_SCORES = {
  performance: 90,
  pwa: 90,
  accessibility: 90,
  'best-practices': 90,
};

async function ensureOutputDir() {
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created output directory: ${OUTPUT_DIR}`);
  }
}

async function runLighthouse(screen) {
  const url = `${BASE_URL}${screen.path}`;
  const outputPath = `${OUTPUT_DIR}/lighthouse-${screen.name}`;

  console.log(`\n🔍 Running Lighthouse for ${screen.name} (${url})...`);

  try {
    const command = `npx lighthouse "${url}" \
      --output=json,html \
      --output-path="${outputPath}" \
      --chrome-flags="--headless --no-sandbox" \
      --quiet`;

    await execAsync(command);
    console.log(`✅ Report saved: ${outputPath}.html`);

    return { screen: screen.name, success: true };
  } catch (error) {
    console.error(`❌ Failed to run Lighthouse for ${screen.name}:`, error.message);
    return { screen: screen.name, success: false, error: error.message };
  }
}

async function checkScores() {
  console.log('\n📊 Checking Lighthouse Scores...\n');

  const { readFile } = await import('fs/promises');
  let hasFailures = false;

  for (const screen of SCREENS) {
    const reportPath = `${OUTPUT_DIR}/lighthouse-${screen.name}.report.json`;

    try {
      const reportContent = await readFile(reportPath, 'utf-8');
      const report = JSON.parse(reportContent);

      const categories = report.categories;
      const scores = {
        performance: Math.round(categories.performance.score * 100),
        pwa: Math.round(categories.pwa.score * 100),
        accessibility: Math.round(categories.accessibility.score * 100),
        'best-practices': Math.round(categories['best-practices'].score * 100),
      };

      console.log(`📄 ${screen.name}:`);
      console.log(`   Performance: ${scores.performance} ${scores.performance >= MIN_SCORES.performance ? '✅' : '❌'}`);
      console.log(`   PWA: ${scores.pwa} ${scores.pwa >= MIN_SCORES.pwa ? '✅' : '❌'}`);
      console.log(`   Accessibility: ${scores.accessibility} ${scores.accessibility >= MIN_SCORES.accessibility ? '✅' : '❌'}`);
      console.log(`   Best Practices: ${scores['best-practices']} ${scores['best-practices'] >= MIN_SCORES['best-practices'] ? '✅' : '❌'}`);

      // Check for failures
      for (const [key, score] of Object.entries(scores)) {
        if (score < MIN_SCORES[key]) {
          hasFailures = true;
          console.log(`   ⚠️  ${key} score ${score} is below minimum ${MIN_SCORES[key]}`);
        }
      }

      console.log('');
    } catch (error) {
      console.error(`❌ Could not read report for ${screen.name}:`, error.message);
      hasFailures = true;
    }
  }

  if (hasFailures) {
    console.error('\n❌ Some Lighthouse scores are below minimum thresholds!');
    process.exit(1);
  } else {
    console.log('\n✅ All Lighthouse scores meet minimum requirements!');
  }
}

async function main() {
  console.log('🚀 Starting Lighthouse Audits...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log(`Screens: ${SCREENS.map(s => s.name).join(', ')}\n`);

  // Ensure output directory exists
  await ensureOutputDir();

  // Run Lighthouse for each screen
  const results = [];
  for (const screen of SCREENS) {
    const result = await runLighthouse(screen);
    results.push(result);
  }

  // Summary
  console.log('\n📋 Summary:');
  results.forEach(r => {
    console.log(`   ${r.screen}: ${r.success ? '✅ Success' : '❌ Failed'}`);
  });

  // Check scores
  await checkScores();

  console.log(`\n✅ Lighthouse audits completed! Reports saved in ${OUTPUT_DIR}/`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
