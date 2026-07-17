// app/[locale]/_components/Language/UserLocaleSync.tsx


'use client';

import { useUser } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import { useEffect, useRef } from 'react';

export function UserLocaleSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const locale = useLocale();
  const isUpdating = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || isUpdating.current) return;

    const currentLocale = user.unsafeMetadata?.locale as string | undefined;
    if (currentLocale === locale) return;

    isUpdating.current = true;

    // Use unsafeMetadata for storing locale preference
    const newMetadata = {
      ...(user.unsafeMetadata || {}),
      locale,
    };

    (user.update as any)({ unsafeMetadata: newMetadata })
      .then(() => {
        isUpdating.current = false;
      })
      .catch((err: any) => {
        isUpdating.current = false;
        console.error('Failed to update user locale:', err);
      });
  }, [locale, user, isLoaded, isSignedIn]);

  return null;
}