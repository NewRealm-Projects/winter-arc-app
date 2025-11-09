import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { trackingEntries } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

// POST /api/tracking/bulk - Upsert partial fields for multiple dates in one request
// Payload shape: { "2025-11-09": { water: 1200, protein: 80, completed: false }, ... }
// Only existing entries are patched; non-existing dates are created with provided fields + sane defaults.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const userId = session.user.id;
    let payload: Record<string, any> = {};
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const dates = Object.keys(payload).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (dates.length === 0) {
      return NextResponse.json({ error: 'No valid date keys provided' }, { status: 400 });
    }

    const results: Record<string, any> = {};
    for (const date of dates) {
      const body = payload[date] || {};
      const existing = await db.select().from(trackingEntries)
        .where(and(eq(trackingEntries.userId, userId), eq(trackingEntries.date, date)))
        .limit(1);

      if (existing.length === 0) {
        // Create with defaults + provided patch fields
        const created = await db.insert(trackingEntries).values({
          userId,
          date,
          pushups: body.pushups ?? 0,
          sports: body.sports ?? 0,
          water: body.water ?? 0,
          protein: body.protein ?? 0,
          weight: body.weight ?? null,
          completed: body.completed ?? false,
        }).returning();
        results[date] = created[0];
        continue;
      }
      const updateData: any = { updatedAt: new Date() };
      const allowed = ['pushups', 'sports', 'water', 'protein', 'weight', 'completed'];
      for (const field of allowed) {
        if (body[field] !== undefined) updateData[field] = body[field];
      }
      if (Object.keys(updateData).length === 1) { // only updatedAt present
        results[date] = existing[0];
        continue;
      }
      const updated = await db.update(trackingEntries)
        .set(updateData)
        .where(and(eq(trackingEntries.userId, userId), eq(trackingEntries.date, date)))
        .returning();
      results[date] = updated[0];
    }

    return NextResponse.json({ success: true, entries: results });
  } catch (error) {
    console.error('Bulk tracking update failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
