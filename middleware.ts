import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authMiddleware } from "@/lib/middleware/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes that handle their own auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Use enhanced auth middleware with route-level authorization
  return await authMiddleware(request)
}

export const config = {
  matcher: [
    // Match all request paths except:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - api routes (they handle their own auth)
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}
