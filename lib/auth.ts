import NextAuth, { type NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"

// Minimal v4 configuration (JWT strategy, no DB adapter to avoid type errors)
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "", // empty fallback to avoid build-time crash
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: { strategy: 'jwt' },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Helper for API routes (server side session access)
export function auth() {
  return getServerSession(authOptions);
}
