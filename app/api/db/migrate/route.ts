import { NextRequest, NextResponse } from 'next/server';
import { runFullMigration } from '@/scripts/migrate-data';

export async function POST(request: NextRequest) {
  try {
    // Simple authentication check (replace with proper auth in production)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer migration-secret') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🚀 Starting migration via API...');
    const result = await runFullMigration();

    if (result.success) {
      return NextResponse.json({
        status: 'success',
        message: 'Migration completed successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          error: 'Migration failed',
          details: result.error?.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Migration API failed:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
