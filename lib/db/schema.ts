import { pgTable, text, timestamp, integer, real, boolean, json, uuid, index, date } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
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
}, (table) => ({
  emailIdx: index('user_email_idx').on(table.email),
}));

// Groups table - migrated from Firebase groups collection
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  members: json('members').$type<string[]>(), // Array of user IDs
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  codeIdx: index('group_code_idx').on(table.code),
}));

// Tracking entries table
export const trackingEntries = pgTable('tracking_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  pushups: integer('pushups').default(0),
  sports: integer('sports').default(0), // in minutes
  water: integer('water').default(0), // in ml
  protein: real('protein').default(0), // in grams
  weight: real('weight'), // in kg
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userDateIdx: index('tracking_user_date_idx').on(table.userId, table.date),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type TrackingEntry = typeof trackingEntries.$inferSelect;
export type NewTrackingEntry = typeof trackingEntries.$inferInsert;
