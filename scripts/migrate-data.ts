import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { users, groups, trackingEntries } from '../lib/db/schema';

// Firebase configuration (will be replaced after migration)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

interface FirebaseUser {
  id: string;
  nickname: string;
  gender?: string;
  height?: number;
  weight?: number;
  maxPushups?: number;
  groupCode?: string;
  pushupState?: any;
}

interface FirebaseGroup {
  id: string;
  name: string;
  members: string[];
  createdAt: any;
}

interface FirebaseTrackingEntry {
  userId: string;
  date: string;
  pushups?: number;
  sports?: number;
  water?: number;
  protein?: number;
  weight?: number;
  completed?: boolean;
}

async function migrateUsers() {
  console.log('🔄 Migrating users from Firebase to Postgres...');

  try {
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    const firebaseUsers: FirebaseUser[] = [];

    usersSnapshot.forEach((doc) => {
      firebaseUsers.push({
        id: doc.id,
        ...doc.data() as Omit<FirebaseUser, 'id'>
      });
    });

    console.log(`Found ${firebaseUsers.length} users to migrate`);

    for (const firebaseUser of firebaseUsers) {
      await db.insert(users).values({
        firebaseUid: firebaseUser.id,
        email: `${firebaseUser.id}@migration.temp`, // Temp email, will be updated with actual auth
        nickname: firebaseUser.nickname,
        gender: firebaseUser.gender,
        height: firebaseUser.height,
        weight: firebaseUser.weight,
        maxPushups: firebaseUser.maxPushups || 0,
        groupCode: firebaseUser.groupCode,
        pushupState: firebaseUser.pushupState,
      }).onConflictDoNothing();
    }

    console.log('✅ Users migration completed');
  } catch (error) {
    console.error('❌ Users migration failed:', error);
    throw error;
  }
}

async function migrateGroups() {
  console.log('🔄 Migrating groups from Firebase to Postgres...');

  try {
    const groupsSnapshot = await getDocs(collection(firestore, 'groups'));
    const firebaseGroups: FirebaseGroup[] = [];

    groupsSnapshot.forEach((doc) => {
      firebaseGroups.push({
        id: doc.id,
        ...doc.data() as Omit<FirebaseGroup, 'id'>
      });
    });

    console.log(`Found ${firebaseGroups.length} groups to migrate`);

    for (const firebaseGroup of firebaseGroups) {
      await db.insert(groups).values({
        code: firebaseGroup.id,
        name: firebaseGroup.name,
        members: firebaseGroup.members,
        createdAt: firebaseGroup.createdAt?.toDate?.() || new Date(),
      }).onConflictDoNothing();
    }

    console.log('✅ Groups migration completed');
  } catch (error) {
    console.error('❌ Groups migration failed:', error);
    throw error;
  }
}

async function migrateTrackingEntries() {
  console.log('🔄 Migrating tracking entries from Firebase to Postgres...');

  try {
    // Get all users to iterate through their tracking data
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    let totalEntries = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Get all entries for this user
      const entriesSnapshot = await getDocs(
        collection(firestore, 'tracking', userId, 'entries')
      );

      console.log(`Migrating ${entriesSnapshot.size} entries for user ${userId}`);

      for (const entryDoc of entriesSnapshot.docs) {
        const entryData = entryDoc.data();

        // Find the corresponding Postgres user ID
        const postgresUserResult = await db.select().from(users).where(eq(users.firebaseUid, userId)).limit(1);

        if (postgresUserResult.length === 0) {
          console.warn(`⚠️ No Postgres user found for Firebase UID ${userId}`);
          continue;
        }

        const postgresUser = postgresUserResult[0];
        if (!postgresUser) {
          console.warn(`⚠️ No Postgres user found for Firebase UID ${userId}`);
          continue;
        }

        await db.insert(trackingEntries).values({
          userId: postgresUser.id,
          date: entryDoc.id, // Date is used as document ID in Firebase
          pushups: entryData.pushups || 0,
          sports: entryData.sports || 0,
          water: entryData.water || 0,
          protein: entryData.protein || 0,
          weight: entryData.weight,
          completed: entryData.completed || false,
        }).onConflictDoNothing();

        totalEntries++;
      }
    }

    console.log(`✅ Tracking entries migration completed (${totalEntries} entries)`);
  } catch (error) {
    console.error('❌ Tracking entries migration failed:', error);
    throw error;
  }
}

export async function runFullMigration() {
  console.log('🚀 Starting full Firebase to Postgres migration...');

  try {
    await migrateUsers();
    await migrateGroups();
    await migrateTrackingEntries();

    console.log('🎉 Full migration completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('💥 Migration failed:', error);
    return { success: false, error };
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullMigration();
}
