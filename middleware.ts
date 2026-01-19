import { authEdge } from "@/lib/auth-edge";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await authEdge();

  // Liste des routes protégées (dashboard)
  const protectedRoutes = ["/backlog", "/calendar", "/today", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Protect dashboard routes
  if (isProtectedRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect to backlog if already logged in and trying to access login
  if (request.nextUrl.pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/backlog", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
