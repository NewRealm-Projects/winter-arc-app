import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stack';
import { getUserByStackId } from '@/app/services/userSyncService';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const localUser = await getUserByStackId(stackUser.id);

    // Users can only access their own data or public fields
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
    const database = db;
    const dbUser = await database.select().from(users).where(eq(users.id, userId)).limit(1);

    if (dbUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only return own full data or limited public data
    const first = dbUser[0];
    if (localUser?.id !== userId) {
      // Return public fields only
      return NextResponse.json({
        id: first!.id,
        nickname: first!.nickname,
        groupCode: first!.groupCode,
      });
    }

    return NextResponse.json(first!);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const localUser = await getUserByStackId(user.id);

    // Users can only update their own data
    if (localUser?.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Sanitize input - only allow specific fields to be updated
    const allowedFields = ['nickname', 'gender', 'height', 'weight', 'maxPushups', 'groupCode', 'pushupState'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
    const database = db;
    const updatedUser = await database.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user (soft delete or full delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const localUser = await getUserByStackId(user.id);

    // Users can only delete their own account
    if (localUser?.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
    const database = db;
    await database.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
