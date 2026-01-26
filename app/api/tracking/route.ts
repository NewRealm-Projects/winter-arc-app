import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stack';
import { db } from '@/lib/db';
import { trackingEntries } from '@/lib/db/schema';
import { eq, gte, lte, and } from 'drizzle-orm';

// GET /api/tracking - Get tracking entries for a date range
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = user.id;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate query parameters are required' },
        { status: 400 }
      );
    }

    const entries = await db.select()
      .from(trackingEntries)
      .where(and(
        eq(trackingEntries.userId, userId),
        gte(trackingEntries.date, startDate),
        lte(trackingEntries.date, endDate)
      ))
      .orderBy(trackingEntries.date);

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching tracking entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
