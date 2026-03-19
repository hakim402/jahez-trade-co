// proxy.ts (or middleware.ts)

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { prisma } from "@/lib/prisma";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
]);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
]);

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  // =====================================================
  // 1️⃣ BYPASS ALL API ROUTES (CRITICAL FOR WEBHOOKS)
  // =====================================================
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // =====================================================
  // 2️⃣ FORCE ADMIN TO ENGLISH
  // =====================================================
  if (pathname.startsWith("/admin") && !pathname.startsWith("/en/admin")) {
    const url = new URL(`/en${pathname}`, req.url);
    return NextResponse.redirect(url);
  }

  const { userId, sessionClaims } = await auth();

  // =====================================================
  // 3️⃣ Handle Locale Redirect for Authenticated Users
  // =====================================================
  const pathnameHasLocale = routing.locales.some(
    (locale) =>
      pathname.startsWith(`/${locale}/`) ||
      pathname === `/${locale}`
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
  // 4️⃣ Protect Dashboard & Admin Routes
  // =====================================================
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // =====================================================
  // 5️⃣ Admin Role Check (Database)
  // =====================================================
  if (isAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // =====================================================
  // 6️⃣ Run Internationalization Middleware
  // =====================================================
  return intlMiddleware(req);
});


// =====================================================
// MATCHER CONFIG
// =====================================================
export const config = {
  matcher: [
    /*
      Match all routes except:
      - API routes
      - Next.js static files
      - Static assets
    */
    "/((?!api|_next|.*\\..*).*)",
  ],
};
