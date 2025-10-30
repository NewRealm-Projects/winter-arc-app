import { NextRequest, NextResponse } from 'next/server';
import { testConnection, runMigrations } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Run migrations
    const migrationsSuccessful = await runMigrations();

    return NextResponse.json({
      status: 'success',
      database: 'connected',
      migrations: migrationsSuccessful ? 'completed' : 'failed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json(
      {
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
