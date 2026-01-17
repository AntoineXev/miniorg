import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth-better";

export async function middleware(request: NextRequest) {
  // Use Better Auth getSession - fully Edge Runtime compatible
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthenticated = !!session?.user;

  // Protect backlog and calendar routes
  if (request.nextUrl.pathname.startsWith("/backlog") || 
      request.nextUrl.pathname.startsWith("/calendar")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect to backlog if already logged in and trying to access login
  if (request.nextUrl.pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/backlog", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
