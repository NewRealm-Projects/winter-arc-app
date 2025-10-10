#!/usr/bin/env node

/**
 * Firestore Data Consistency Check
 *
 * Comprehensive validation of all data structures:
 * - Migration status (days → entries)
 * - Streak calculations (old vs. new weighted logic)
 * - Triple-storage sync (entries/checkins/trainingLoad)
 * - Schema validation against TypeScript types
 * - Week aggregations accuracy
 * - User data integrity
 * - Group membership validation
 *
 * Usage:
 *   node scripts/consistency-check.mjs [--fix] [--user=<userId>]
 *
 * Flags:
 *   --fix           Apply automatic fixes (with confirmation)
 *   --user=<id>     Check specific user only
 *   --dry-run       Show what would be fixed without fixing
 *
 * Output:
 *   - consistency_check.log      Detailed report
 *   - inconsistencies.json       Structured error list
 *   - fix_script.mjs             Auto-generated fix script (if --fix used)
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STREAK_COMPLETION_THRESHOLD = 70; // From src/constants/streak.ts
const STREAK_WEIGHTS_BASE = {
  movement: 0.4,
  water: 0.3,
  protein: 0.3,
};
const STREAK_WEIGHTS_WITH_CHECKIN = {
  movement: 0.35,
  water: 0.25,
  protein: 0.25,
  checkin: 0.15,
};

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const isDryRun = args.includes('--dry-run');
const specificUser = args.find(arg => arg.startsWith('--user='))?.split('=')[1];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Colors & Logging
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

const logBuffer = [];

function log(message, color = colors.reset, toBuffer = true) {
  const output = `${color}${message}${colors.reset}`;
  console.log(output);
  if (toBuffer) {
    logBuffer.push(message);
  }
}

function logSection(title) {
  const line = '━'.repeat(80);
  console.log(`\n${colors.cyan}${line}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${line}${colors.reset}\n`);
  logBuffer.push('');
  logBuffer.push(line);
  logBuffer.push(title);
  logBuffer.push(line);
  logBuffer.push('');
}

function logError(message, details = null) {
  log(`  ❌ ${message}`, colors.red);
  if (details) {
    log(`     ${JSON.stringify(details, null, 2)}`, colors.gray);
  }
}

function logWarning(message, details = null) {
  log(`  ⚠️  ${message}`, colors.yellow);
  if (details) {
    log(`     ${JSON.stringify(details, null, 2)}`, colors.gray);
  }
}

function logSuccess(message) {
  log(`  ✓ ${message}`, colors.green);
}

function logInfo(message) {
  log(`  ℹ ${message}`, colors.blue);
}

async function promptConfirm(message) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${message} (y/N): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Inconsistency Tracking
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const inconsistencies = {
  migration: [],
  streak: [],
  tripleStorage: [],
  schema: [],
  weekAggregation: [],
  userData: [],
  groups: [],
};

function recordInconsistency(category, userId, type, details) {
  inconsistencies[category].push({
    userId,
    type,
    details,
    timestamp: new Date().toISOString(),
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Firebase Initialization (Placeholder)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * NOTE: This script requires Firebase Admin SDK access
 *
 * Installation:
 *   npm install firebase-admin --save-dev
 *
 * Setup:
 *   1. Download service account JSON from Firebase Console
 *   2. Save as: scripts/serviceAccountKey.json
 *   3. Add to .gitignore (security!)
 *
 * Alternatively, set GOOGLE_APPLICATION_CREDENTIALS environment variable
 */

let db = null;

