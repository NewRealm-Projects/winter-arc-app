import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/apiAuth';
import { db } from '@/lib/db';
import { trackingEntries } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODateString(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > maxDay) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(candidate.getTime())) {
    return false;
  }

  return candidate.toISOString().slice(0, 10) === value;
}

// POST /api/tracking/bulk - Upsert partial fields for multiple dates in one request
// Payload shape: { "2025-11-09": { water: 1200, protein: 80, completed: false }, ... }
// Only existing entries are patched; non-existing dates are created with provided fields + sane defaults.
export async function POST(request: NextRequest) {
  try {
    const { error, localUser } = await getAuthenticatedUser();
    if (error) return error;

    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const userId = localUser!.id;
    let payload: Record<string, any> = {};
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const dates = Object.keys(payload).filter((dateKey) => isValidISODateString(dateKey));
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
