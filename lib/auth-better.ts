import { SignJWT, jwtVerify } from "jose";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getPrisma } from "@/lib/prisma";

// Configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET || "your-secret-key"
);

// Helper to create a JWT token
export async function createToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// Helper to verify a JWT token - Edge compatible
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// Get session from request cookies - Edge compatible
export async function getSession(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  // Extract better-auth session token from cookies
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('better-auth.session_token='));
  
  if (!sessionCookie) return null;

  const token = sessionCookie.split('=')[1];
  const payload = await verifyToken(token);
  
  if (!payload) return null;

  return {
    user: {
      id: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      image: payload.image as string,
    },
    session: payload,
  };
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

// Export for compatibility with API routes
export { getPrisma };
