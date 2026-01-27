# Database Migration Guide

## Status: COMPLETED

The migration from Firebase Firestore to PostgreSQL (Neon) with Drizzle ORM is **complete**.

---

## Migration Summary

| Component | Old | New | Status |
|-----------|-----|-----|--------|
| Database | Firebase Firestore | PostgreSQL (Neon) | Completed |
| ORM | Firebase SDK | Drizzle ORM | Completed |
| Auth | Firebase Auth | NextAuth.js | Completed |
| Hosting | Firebase + Vercel | Vercel only | Completed |

---

## Current Architecture

### Database: Neon PostgreSQL

- Serverless PostgreSQL
- Auto-scaling connections
- Edge-compatible

### ORM: Drizzle

- Type-safe queries
- Schema in `lib/db/schema.ts`
- Migrations via `npm run db:*`

### Auth: NextAuth.js

- Google OAuth provider
- Session-based authentication
- User data stored in PostgreSQL

---

## Database Schema

Located in `lib/db/schema.ts`:

```typescript
// Users
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
}

// Tracking Entries
trackingEntries: {
  id: uuid (PK)
  userId: uuid (FK -> users.id, ON DELETE CASCADE)
  date: date
  pushups: integer
  sports: integer
  water: integer
  protein: real
  weight: real
  completed: boolean
}

// Groups
groups: {
  id: uuid (PK)
  code: text (unique)
  name: text
  members: json
}
```

---

## Commands

```bash
# Schema operations
npm run db:generate    # Generate migration files
npm run db:push        # Push schema to database
npm run db:studio      # Open Drizzle Studio GUI

# Development
npm run dev            # Start dev server
npm run build          # Build for production
```

---

## Removed (Firebase)

The following Firebase dependencies have been removed:

- `firebase` - Client SDK
- `firebase-admin` - Admin SDK
- `dexie` - IndexedDB (SmartNotes)

All Firestore references have been removed from the codebase.

---

## Migration Notes

### Data Migration (Historical)

Data was migrated from Firebase Firestore to PostgreSQL using:
1. Export from Firestore
2. Transform to PostgreSQL format
3. Import via Drizzle ORM

### Breaking Changes

1. **Date format**: `tracking_entries.date` changed from TEXT to DATE type
2. **Foreign keys**: Added FK constraint from `tracking_entries.userId` to `users.id`
3. **Removed columns**: `users.firebase_uid` removed (no longer needed)

---

**Migration Completed**: January 2026
