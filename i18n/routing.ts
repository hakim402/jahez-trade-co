// i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'ar',

  pathnames: {
    '/': '/',
    '/dashboard': {
      en: '/dashboard',
      ar: '/dashboard',
    },
    '/admin': '/admin',

    // Public pages
    '/products': '/products',
    '/services': '/services',
    '/blogs': '/blogs',
    '/about': '/about',
    '/contact': '/contact',

    // Authentication
    '/sign-in': '/sign-in',
    '/sign-up': '/sign-up',

    // Dashboard sub‑routes (static paths)
    '/dashboard/requests': '/dashboard/requests',
    '/dashboard/bookings': '/dashboard/bookings',
    '/dashboard/consulting': '/dashboard/consulting',
    '/dashboard/support': '/dashboard/support',
    '/dashboard/notifications': '/dashboard/notifications',
    '/dashboard/shipments': '/dashboard/shipments',

    // Shipment tracking (public)
    '/track': '/track',
  },
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);