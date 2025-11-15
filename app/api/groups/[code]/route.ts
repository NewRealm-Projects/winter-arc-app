import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/apiAuth';
import { db } from '@/lib/db';
import { groups, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Simple in-memory rate limit (per user per action). For production use a durable store.
const createRateBucket: Record<string, number> = {};
const modifyRateBucket: Record<string, number> = {};

function rateLimit(bucket: Record<string, number>, userId: string, cooldownMs: number) {
  const now = Date.now();
  const last = bucket[userId] || 0;
  if (now - last < cooldownMs) return false;
  bucket[userId] = now;
  return true;
}

function validateGroupCode(code: string): boolean {
  return /^[A-Za-z0-9_-]{3,20}$/.test(code);
}

function sanitizeName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (trimmed.length > 50) return trimmed.slice(0, 50);
  return trimmed;
}

// GET /api/groups/[code] - Get group by code
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { error } = await getAuthenticatedUser();
    if (error) return error;

    const code = params.code;

    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
  const group = await db.select().from(groups).where(eq(groups.code, code)).limit(1);

    if (group.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get member details (safe access since group length > 0 checked)
    const memberDetails = await db.select({
      id: users.id,
      nickname: users.nickname,
      groupCode: users.groupCode,
    }).from(users).where(eq(users.groupCode, code));

    return NextResponse.json({
      ...group[0],
      memberDetails,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/groups/[code] - Create new group (create-only)
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { error, localUser } = await getAuthenticatedUser();
    if (error) return error;

    const code = params.code;
    if (!validateGroupCode(code)) {
      return NextResponse.json({ error: 'Invalid group code format' }, { status: 400 });
    }

    if (!rateLimit(createRateBucket, localUser!.id, 5000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const name = sanitizeName(body.name) || code;

    // Check if group already exists
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
    const existingGroup = await db.select().from(groups).where(eq(groups.code, code)).limit(1);

    if (existingGroup.length > 0) {
      return NextResponse.json({ error: 'Group code already exists' }, { status: 409 });
    }

    // Create new group inside a transaction-like flow
    const newGroup = await db.insert(groups)
      .values({
        code,
        name,
        members: [localUser!.id],
      })
      .returning();

    // Update user's groupCode
    await db.update(users)
      .set({ groupCode: code, updatedAt: new Date() })
      .where(eq(users.id, localUser!.id));

    return NextResponse.json(newGroup[0], { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/groups/[code] - Update group (add/remove members)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { error, localUser } = await getAuthenticatedUser();
    if (error) return error;

    const code = params.code;
    const body = await request.json();

    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
    const group = await db.select().from(groups).where(eq(groups.code, code)).limit(1);

    if (group.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Only members can modify the group
  // group length checked above; assert non-null for TypeScript
  const currentMembers: string[] = Array.isArray(group[0]!.members) ? (group[0]!.members as string[]) : [];
    if (!currentMembers.includes(localUser!.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!rateLimit(modifyRateBucket, localUser!.id, 3000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Validate member operations
    if (body.addMember && typeof body.addMember !== 'string') {
      return NextResponse.json({ error: 'Invalid addMember' }, { status: 400 });
    }
    if (body.removeMember && typeof body.removeMember !== 'string') {
      return NextResponse.json({ error: 'Invalid removeMember' }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };

    if (body.name !== undefined) {
      const sanitized = sanitizeName(body.name);
      if (!sanitized) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
      }
      updateData.name = sanitized;
    }

    if (body.addMember) {
      if (!currentMembers.includes(body.addMember)) {
        updateData.members = [...currentMembers, body.addMember];
        await db.update(users)
          .set({ groupCode: code, updatedAt: new Date() })
          .where(eq(users.id, body.addMember));
      }
    }

    if (body.removeMember) {
      updateData.members = currentMembers.filter(m => m !== body.removeMember);
      await db.update(users)
        .set({ groupCode: null, updatedAt: new Date() })
        .where(eq(users.id, body.removeMember));
    }

    const updated = await db.update(groups)
      .set(updateData)
      .where(eq(groups.code, code))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/groups/[code] - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { error, localUser } = await getAuthenticatedUser();
    if (error) return error;

    const code = params.code;

    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
    const group = await db.select().from(groups).where(eq(groups.code, code)).limit(1);
    if (group.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
  const currentMembers: string[] = Array.isArray(group[0]!.members) ? (group[0]!.members as string[]) : [];
    if (!currentMembers.includes(localUser!.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!rateLimit(modifyRateBucket, localUser!.id, 5000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Remove groupCode from all members
    await db.update(users)
      .set({ groupCode: null, updatedAt: new Date() })
      .where(eq(users.groupCode, code));

    // Delete group
    await db.delete(groups).where(eq(groups.code, code));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
