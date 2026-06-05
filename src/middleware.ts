import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/api/', '/_next/', '/favicon', '/catalog'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth for API routes, Next.js internals, and assets
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  // If no password set, allow through (local dev)
  if (!password) return NextResponse.next();

  // Check cookie
  const auth = req.cookies.get('auth')?.value;
  if (auth === password) return NextResponse.next();

  // Check if this is the login form submission
  if (pathname === '/login') return NextResponse.next();

  // Redirect to login
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
