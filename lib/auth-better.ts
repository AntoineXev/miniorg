import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getPrisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(getPrisma(), {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: false, // We only use OAuth
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL,
  // Edge Runtime compatible settings
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache session for 5 minutes
    },
  },
});

// Helper function for Edge Runtime - get session from request
export async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  return session;
}

// Helper to extract user from session
export function getUserFromSession(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user) {
    return null;
  }
  
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };
}
