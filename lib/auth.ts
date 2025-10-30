import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, groups, trackingEntries } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    // We'll handle sessions manually since we're not using the standard NextAuth tables
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle user creation/update in our custom schema
      if (account?.provider === "google" && user.email) {
        try {
          // Check if user exists
          const existingUser = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

          if (existingUser.length === 0) {
            // Create new user in our custom schema
            await db.insert(users).values({
              email: user.email,
              nickname: user.name || user.email.split('@')[0],
              // Other fields will be null initially, user can fill them in profile
            });
          }

          return true;
        } catch (error) {
          console.error('Error handling user sign in:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, user }) {
      // Add our custom user data to the session
      if (session.user?.email) {
        const dbUser = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
        if (dbUser.length > 0) {
          session.user.id = dbUser[0].id;
          session.user.nickname = dbUser[0].nickname;
          session.user.groupCode = dbUser[0].groupCode;
        }
      }
      return session;
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
