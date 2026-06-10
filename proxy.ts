// proxy.ts or middleware.ts

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { prisma } from "@/lib/prisma";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/:locale/dashboard(.*)",
  "/:locale/admin(.*)",
]);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/:locale/admin(.*)",
]);

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  // =====================================================
  // BYPASS SEO FILES
  // =====================================================
  if (
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // =====================================================
  // BYPASS API ROUTES
  // =====================================================
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // =====================================================
  // FORCE ADMIN TO ENGLISH
  // =====================================================
  if (pathname.startsWith("/admin")) {
    const url = new URL(`/en${pathname}`, req.url);
    return NextResponse.redirect(url);
  }

  const { userId, sessionClaims } = await auth();

  // =====================================================
  // Handle Locale Redirect for Authenticated Users
  // =====================================================
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (userId && !pathnameHasLocale) {
    const userLocale = (sessionClaims?.publicMetadata as any)?.locale;

    const targetLocale = routing.locales.includes(userLocale)
      ? userLocale
      : routing.defaultLocale;

    const newUrl = new URL(`/${targetLocale}${pathname}`, req.url);
    return NextResponse.redirect(newUrl);
  }

  // =====================================================
  // Protect Dashboard & Admin Routes
  // =====================================================
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // =====================================================
  // Admin Role Check
  // =====================================================
  if (isAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/en/sign-in", req.url));
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/en/dashboard", req.url));
    }
  }

  // =====================================================
  // Run Internationalization Middleware
  // =====================================================
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};