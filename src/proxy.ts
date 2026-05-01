import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isPublicRoute, isRoleAllowed } from '@/lib/rbac';
import type { UserRole } from '@/generated/prisma/client';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals (including Turbopack HMR)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/__next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for valid session
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const role = token.role as UserRole;
  if (!isRoleAllowed(pathname, role)) {
    return NextResponse.rewrite(new URL('/forbidden', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next (all Next.js internals: static files, HMR, RSC payloads, etc.)
     * - favicon.ico (favicon)
     * - public assets with file extensions (e.g. .svg, .png)
     */
    '/((?!_next|__next|favicon.ico|.*\\..*).*)',
  ],
};
