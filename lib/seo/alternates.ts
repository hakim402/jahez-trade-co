import { Locale } from './types';

export function getAlternates({
  locale,
  pathSegment,
}: {
  locale: Locale;
  pathSegment?: string;
}) {
  const baseUrl = 'https://jahez.online';
  const path = pathSegment ? `/${pathSegment}` : '';

  return {
    canonical: `${baseUrl}/${locale}${path}`,
    languages: {
      'en-US': `${baseUrl}/en${path}`,
      'ar-AE': `${baseUrl}/ar${path}`,
      'x-default': `${baseUrl}/ar${path}`,
    },
  };
}