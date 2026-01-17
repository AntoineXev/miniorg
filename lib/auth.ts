import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { getPrisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(getPrisma()),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Authorization parameters for getting refresh token and profile
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  // Trust host for Cloudflare Workers deployment
  trustHost: true,
  callbacks: {
    async session({ session, user }) {
      // Add user ID to session for API routes
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})
