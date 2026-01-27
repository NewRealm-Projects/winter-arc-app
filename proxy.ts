import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/settings", "/leaderboard", "/onboarding"];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/handler/sign-in", "/handler/sign-up"];

// Routes that are always public
const publicRoutes = ["/", "/offline", "/database", "/api"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // Static files like favicon.ico
  ) {
    return NextResponse.next();
  }

  // Check for Stack Auth session cookie
  // Stack Auth uses various cookie names, check for common patterns
  const hasAuthCookie =
    request.cookies.has("stack-token") ||
    request.cookies.has("stack-refresh-token") ||
    Array.from(request.cookies.getAll()).some(
      (cookie) =>
        cookie.name.startsWith("stack-") || cookie.name.includes("auth")
    );

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Check if current route is an auth route (login/signup)
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // If accessing protected route without auth, redirect to sign-in
  if (isProtectedRoute && !hasAuthCookie) {
    const signInUrl = new URL("/handler/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If accessing auth routes while already authenticated, redirect to dashboard
  if (isAuthRoute && hasAuthCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
};
