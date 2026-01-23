import { authEdge } from "@/lib/auth-edge";
import { verifyTauriJwt } from "@/lib/tauri-jwt";
import { buildCorsHeaders, isAllowedCorsOrigin } from "@/lib/utils/cors";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function hasValidTauriBearer(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return false;
  try {
    await verifyTauriJwt(token);
    return true;
  } catch {
    return false;
  }
}

async function hasValidTauriToken(request: NextRequest): Promise<boolean> {
  // 1) Bearer token (API / fetch)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) {
      try {
        await verifyTauriJwt(token);
        return true;
      } catch {}
    }
  }

  // 2) Cookie token (navigation / router)
  const cookieToken = request.cookies.get("tauri-session")?.value;
  if (cookieToken) {
    try {
      await verifyTauriJwt(cookieToken);
      return true;
    } catch {}
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get("origin");

  // Handle CORS for API routes (needed for Tauri → Cloudflare calls)
  if (pathname.startsWith("/api")) {
    if (!isAllowedCorsOrigin(origin)) {
      const headers = buildCorsHeaders(origin, { allowCredentials: false });
      return new NextResponse("CORS origin not allowed", {
        status: 403,
        headers,
      });
    }

    const corsHeaders = buildCorsHeaders(origin, { allowCredentials: true });

    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    const response = NextResponse.next();
    corsHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  // Tauri client uses its own JWT; bypass NextAuth guard only when valid
  if (await hasValidTauriBearer(request)) {
    return NextResponse.next();
  }

  const session = await authEdge();

  if (await hasValidTauriToken(request)) {
    return NextResponse.next();
  }

  // Liste des routes protégées (dashboard)
  const protectedRoutes = ["/backlog", "/calendar", "/today", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Protect dashboard routes
  if (isProtectedRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect to backlog if already logged in and trying to access login
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/backlog", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
