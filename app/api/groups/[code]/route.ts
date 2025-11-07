import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { groups, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/groups/[code] - Get group by code
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const code = params.code;
    
    const group = await db.select().from(groups).where(eq(groups.code, code)).limit(1);
    
    if (group.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get member details
    const members = group[0].members as string[] || [];
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

// POST /api/groups/[code] - Create new group
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const code = params.code;
    const body = await request.json();

    // Check if group already exists
    const existingGroup = await db.select().from(groups).where(eq(groups.code, code)).limit(1);
    
    if (existingGroup.length > 0) {
      return NextResponse.json({ error: 'Group code already exists' }, { status: 409 });
    }

    // Create new group
    const newGroup = await db.insert(groups)
      .values({
        code,
        name: body.name || code,
        members: [session.user.id],
      })
      .returning();

    // Update user's groupCode
    await db.update(users)
      .set({ groupCode: code, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json(newGroup[0]);
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const code = params.code;
    const body = await request.json();

    const group = await db.select().from(groups).where(eq(groups.code, code)).limit(1);
    
    if (group.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.addMember) {
      const currentMembers = (group[0].members as string[]) || [];
      if (!currentMembers.includes(body.addMember)) {
        updateData.members = [...currentMembers, body.addMember];
        
        // Update user's groupCode
        await db.update(users)
          .set({ groupCode: code, updatedAt: new Date() })
          .where(eq(users.id, body.addMember));
      }
    }

    if (body.removeMember) {
      const currentMembers = (group[0].members as string[]) || [];
      updateData.members = currentMembers.filter(m => m !== body.removeMember);
      
      // Remove user's groupCode
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const code = params.code;

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
