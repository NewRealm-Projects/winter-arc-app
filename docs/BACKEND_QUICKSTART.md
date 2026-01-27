# Backend Quick Start Guide

## Overview

Winter Arc uses Next.js API Routes with PostgreSQL (Neon) and Drizzle ORM.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Auth | NextAuth.js (Google OAuth) |
| Hosting | Vercel |

---

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Create `.env.local` with:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: Sentry
SENTRY_DSN=your-sentry-dsn
```

### 3. Initialize Database

```bash
# Generate migrations from schema
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio (optional)
npm run db:studio
```

### 4. Start Development Server

```bash
npm run dev
```

App runs at http://localhost:3000

---

## API Routes

All API routes are in `app/api/`:

### Tracking

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tracking` | GET | Get tracking entries (with date range) |
| `/api/tracking/[date]` | GET | Get single day tracking |
| `/api/tracking/[date]` | POST | Create/update tracking entry |

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/[id]` | GET | Get user profile |
| `/api/users/[id]` | PATCH | Update user profile |

### Auth

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | * | NextAuth endpoints |

---

## Database Schema

Located in `lib/db/schema.ts`:

```typescript
// Users table
users: {
  id: uuid (PK)
  email: text (unique)
  nickname: text
  gender: text
  height: integer
  weight: real
  maxPushups: integer
  groupCode: text
  pushupState: json
  createdAt: timestamp
  updatedAt: timestamp
}

// Tracking entries
trackingEntries: {
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  date: date
  pushups: integer
  sports: integer
  water: integer
  protein: real
  weight: real
  completed: boolean
  createdAt: timestamp
  updatedAt: timestamp
}

// Groups
groups: {
  id: uuid (PK)
  code: text (unique)
  name: text
  members: json
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## Database Operations

### Using Drizzle ORM

```typescript
import { db } from '@/lib/db';
import { users, trackingEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Query user
const user = await db.select().from(users).where(eq(users.id, userId));

// Insert tracking entry
await db.insert(trackingEntries).values({
  userId,
  date: new Date('2025-01-26'),
  water: 2000,
  protein: 150,
});

// Update tracking entry
await db.update(trackingEntries)
  .set({ water: 2500 })
  .where(eq(trackingEntries.id, entryId));
```

---

## Deployment

### Vercel

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel Dashboard
3. Deploy automatically on push to main

### Environment Variables (Vercel)

Required:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Optional:
- `SENTRY_DSN`

---

## Troubleshooting

### Database Connection Errors

```
Error: Connection refused
```

- Check DATABASE_URL is correct
- Ensure Neon database is active
- Verify SSL mode in connection string

### NextAuth Errors

```
Error: NEXTAUTH_SECRET is not set
```

- Generate secret: `openssl rand -base64 32`
- Add to `.env.local` and Vercel

### Build Errors

```
Error: Module not found
```

- Run `npm install`
- Check for missing dependencies
- Verify import paths use `@/` alias

---

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Neon Docs](https://neon.tech/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Vercel Docs](https://vercel.com/docs)

---

**Last Updated**: January 2026
