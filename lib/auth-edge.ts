import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Edge-compatible authentication helper
 * Uses getToken instead of auth() to avoid async_hooks dependency
 */
export async function getServerSession(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return null;
  }

  return {
    user: {
      id: token.id as string,
      email: token.email,
      name: token.name,
      image: token.picture,
    },
  };
}
