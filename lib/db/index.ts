import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

// Create the database instance
export const db = drizzle(sql, { schema });

// Connection test function
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Migration helper functions
export async function runMigrations() {
  try {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid TEXT UNIQUE,
        email TEXT NOT NULL UNIQUE,
        nickname TEXT NOT NULL,
        gender TEXT,
        height INTEGER,
        weight REAL,
        max_pushups INTEGER DEFAULT 0,
        group_code TEXT,
        pushup_state JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        members JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tracking_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        date TEXT NOT NULL,
        pushups INTEGER DEFAULT 0,
        sports INTEGER DEFAULT 0,
        water INTEGER DEFAULT 0,
        protein REAL DEFAULT 0,
        weight REAL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS user_email_idx ON users(email);`;
    await sql`CREATE INDEX IF NOT EXISTS user_firebase_uid_idx ON users(firebase_uid);`;
    await sql`CREATE INDEX IF NOT EXISTS group_code_idx ON groups(code);`;
    await sql`CREATE INDEX IF NOT EXISTS tracking_user_date_idx ON tracking_entries(user_id, date);`;

    console.log('Database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}
