import { pgTable, text, timestamp, integer, real, boolean, json, uuid } from 'drizzle-orm/pg-core';

// Users table - migrated from Firebase users collection
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: text('firebase_uid').unique(), // For migration compatibility
  email: text('email').notNull().unique(),
  nickname: text('nickname').notNull(),
  gender: text('gender'),
  height: integer('height'), // in cm
  weight: real('weight'), // in kg
  maxPushups: integer('max_pushups').default(0),
  groupCode: text('group_code'),
  pushupState: json('pushup_state'), // For complex state objects
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Groups table - migrated from Firebase groups collection
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  members: json('members').$type<string[]>(), // Array of user IDs
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tracking entries table - migrated from Firebase tracking/{userId}/entries collection
export const trackingEntries = pgTable('tracking_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  date: text('date').notNull(), // Format: YYYY-MM-DD
  pushups: integer('pushups').default(0),
  sports: integer('sports').default(0), // in minutes
  water: integer('water').default(0), // in ml
  protein: real('protein').default(0), // in grams
  weight: real('weight'), // in kg
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Indexes for better performance
import { index } from 'drizzle-orm/pg-core';

export const userEmailIdx = index('user_email_idx').on(users.email);
export const userFirebaseUidIdx = index('user_firebase_uid_idx').on(users.firebaseUid);
export const groupCodeIdx = index('group_code_idx').on(groups.code);
export const trackingUserDateIdx = index('tracking_user_date_idx').on(trackingEntries.userId, trackingEntries.date);

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type TrackingEntry = typeof trackingEntries.$inferSelect;
export type NewTrackingEntry = typeof trackingEntries.$inferInsert;
