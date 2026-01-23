import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { verifyTauriJwt } from "@/lib/tauri-jwt";

type TauriUser = {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
};

type AuthResult =
  | { userId: string; source: "tauri" | "web"; tauriUser?: TauriUser }
  | null;

/**
 * Decode and verify a Tauri JWT (Authorization: Bearer <token>)
 * Returns minimal user info or null when missing/invalid.
 */
export async function getTauriUserFromRequest(
  request: Request
): Promise<TauriUser | null> {
  const authHeader =
    request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const payload = await verifyTauriJwt(token);
    const id = payload.sub as string | undefined;
    if (!id) return null;
    return {
      id,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
      picture: payload.picture as string | undefined,
    };
  } catch (error) {
    console.warn("[tauri-auth] invalid bearer token");
    return null;
  }
}

/**
 * Unified auth for API routes:
 * - If Bearer JWT (Tauri) is present and valid: returns { userId, source: "tauri" }
 * - Else fall back to NextAuth session: returns { userId, source: "web" }
 * - Else null
 */
export async function getAuthorizedUser(
  request: Request
): Promise<AuthResult> {
  const tauriUser = await getTauriUserFromRequest(request);
  if (tauriUser?.id) {
    return { userId: tauriUser.id, source: "tauri", tauriUser };
  }

  const session = await auth();
  if (session?.user?.id) {
    return { userId: session.user.id, source: "web" };
  }

  return null;
}

/**
 * Convenience helper: returns userId or a 401 response.
 * Use inside API handlers to reduce boilerplate.
 */
export async function requireAuthorizedUser(
  request: Request
): Promise<{ userId: string; source: "tauri" | "web" } | NextResponse> {
  const authResult = await getAuthorizedUser(request);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return authResult;
}
