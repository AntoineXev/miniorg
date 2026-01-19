/**
 * Auth configuration for Edge Runtime (middleware)
 * This version doesn't use PrismaAdapter to avoid loading database adapters
 * Uses only JWT sessions which are compatible with Edge Runtime
 */
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const { auth: authEdge } = NextAuth({
  // No Prisma adapter - JWT only for middleware
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt", // JWT sessions are Edge Runtime compatible
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
