/**
 * Firestore Migration Service
 *
 * Migrates tracking data from old structure to new structure:
 * - OLD: tracking/{userId}/days/{date}
 * - NEW: tracking/{userId}/entries/{date}
 */

import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { addBreadcrumb, captureException } from './sentryService';

interface MigrationStatus {
  migrated: boolean;
  migratedAt?: string;
  migratedCount?: number;
  version?: string;
}

/**
 * Check if user has already been migrated
 */
export async function checkMigrationStatus(userId: string): Promise<MigrationStatus> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { migrated: false };
    }

    const userData = userSnap.data();
    return {
      migrated: userData.migrated === true,
      migratedAt: userData.migratedAt,
      migratedCount: userData.migratedCount,
      version: userData.migrationVersion,
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    captureException(error, { context: 'checkMigrationStatus', userId });
    return { migrated: false };
  }
}

/**
 * Migrate tracking data from 'days' to 'entries'
 */
export async function migrateDaysToEntries(userId: string): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    addBreadcrumb('Migration: Starting', { userId });

    // Check if already migrated
    const status = await checkMigrationStatus(userId);
    if (status.migrated) {
      addBreadcrumb('Migration: Already migrated', { userId, migratedAt: status.migratedAt });
      return { success: true, count: status.migratedCount || 0 };
    }

    // Get all documents from old 'days' collection
    const daysRef = collection(db, 'tracking', userId, 'days');
    const daysSnapshot = await getDocs(daysRef);

    if (daysSnapshot.empty) {
      addBreadcrumb('Migration: No data to migrate', { userId });

      // Mark as migrated even if empty
      await setDoc(
        doc(db, 'users', userId),
        {
          migrated: true,
          migratedAt: new Date().toISOString(),
          migratedCount: 0,
          migrationVersion: 'v1',
        },
        { merge: true }
      );

      return { success: true, count: 0 };
    }

    // Batch write to new 'entries' collection
    const batch = writeBatch(db);
    let count = 0;

    daysSnapshot.forEach((dayDoc) => {
      const entryRef = doc(db, 'tracking', userId, 'entries', dayDoc.id);
      batch.set(entryRef, dayDoc.data());
      count++;
    });

    // Commit batch
    await batch.commit();

    // Mark user as migrated
    await setDoc(
      doc(db, 'users', userId),
      {
        migrated: true,
        migratedAt: new Date().toISOString(),
        migratedCount: count,
        migrationVersion: 'v1',
      },
      { merge: true }
    );

    addBreadcrumb('Migration: Completed successfully', { userId, count });

    return { success: true, count };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    captureException(error, { context: 'migrateDaysToEntries', userId });
    addBreadcrumb('Migration: Failed', { userId, error: String(error) }, 'error');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Force re-migration (admin only - for testing)
 */
export async function forceMigration(userId: string): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    // Reset migration flag
    await setDoc(
      doc(db, 'users', userId),
      {
        migrated: false,
        migratedAt: null,
        migratedCount: null,
        migrationVersion: null,
      },
      { merge: true }
    );

    // Run migration
    return await migrateDaysToEntries(userId);
  } catch (error) {
    console.error('Force migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

