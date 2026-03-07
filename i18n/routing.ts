// i18n/routing.ts

import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  // Optional: translate pathnames if needed
  pathnames: {
    '/': '/',
    '/dashboard': {
      en: '/dashboard',
      ar: '/dashboard'
    },
    '/admin': {
      en: '/admin',
      ar: '/admin'
    }
    // Add other paths as needed
  }
});

export type Locale = (typeof routing.locales)[number];

// Navigation helpers that automatically handle locale prefixes
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);