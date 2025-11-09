import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Defensive: ensure db is available before constructing adapter to satisfy strict null checks.
// Enforce non-null database instance at runtime; aids strict type usage below.
if (!db) {
  throw new Error("Database instance not initialized")
}
const database = db!;

// NOTE: Our users table diverges from NextAuth's default expected shape (no name/image/emailVerified columns).
// For now we rely on a thin shim object that supplies only what DrizzleAdapter inspects at runtime.
// Long-term: implement a custom adapter conforming precisely to our schema.
// @ts-expect-error Schema mismatch is intentional; runtime usage limited to id/email fields.
const adapter = DrizzleAdapter(database, { usersTable: users });

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle user creation/update in our custom schema
      if (account?.provider === "google" && user.email) {
        try {
          // Check if user exists
          const existingUser = await database.select().from(users).where(eq(users.email, user.email)).limit(1);

          if (existingUser.length === 0) {
            // Create new user in our custom schema
            await database.insert(users).values({
              email: user.email!,
              nickname: user.name || user.email!.split('@')[0],
            } as any); // Casting due to custom schema divergence
          }

          return true;
        } catch (error) {
          console.error('Error handling user sign in:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await database.select().from(users).where(eq(users.email, session.user.email)).limit(1)
        const first = dbUser[0]
        if (first) {
          // These properties are provided by module augmentation (types/next-auth.d.ts)
          session.user.id = first.id
          session.user.nickname = first.nickname
          session.user.groupCode = first.groupCode ?? null
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt"
  },
})
