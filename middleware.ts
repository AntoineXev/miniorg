import { authEdge } from "@/lib/auth-edge";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function buildCorsHeaders(origin: string | null): Headers {
  const headers = new Headers();
  // Echo the requesting origin so credentials are accepted.
  headers.set("Access-Control-Allow-Origin", origin || "*");
  headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-requested-with"
  );
  headers.set("Access-Control-Allow-Credentials", "true");
  return headers;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get("origin");

  // Handle CORS for API routes (needed for Tauri → Cloudflare calls)
  if (pathname.startsWith("/api")) {
    const corsHeaders = buildCorsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    const response = NextResponse.next();
    corsHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";
  const isTauriUA = userAgent.includes("tauri");
  const tauriCookie = request.cookies.get("tauri-client")?.value === "1";
  const isTauriClient = isTauriUA || tauriCookie;

  // Tauri client uses its own JWT; bypass NextAuth guard
  if (isTauriClient) {
    console.log("Tauri client detected; bypassing NextAuth guard");
    return NextResponse.next();
  }

  const session = await authEdge();

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
