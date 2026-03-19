// i18n/routing.ts

import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',

  pathnames: {
    '/': '/',
    '/dashboard': {
      en: '/dashboard',
      ar: '/dashboard'
    },

    '/admin': '/admin'
  }
});

export type Locale = (typeof routing.locales)[number];

// Navigation helpers
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
