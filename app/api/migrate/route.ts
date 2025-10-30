import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, groups, trackingEntries } from '@/lib/db/schema';

// This would be replaced with actual Firebase data in production
// For now, creating sample migration data
const sampleFirebaseData = {
  users: {
    'firebase-uid-1': {
      email: 'test@example.com',
      nickname: 'TestUser',
      gender: 'male',
      height: 180,
      weight: 75.5,
      maxPushups: 50,
      groupCode: 'WINTER2024',
      pushupState: { currentStreak: 5, lastPushupDate: '2024-10-30' }
    }
  },
  groups: {
    'WINTER2024': {
      name: 'Winter Arc 2024',
      members: ['firebase-uid-1'],
      createdAt: new Date('2024-10-01')
    }
  },
  tracking: {
    'firebase-uid-1': {
      entries: {
        '2024-10-30': {
          pushups: 25,
          sports: 60,
          water: 2000,
          protein: 120.5,
          weight: 75.5,
          completed: true
        },
        '2024-10-29': {
          pushups: 30,
          sports: 45,
          water: 1800,
          protein: 110.0,
          weight: 75.8,
          completed: true
        }
      }
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting Firebase to Neon PostgreSQL Migration...');

    const results = {
      users: 0,
      groups: 0,
      trackingEntries: 0,
      errors: [] as string[]
    };

    // 1. Migrate Users
    console.log('👥 Migrating users...');
    for (const [firebaseUid, userData] of Object.entries(sampleFirebaseData.users)) {
      try {
        await db.insert(users).values({
          firebaseUid,
          email: userData.email,
          nickname: userData.nickname,
          gender: userData.gender,
          height: userData.height,
          weight: userData.weight,
          maxPushups: userData.maxPushups,
          groupCode: userData.groupCode,
          pushupState: userData.pushupState
        });
        results.users++;
        console.log(`✅ User migrated: ${userData.email}`);
      } catch (error) {
        const errorMsg = `Failed to migrate user ${userData.email}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // 2. Migrate Groups
    console.log('👥 Migrating groups...');
    for (const [code, groupData] of Object.entries(sampleFirebaseData.groups)) {
      try {
        await db.insert(groups).values({
          code,
          name: groupData.name,
          members: groupData.members,
          createdAt: groupData.createdAt
        });
        results.groups++;
        console.log(`✅ Group migrated: ${groupData.name}`);
      } catch (error) {
        const errorMsg = `Failed to migrate group ${groupData.name}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // 3. Get user IDs for tracking entries
    const migratedUsers = await db.select().from(users);
    const userMap = new Map(migratedUsers.map(user => [user.firebaseUid!, user.id]));

    // 4. Migrate Tracking Entries
    console.log('📊 Migrating tracking entries...');
    for (const [firebaseUid, trackingData] of Object.entries(sampleFirebaseData.tracking)) {
      const userId = userMap.get(firebaseUid);
      if (!userId) {
        results.errors.push(`User not found for tracking data: ${firebaseUid}`);
        continue;
      }

      for (const [date, entryData] of Object.entries(trackingData.entries)) {
        try {
          await db.insert(trackingEntries).values({
            userId,
            date,
            pushups: entryData.pushups,
            sports: entryData.sports,
            water: entryData.water,
            protein: entryData.protein,
            weight: entryData.weight,
            completed: entryData.completed
          });
          results.trackingEntries++;
          console.log(`✅ Tracking entry migrated: ${date} for user ${firebaseUid}`);
        } catch (error) {
          const errorMsg = `Failed to migrate tracking entry ${date}: ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
    }

    console.log('🎉 Migration completed!');
    console.log(`📊 Results: ${results.users} users, ${results.groups} groups, ${results.trackingEntries} tracking entries`);

    if (results.errors.length > 0) {
      console.log(`⚠️ ${results.errors.length} errors occurred`);
    }

    return NextResponse.json({
      success: true,
      message: 'Firebase to PostgreSQL migration completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Firebase to PostgreSQL Migration Endpoint',
    description: 'POST to this endpoint to start the migration',
    note: 'This currently uses sample data. In production, this would connect to your Firebase instance.',
    timestamp: new Date().toISOString()
  });
}

