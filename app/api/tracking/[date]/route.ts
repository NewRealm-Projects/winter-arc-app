import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { trackingEntries } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/tracking/[date] - Get tracking entry for a specific date
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const date = params.date;
    const userId = session.user.id;

    const entry = await db.select()
      .from(trackingEntries)
      .where(and(
        eq(trackingEntries.userId, userId),
        eq(trackingEntries.date, date)
      ))
      .limit(1);

    if (entry.length === 0) {
      // Return default empty entry
      return NextResponse.json({
        userId,
        date,
        pushups: 0,
        sports: 0,
        water: 0,
        protein: 0,
        weight: null,
        completed: false,
      });
    }

    return NextResponse.json(entry[0]);
  } catch (error) {
    console.error('Error fetching tracking entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tracking/[date] - Create or update tracking entry
export async function POST(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const date = params.date;
    const userId = session.user.id;
    const body = await request.json();

    // Check if entry exists
    const existingEntry = await db.select()
      .from(trackingEntries)
      .where(and(
        eq(trackingEntries.userId, userId),
        eq(trackingEntries.date, date)
      ))
      .limit(1);

    if (existingEntry.length > 0) {
      // Update existing entry
      const updated = await db.update(trackingEntries)
        .set({
          pushups: body.pushups ?? existingEntry[0].pushups,
          sports: body.sports ?? existingEntry[0].sports,
          water: body.water ?? existingEntry[0].water,
          protein: body.protein ?? existingEntry[0].protein,
          weight: body.weight ?? existingEntry[0].weight,
          completed: body.completed ?? existingEntry[0].completed,
          updatedAt: new Date(),
        })
        .where(and(
          eq(trackingEntries.userId, userId),
          eq(trackingEntries.date, date)
        ))
        .returning();

      return NextResponse.json(updated[0]);
    } else {
      // Create new entry
      const newEntry = await db.insert(trackingEntries)
        .values({
          userId,
          date,
          pushups: body.pushups ?? 0,
          sports: body.sports ?? 0,
          water: body.water ?? 0,
          protein: body.protein ?? 0,
          weight: body.weight ?? null,
          completed: body.completed ?? false,
        })
        .returning();

      return NextResponse.json(newEntry[0]);
    }
  } catch (error) {
    console.error('Error saving tracking entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/tracking/[date] - Partial update of tracking entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const date = params.date;
    const userId = session.user.id;
    const body = await request.json();

    // Check if entry exists
    const existingEntry = await db.select()
      .from(trackingEntries)
      .where(and(
        eq(trackingEntries.userId, userId),
        eq(trackingEntries.date, date)
      ))
      .limit(1);

    if (existingEntry.length === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Update only provided fields
    const updateData: any = { updatedAt: new Date() };
    const allowedFields = ['pushups', 'sports', 'water', 'protein', 'weight', 'completed'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await db.update(trackingEntries)
      .set(updateData)
      .where(and(
        eq(trackingEntries.userId, userId),
        eq(trackingEntries.date, date)
      ))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating tracking entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
