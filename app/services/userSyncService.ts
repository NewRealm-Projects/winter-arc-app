import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Syncs Stack Auth user to local database.
 * Creates or updates user record based on Stack user data.
 *
 * @param stackUser - Stack Auth user object
 * @returns The synced user from database
 */
export async function syncStackUserToDb(stackUser: {
  id: string;
  primaryEmail: string | null;
  displayName?: string | null;
}) {
  if (!db) {
    throw new Error("Database unavailable");
  }

  if (!stackUser.primaryEmail) {
    throw new Error("User email is required for sync");
  }

  const database = db;

  // Check if user already exists by email
  const existingUsers = await database
    .select()
    .from(users)
    .where(eq(users.email, stackUser.primaryEmail))
    .limit(1);

  const existingUser = existingUsers[0];

  if (existingUser) {
    // Update existing user with Stack ID
    const updated = await database
      .update(users)
      .set({
        stackUserId: stackUser.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUser.id))
      .returning();

    return updated[0];
  } else {
    // Create new user
    const newUser = await database
      .insert(users)
      .values({
        stackUserId: stackUser.id,
        email: stackUser.primaryEmail,
        nickname: stackUser.displayName || stackUser.primaryEmail.split("@")[0] || "User",
        language: "de", // Default German
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newUser[0];
  }
}

/**
 * Get local user by Stack user ID
 */
export async function getUserByStackId(stackUserId: string) {
  if (!db) {
    throw new Error("Database unavailable");
  }

  const database = db;
  const result = await database
    .select()
    .from(users)
    .where(eq(users.stackUserId, stackUserId))
    .limit(1);

  return result[0] || null;
}
