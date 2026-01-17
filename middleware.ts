import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isAuthenticated = !!req.auth
  const pathname = req.nextUrl.pathname

  // Protect backlog and calendar routes
  if (pathname.startsWith("/backlog") || pathname.startsWith("/calendar")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  // Redirect to backlog if already logged in
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/backlog", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