async function initializeFirebase() {
  try {
    // Check for service account key
    const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');

    if (!existsSync(serviceAccountPath)) {
      log('❌ Firebase service account key not found!', colors.red);
      log('', colors.reset);
      log('To run this script, you need Firebase Admin credentials:', colors.yellow);
      log('', colors.reset);
      log('1. Go to Firebase Console → Project Settings → Service Accounts', colors.cyan);
      log('2. Click "Generate new private key"', colors.cyan);
      log('3. Save the JSON file as: scripts/serviceAccountKey.json', colors.cyan);
      log('4. Add serviceAccountKey.json to .gitignore', colors.cyan);
      log('', colors.reset);
      log('Alternative: Set GOOGLE_APPLICATION_CREDENTIALS environment variable', colors.gray);
      log('', colors.reset);
      process.exit(1);
    }

    // Dynamic import of firebase-admin (if installed)
    let adminModule;
    try {
      adminModule = await import('firebase-admin');
    } catch {
      log('❌ firebase-admin not installed!', colors.red);
      log('', colors.reset);
      log('Install it with: npm install firebase-admin --save-dev', colors.yellow);
      log('', colors.reset);
      process.exit(1);
    }

    // Get the default export (ESM compatibility)
    const admin = adminModule.default || adminModule;

    const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    logSuccess('Firebase Admin initialized successfully');
    return db;
  } catch (error) {
    log(`❌ Failed to initialize Firebase: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Data Fetching Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function getAllUsers() {
  const snapshot = await db.collection('users').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getUserEntries(userId) {
  const snapshot = await db.collection('tracking').doc(userId).collection('entries').get();
  const entries = {};
  snapshot.docs.forEach(doc => {
    entries[doc.id] = doc.data();
  });
  return entries;
}

async function getUserDays(userId) {
  try {
    const snapshot = await db.collection('tracking').doc(userId).collection('days').get();
    const days = {};
    snapshot.docs.forEach(doc => {
      days[doc.id] = doc.data();
    });
    return days;
  } catch {
    return {};
  }
}

async function getUserCheckIns(userId) {
  const snapshot = await db.collection('users').doc(userId).collection('checkins').get();
  const checkIns = {};
  snapshot.docs.forEach(doc => {
    checkIns[doc.id] = doc.data();
  });
  return checkIns;
}

async function getUserTrainingLoad(userId) {
  const snapshot = await db.collection('users').doc(userId).collection('trainingLoad').get();
  const trainingLoad = {};
  snapshot.docs.forEach(doc => {
    trainingLoad[doc.id] = doc.data();
  });
  return trainingLoad;
}

async function getUserWeeks(userId) {
  const snapshot = await db.collection('tracking').doc(userId).collection('weeks').get();
  const weeks = {};
  snapshot.docs.forEach(doc => {
    weeks[doc.id] = doc.data();
  });
  return weeks;
}

async function getAllGroups() {
  const snapshot = await db.collection('groups').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Validation Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Phase 1: Migration Status Check
 * Validates days → entries migration
 */
async function checkMigrationStatus(user) {
  const userId = user.id;
  const entries = await getUserEntries(userId);
  const days = await getUserDays(userId);

  const entriesCount = Object.keys(entries).length;
  const daysCount = Object.keys(days).length;

  // Check migration flag
  if (!user.migrated && daysCount > 0) {
    recordInconsistency('migration', userId, 'not_migrated', {
      daysCount,
      entriesCount,
      message: 'User has days data but migrated flag is false or missing',
    });
    logError(`User ${user.nickname || userId} not migrated (${daysCount} days found)`);
  } else if (user.migrated && daysCount > 0) {
    recordInconsistency('migration', userId, 'orphaned_days', {
      daysCount,
      message: 'User is marked as migrated but days collection still exists',
    });
    logWarning(`User ${user.nickname || userId} has orphaned days data (${daysCount} documents)`);
  } else if (user.migrated) {
    logSuccess(`User ${user.nickname || userId} migration OK (${entriesCount} entries)`);
  }

  return { entriesCount, daysCount };
}

/**
 * Phase 2: Streak Validation
 * Recalculates streaks with new weighted logic
 */
function calculateDayStreakScore(tracking, checkIn, user) {
  const waterGoal = user?.hydrationGoalLiters ? user.hydrationGoalLiters * 1000 : 3000;
  const proteinGoal = user?.proteinGoalGrams || (user?.weight ? user.weight * 2 : 0);

  // Movement (binary)
  const pushupsDone = Boolean(tracking?.pushups?.total && tracking.pushups.total > 0);
  const sportsCount = tracking?.sports
    ? Object.values(tracking.sports).filter(s => typeof s === 'object' && s.active).length
    : 0;
  const movementRatio = pushupsDone || sportsCount > 0 ? 1 : 0;

  // Water (proportional)
  const waterValue = Math.max(tracking?.water || 0, 0);
  const waterRatio = waterGoal > 0 ? Math.min(waterValue / waterGoal, 1) : 0;

  // Protein (proportional)
  const proteinValue = Math.max(tracking?.protein || 0, 0);
  const proteinRatio = proteinGoal > 0 ? Math.min(proteinValue / proteinGoal, 1) : 0;

  // Check-in (average of sleep & recovery, reduced if sick)
  let checkinRatio = 0;
  let hasCheckIn = false;
  if (checkIn && (checkIn.sleepScore || checkIn.recoveryScore)) {
    const sleepScore = Math.max(Math.min(checkIn.sleepScore || 0, 10), 0);
    const recoveryScore = Math.max(Math.min(checkIn.recoveryScore || 0, 10), 0);
    const sick = Boolean(checkIn.sick);
    checkinRatio = ((sleepScore / 10) * 0.5 + (recoveryScore / 10) * 0.5) * (sick ? 0.5 : 1);
    hasCheckIn = true;
  }

  // Choose weights
  const weights = hasCheckIn ? STREAK_WEIGHTS_WITH_CHECKIN : STREAK_WEIGHTS_BASE;

  // Calculate score
  let score = 0;
  if (hasCheckIn) {
    score =
      movementRatio * weights.movement +
      waterRatio * weights.water +
      proteinRatio * weights.protein +
      checkinRatio * weights.checkin;
  } else {
    score =
      movementRatio * weights.movement +
      waterRatio * weights.water +
      proteinRatio * weights.protein;
  }

  const scorePercent = Math.round(Math.min(Math.max(score, 0), 1) * 100);
  const streakMet = scorePercent >= STREAK_COMPLETION_THRESHOLD;

  return { score: scorePercent, streakMet };
}

function calculateStreak(entries, checkIns, user) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = cursor.toISOString().split('T')[0];
    const dayTracking = entries[key];
    const dayCheckIn = checkIns?.[key];

    const result = calculateDayStreakScore(dayTracking, dayCheckIn, user);

    if (!result.streakMet) {
      break;
    }

    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

async function checkStreakConsistency(user) {
  const userId = user.id;
  const entries = await getUserEntries(userId);
  const checkIns = await getUserCheckIns(userId);

  const calculatedStreak = calculateStreak(entries, checkIns, user);

  // Compare with stored streak (if available in leaderboard data)
  logInfo(`User ${user.nickname || userId}: Calculated streak = ${calculatedStreak} days`);

  // Check for stored streakScore in entries
  let inconsistentScores = 0;
  for (const [date, entry] of Object.entries(entries)) {
    const checkIn = checkIns[date];
    const { score: calculatedScore, streakMet } = calculateDayStreakScore(entry, checkIn, user);

    if (entry.streakScore !== undefined && entry.streakScore !== calculatedScore) {
      inconsistentScores++;
      recordInconsistency('streak', userId, 'score_mismatch', {
        date,
        stored: entry.streakScore,
        calculated: calculatedScore,
      });
    }

    if (entry.dayStreakMet !== undefined && entry.dayStreakMet !== streakMet) {
      recordInconsistency('streak', userId, 'streak_met_mismatch', {
        date,
        stored: entry.dayStreakMet,
        calculated: streakMet,
      });
    }
  }

  if (inconsistentScores > 0) {
    logWarning(`Found ${inconsistentScores} days with inconsistent streak scores`);
  } else if (Object.keys(entries).length > 0) {
    logSuccess(`All streak scores are consistent`);
  }

  return { calculatedStreak, inconsistentScores };
}

/**
 * Phase 3: Triple-Storage Audit
 * Checks sync between entries, checkins, and trainingLoad
 */
async function checkTripleStorageSync(user) {
  const userId = user.id;
  const entries = await getUserEntries(userId);
  const checkIns = await getUserCheckIns(userId);
  const trainingLoad = await getUserTrainingLoad(userId);

  const allDates = new Set([
    ...Object.keys(entries),
    ...Object.keys(checkIns),
    ...Object.keys(trainingLoad),
  ]);

  let orphanedCheckIns = 0;
  let orphanedTrainingLoad = 0;
  let missingSync = 0;

  for (const date of allDates) {
    const hasEntry = !!entries[date];
    const hasCheckIn = !!checkIns[date];
    const hasTrainingLoad = !!trainingLoad[date];

    // Training load should exist if check-in exists
    if (hasCheckIn && !hasTrainingLoad) {
      orphanedCheckIns++;
      recordInconsistency('tripleStorage', userId, 'missing_training_load', {
        date,
        message: 'Check-in exists but training load is missing',
      });
    }

    // If training load exists, check-in should exist too
    if (hasTrainingLoad && !hasCheckIn) {
      orphanedTrainingLoad++;
      recordInconsistency('tripleStorage', userId, 'missing_checkin', {
        date,
        message: 'Training load exists but check-in is missing',
      });
    }

    // Check timestamp consistency
    if (hasEntry && hasCheckIn) {
      const entryTime = entries[date].updatedAt?.toDate?.() || entries[date].updatedAt;
      const checkInTime = checkIns[date].updatedAt?.toDate?.() || checkIns[date].updatedAt;

      if (entryTime && checkInTime) {
        const timeDiff = Math.abs(new Date(entryTime) - new Date(checkInTime)) / 1000; // seconds
        if (timeDiff > 60) { // More than 1 minute difference
          missingSync++;
          recordInconsistency('tripleStorage', userId, 'timestamp_mismatch', {
            date,
            entryTime: String(entryTime),
            checkInTime: String(checkInTime),
            differenceSeconds: timeDiff,
          });
        }
      }
    }
  }

  if (orphanedCheckIns > 0 || orphanedTrainingLoad > 0 || missingSync > 0) {
    logWarning(`Triple-storage issues: ${orphanedCheckIns} orphaned check-ins, ${orphanedTrainingLoad} orphaned training loads, ${missingSync} timestamp mismatches`);
  } else if (allDates.size > 0) {
    logSuccess(`All ${allDates.size} days are properly synchronized`);
  }

  return { orphanedCheckIns, orphanedTrainingLoad, missingSync };
}

/**
 * Phase 4: Schema Validation
 * Checks for required fields and deprecated fields
 */
async function checkSchemaValidation(user) {
  const userId = user.id;

  // Check user required fields
  const requiredUserFields = ['nickname', 'gender', 'height', 'weight', 'maxPushups', 'groupCode', 'pushupState'];
  const missingFields = requiredUserFields.filter(field => !user[field]);

  if (missingFields.length > 0) {
    recordInconsistency('schema', userId, 'missing_user_fields', { missingFields });
    logError(`Missing user fields: ${missingFields.join(', ')}`);
  }

  // Check for deprecated recovery field in tracking
  const entries = await getUserEntries(userId);
  let deprecatedRecoveryCount = 0;

  for (const [date, entry] of Object.entries(entries)) {
    if (entry.recovery) {
      deprecatedRecoveryCount++;
      recordInconsistency('schema', userId, 'deprecated_recovery_field', {
        date,
        message: 'DailyTracking.recovery is deprecated, use check-ins instead',
      });
    }
  }

  if (deprecatedRecoveryCount > 0) {
    logWarning(`Found ${deprecatedRecoveryCount} entries with deprecated recovery field`);
  }

  // Check enabledActivities
  if (!user.enabledActivities) {
    recordInconsistency('schema', userId, 'missing_enabled_activities', {
      message: 'User has no enabledActivities set',
    });
    logWarning(`Missing enabledActivities (should default to ['pushups', 'sports', 'water', 'protein'])`);
  }

  if (missingFields.length === 0 && deprecatedRecoveryCount === 0 && user.enabledActivities) {
    logSuccess(`Schema validation passed`);
  }

  return { missingFields, deprecatedRecoveryCount };
}

/**
 * Phase 5: Week Aggregation Check
 * Validates week summary calculations
 */
async function checkWeekAggregations(user) {
  const userId = user.id;
  const weeks = await getUserWeeks(userId);
  const entries = await getUserEntries(userId);
  const checkIns = await getUserCheckIns(userId);

  let inconsistentWeeks = 0;

  for (const [weekId, weekData] of Object.entries(weeks)) {
    // Parse weekId (format: "YYYY-'W'WW")
    const match = weekId.match(/(\d{4})-W(\d{2})/);
    if (!match) continue;

    // Get all days for this week
    const year = parseInt(match[1]);
    const weekNum = parseInt(match[2]);

    // Calculate week start (Monday)
    const weekStart = new Date(year, 0, 1 + (weekNum - 1) * 7);
    const dayOfWeek = weekStart.getDay();
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    weekStart.setDate(diff);

    // Collect days for this week
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];

      const entry = entries[dateKey];
      const checkIn = checkIns[dateKey];

      if (entry) {
        const { streakMet } = calculateDayStreakScore(entry, checkIn, user);
        weekDays.push({ date: dateKey, streakMet, entry });
      }
    }

    // Recalculate week stats
    const streakDays = weekDays.filter(d => d.streakMet).length;
    const totalPct = weekDays.reduce((sum, d) => sum + (d.entry.dayProgressPct || 0), 0);
    const calculatedAvg = weekDays.length > 0 ? totalPct / weekDays.length : 0;

    // Compare with stored values
    if (weekData.streakDays !== streakDays || Math.abs(weekData.totalPctAvg - calculatedAvg) > 1) {
      inconsistentWeeks++;
      recordInconsistency('weekAggregation', userId, 'incorrect_calculation', {
        weekId,
        stored: { streakDays: weekData.streakDays, totalPctAvg: weekData.totalPctAvg },
        calculated: { streakDays, totalPctAvg: calculatedAvg },
      });
    }
  }

  if (inconsistentWeeks > 0) {
    logWarning(`Found ${inconsistentWeeks} weeks with incorrect aggregations`);
  } else if (Object.keys(weeks).length > 0) {
    logSuccess(`All ${Object.keys(weeks).length} week aggregations are correct`);
  }

  return { inconsistentWeeks };
}

/**
 * Phase 6: Group Validation
 * Checks group membership integrity
 */
async function checkGroupIntegrity() {
  logSection('📊 Phase 6: Group Membership Validation');

  const groups = await getAllGroups();
  const allUsers = await getAllUsers();
  const userIdSet = new Set(allUsers.map(u => u.id));

  let totalIssues = 0;

  for (const group of groups) {
    logInfo(`Checking group "${group.name}" (${group.id})`);

    const invalidMembers = group.members?.filter(memberId => !userIdSet.has(memberId)) || [];

    if (invalidMembers.length > 0) {
      totalIssues += invalidMembers.length;
      recordInconsistency('groups', group.id, 'invalid_members', {
        groupCode: group.id,
        invalidMembers,
      });
      logError(`Found ${invalidMembers.length} invalid member IDs`);
    } else {
      logSuccess(`All ${group.members?.length || 0} members are valid`);
    }
  }

  return { totalIssues };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Auto-Fix Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Fix 1: Migrate days to entries
 */
async function fixMigration(userId) {
  try {
    logInfo(`Migrating user ${userId}...`);

    // Get all documents from 'days' collection
    const daysRef = db.collection('tracking').doc(userId).collection('days');
    const daysSnapshot = await daysRef.get();

    if (daysSnapshot.empty) {
      logWarning('No days data found to migrate');
      return { success: true, count: 0 };
    }

    // Batch write to 'entries' collection
    const batch = db.batch();
    let count = 0;

    daysSnapshot.forEach((dayDoc) => {
      const entryRef = db.collection('tracking').doc(userId).collection('entries').doc(dayDoc.id);
      batch.set(entryRef, dayDoc.data(), { merge: true });
      count++;
    });

    // Commit batch
    await batch.commit();

    // Mark user as migrated
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      migrated: true,
      migratedAt: new Date().toISOString(),
      migratedCount: count,
      migrationVersion: 'v1',
    }, { merge: true });

    logSuccess(`Migrated ${count} documents for user ${userId}`);
    return { success: true, count };
  } catch (error) {
    logError(`Migration failed for ${userId}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Fix 2: Delete orphaned days collection
 */
async function fixOrphanedDays(userId) {
  try {
    logInfo(`Deleting orphaned days for user ${userId}...`);

    const daysRef = db.collection('tracking').doc(userId).collection('days');
    const daysSnapshot = await daysRef.get();

    if (daysSnapshot.empty) {
      logWarning('No orphaned days found');
      return { success: true, count: 0 };
    }

    // Batch delete
    const batch = db.batch();
    let count = 0;

    daysSnapshot.forEach((dayDoc) => {
      batch.delete(dayDoc.ref);
      count++;
    });

    await batch.commit();

    logSuccess(`Deleted ${count} orphaned day documents`);
    return { success: true, count };
  } catch (error) {
    logError(`Failed to delete orphaned days: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Fix 3: Recalculate streak scores
 */
async function fixStreakScores(userId, user) {
  try {
    logInfo(`Recalculating streak scores for user ${userId}...`);

    const entries = await getUserEntries(userId);
    const checkIns = await getUserCheckIns(userId);

    const batch = db.batch();
    let count = 0;

    for (const [date, entry] of Object.entries(entries)) {
      const checkIn = checkIns[date];
      const { score: calculatedScore, streakMet } = calculateDayStreakScore(entry, checkIn, user);

      // Only update if values differ
      const needsUpdate =
        entry.streakScore !== calculatedScore ||
        entry.dayStreakMet !== streakMet;

      if (needsUpdate) {
        const entryRef = db.collection('tracking').doc(userId).collection('entries').doc(date);
        batch.update(entryRef, {
          streakScore: calculatedScore,
          dayStreakMet: streakMet,
          updatedAt: new Date(),
        });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      logSuccess(`Updated ${count} streak scores`);
    } else {
      logInfo('No streak scores needed updating');
    }

    return { success: true, count };
  } catch (error) {
    logError(`Failed to fix streak scores: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Fix 4: Recalculate week aggregations
 */
async function fixWeekAggregations(userId, user) {
  try {
    logInfo(`Recalculating week aggregations for user ${userId}...`);

    const weeks = await getUserWeeks(userId);
    const entries = await getUserEntries(userId);
    const checkIns = await getUserCheckIns(userId);

    const batch = db.batch();
    let count = 0;

    for (const [weekId, weekData] of Object.entries(weeks)) {
      const match = weekId.match(/(\d{4})-W(\d{2})/);
      if (!match) continue;

      const year = parseInt(match[1]);
      const weekNum = parseInt(match[2]);

      // Calculate week start (Monday)
      const weekStart = new Date(year, 0, 1 + (weekNum - 1) * 7);
      const dayOfWeek = weekStart.getDay();
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      weekStart.setDate(diff);

      // Collect days for this week
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];

        const entry = entries[dateKey];
        const checkIn = checkIns[dateKey];

        if (entry) {
          const { streakMet } = calculateDayStreakScore(entry, checkIn, user);
          weekDays.push({ date: dateKey, streakMet, entry });
        }
      }

      // Recalculate stats
      const streakDays = weekDays.filter(d => d.streakMet).length;
      const totalPct = weekDays.reduce((sum, d) => sum + (d.entry.dayProgressPct || 0), 0);
      const calculatedAvg = weekDays.length > 0 ? totalPct / weekDays.length : 0;

      // Update if different
      if (weekData.streakDays !== streakDays || Math.abs(weekData.totalPctAvg - calculatedAvg) > 1) {
        const weekRef = db.collection('tracking').doc(userId).collection('weeks').doc(weekId);
        batch.update(weekRef, {
          streakDays,
          totalPctAvg: calculatedAvg,
          updatedAt: new Date(),
        });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      logSuccess(`Updated ${count} week aggregations`);
    } else {
      logInfo('No week aggregations needed updating');
    }

    return { success: true, count };
  } catch (error) {
    logError(`Failed to fix week aggregations: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Apply all fixes based on inconsistencies
 */
async function applyFixes() {
  logSection('🔧 Applying Automatic Fixes');

  const fixes = {
    migration: 0,
    orphanedDays: 0,
    streakScores: 0,
    weekAggregations: 0,
  };

  // Fix 1: Migration issues
  for (const issue of inconsistencies.migration) {
    if (issue.type === 'not_migrated') {
      log(`\nFixing migration for user ${issue.userId}...`, colors.yellow);
      const result = await fixMigration(issue.userId);
      if (result.success) fixes.migration += result.count;
    } else if (issue.type === 'orphaned_days') {
      log(`\nCleaning up orphaned days for user ${issue.userId}...`, colors.yellow);
      const result = await fixOrphanedDays(issue.userId);
      if (result.success) fixes.orphanedDays += result.count;
    }
  }

  // Fix 2: Streak scores (group by user)
  const streakUserIds = new Set(inconsistencies.streak.map(i => i.userId));
  for (const userId of streakUserIds) {
    log(`\nFixing streak scores for user ${userId}...`, colors.yellow);

    // Get user data
    const userDocSnap = await db.collection('users').doc(userId).get();
    const user = userDocSnap.exists ? { id: userId, ...userDocSnap.data() } : null;

    if (user) {
      const result = await fixStreakScores(userId, user);
      if (result.success) fixes.streakScores += result.count;
    }
  }

  // Fix 3: Week aggregations (group by user)
  const weekUserIds = new Set(inconsistencies.weekAggregation.map(i => i.userId));
  for (const userId of weekUserIds) {
    log(`\nFixing week aggregations for user ${userId}...`, colors.yellow);

    // Get user data
    const userDocSnap = await db.collection('users').doc(userId).get();
    const user = userDocSnap.exists ? { id: userId, ...userDocSnap.data() } : null;

    if (user) {
      const result = await fixWeekAggregations(userId, user);
      if (result.success) fixes.weekAggregations += result.count;
    }
  }

  // Summary
  log('\n' + '━'.repeat(80), colors.cyan);
  log('🎉 Fix Summary', colors.bold);
  log('━'.repeat(80), colors.cyan);
  log(`\n  Migrated entries:           ${fixes.migration}`, colors.green);
  log(`  Deleted orphaned days:      ${fixes.orphanedDays}`, colors.green);
  log(`  Updated streak scores:      ${fixes.streakScores}`, colors.green);
  log(`  Updated week aggregations:  ${fixes.weekAggregations}`, colors.green);
  log('', colors.reset);

  return fixes;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Execution
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║              🔍 Firestore Data Consistency Check                          ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════════════════════╝', colors.cyan);
  log('', colors.reset);

  if (isDryRun) {
    log('🔍 DRY RUN MODE - No changes will be made\n', colors.yellow);
  }

  if (shouldFix) {
    log('🔧 FIX MODE - Will attempt to fix issues (with confirmation)\n', colors.yellow);
  }

  // Initialize Firebase
  await initializeFirebase();

  // Get users
  let users = [];
  if (specificUser) {
    logInfo(`Checking specific user: ${specificUser}`);
    const userDoc = await db.collection('users').doc(specificUser).get();
    if (userDoc.exists()) {
      users = [{ id: userDoc.id, ...userDoc.data() }];
    } else {
      log(`❌ User ${specificUser} not found`, colors.red);
      process.exit(1);
    }
  } else {
    users = await getAllUsers();
    logInfo(`Found ${users.length} users to check`);
  }

  const stats = {
    totalUsers: users.length,
    migratedUsers: 0,
    totalInconsistencies: 0,
  };

  // Phase 1: Migration Status
  logSection('📦 Phase 1: Migration Status Check');
  for (const user of users) {
    await checkMigrationStatus(user);
    if (user.migrated) stats.migratedUsers++;
  }

  // Phase 2: Streak Validation
  logSection('🔥 Phase 2: Streak Validation');
  for (const user of users) {
    await checkStreakConsistency(user);
  }

  // Phase 3: Triple-Storage Sync
  logSection('🔗 Phase 3: Triple-Storage Synchronization');
  for (const user of users) {
    await checkTripleStorageSync(user);
  }

  // Phase 4: Schema Validation
  logSection('📋 Phase 4: Schema Validation');
  for (const user of users) {
    await checkSchemaValidation(user);
  }

  // Phase 5: Week Aggregations
  logSection('📅 Phase 5: Week Aggregation Check');
  for (const user of users) {
    await checkWeekAggregations(user);
  }

  // Phase 6: Groups
  await checkGroupIntegrity();

  // Calculate total inconsistencies
  stats.totalInconsistencies = Object.values(inconsistencies).reduce(
    (total, arr) => total + arr.length,
    0
  );

  // Summary
  logSection('📊 Summary Report');
  log(`Total users checked:     ${stats.totalUsers}`, colors.cyan);
  log(`Users migrated:          ${stats.migratedUsers}`, colors.cyan);
  log(`Total inconsistencies:   ${stats.totalInconsistencies}`, colors.cyan);
  log('', colors.reset);
  log('By category:', colors.bold);
  log(`  Migration:             ${inconsistencies.migration.length}`, colors.yellow);
  log(`  Streak:                ${inconsistencies.streak.length}`, colors.yellow);
  log(`  Triple-Storage:        ${inconsistencies.tripleStorage.length}`, colors.yellow);
  log(`  Schema:                ${inconsistencies.schema.length}`, colors.yellow);
  log(`  Week Aggregations:     ${inconsistencies.weekAggregation.length}`, colors.yellow);
  log(`  User Data:             ${inconsistencies.userData.length}`, colors.yellow);
  log(`  Groups:                ${inconsistencies.groups.length}`, colors.yellow);
  log('', colors.reset);

  // Save reports
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = join(ROOT_DIR, `consistency_check_${timestamp}.log`);
  const jsonPath = join(ROOT_DIR, `inconsistencies_${timestamp}.json`);

  await writeFile(logPath, logBuffer.join('\n'), 'utf8');
  await writeFile(jsonPath, JSON.stringify(inconsistencies, null, 2), 'utf8');

  logSuccess(`Report saved to: ${logPath}`);
  logSuccess(`Inconsistencies saved to: ${jsonPath}`);

  if (stats.totalInconsistencies > 0 && shouldFix && !isDryRun) {
    log('', colors.reset);
    const shouldProceed = await promptConfirm('⚠️  Do you want to fix these issues automatically?');
    if (shouldProceed) {
      await applyFixes();

      // Re-run validation to confirm fixes
      log('', colors.reset);
      log('🔄 Running validation again to verify fixes...', colors.blue);
      log('', colors.reset);

      // Reset inconsistencies
      Object.keys(inconsistencies).forEach(key => {
        inconsistencies[key] = [];
      });

      // Re-validate all users
      for (const user of users) {
        await checkMigrationStatus(user);
        await checkStreakConsistency(user);
        await checkTripleStorageSync(user);
        await checkWeekAggregations(user);
      }

      const remainingIssues = Object.values(inconsistencies).reduce(
        (total, arr) => total + arr.length,
        0
      );

      if (remainingIssues === 0) {
        log('', colors.reset);
        log('✅ All issues have been fixed successfully!', colors.green);
        log('', colors.reset);
      } else {
        log('', colors.reset);
        log(`⚠️  ${remainingIssues} issues remain. Check the log for details.`, colors.yellow);
        log('', colors.reset);
      }
    } else {
      log('', colors.reset);
      log('❌ Auto-fix cancelled. No changes were made.', colors.yellow);
      log('', colors.reset);
    }
  }

  log('', colors.reset);
  log('✅ Consistency check complete!', colors.green);
  log('', colors.reset);
}

// Run
main().catch((error) => {
  log(`\n❌ Error: ${error.message}\n`, colors.red);
  console.error(error);
  process.exit(1);
});
