import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check for session token in cookies
  const sessionToken = request.cookies.get('authjs.session-token') || 
                       request.cookies.get('__Secure-authjs.session-token')
  
  const isAuthenticated = !!sessionToken

  // Protect backlog and calendar routes
  if (pathname.startsWith("/backlog") || pathname.startsWith("/calendar") || pathname.startsWith("/today")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Redirect to backlog if already logged in
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/backlog", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
