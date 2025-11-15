import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection.
 * Stack Auth handles authentication - this middleware can be extended
 * for additional logic like redirects, logging, etc.
 *
 * TODO: Implement Stack Auth-based route protection if needed.
 * For now, Stack's StackProvider handles auth redirects on the client.
 */
export function middleware(request: NextRequest) {
  // Add custom middleware logic here if needed
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - handler (Stack Auth routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|handler).*)',
  ],
};
