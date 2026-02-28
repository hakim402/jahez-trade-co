import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { prisma } from '@/lib/prisma';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth();
  const pathname = req.nextUrl.pathname;

  // Check if the path already has a locale prefix
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If user is authenticated and the path does NOT have a locale, redirect to saved locale
  if (userId && !pathnameHasLocale) {
    const userLocale = (sessionClaims?.publicMetadata as any)?.locale;
    const targetLocale = routing.locales.includes(userLocale) ? userLocale : routing.defaultLocale;
    const newUrl = new URL(`/${targetLocale}${pathname}`, req.url);
    return NextResponse.redirect(newUrl);
  }

  // Run route protection logic (your existing admin/dashboard checks)
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  if (isAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    // Fetch user from DB to verify admin role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Otherwise, run the intl middleware to handle locale detection/rewriting
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    '/((?!_next|.*\\..*|api).*)', // Exclude API routes, static files
    '/',
    '/(en|ar)/:path*'
  ]
};