import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { getPrisma } from "@/lib/server/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Use JWT sessions for Cloudflare Workers compatibility
  // PrismaAdapter doesn't work in Edge Runtime due to fs dependencies
  session: {
    strategy: "jwt",
  },
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
  // Trust host for Cloudflare Workers deployment
  trustHost: true,
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign in, save user to database and add info to token
      if (account && profile) {
        try {
          const prisma = getPrisma()
          
          // Sync user to database
          await prisma.user.upsert({
            where: { email: profile.email! },
            update: {
              name: profile.name,
              image: profile.picture as string | null,
            },
            create: {
              email: profile.email!,
              name: profile.name,
              image: profile.picture as string | null,
              emailVerified: new Date(),
            },
          })
        } catch (error) {
          console.error("Failed to sync user to database:", error)
          // Continue anyway - JWT will still work
        }
        
        token.id = profile.sub
        token.email = profile.email
        token.name = profile.name
        token.picture = profile.picture
      }
      return token
    },
    async session({ session, token }) {
      // Add user info from token to session
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
})
