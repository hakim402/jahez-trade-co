import JsonLd from './JsonLd';
import { Locale } from '@/lib/seo/types';

export default function ServiceSchema({
  service,
  locale,
}: {
  service: any;
  locale: Locale;
}) {
  if (!service) return null;

  const name = locale === 'ar' ? service.titleAr || service.title : service.title;
  const description =
    locale === 'ar'
      ? service.shortDescAr || service.shortDesc
      : service.shortDesc || undefined;
  const image =
    service.images?.find((img: any) => img.isPrimary)?.url ||
    service.images?.[0]?.url ||
    'https://jahez.online/og-image.jpg';

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: name || 'Service',
    description: description,
    provider: {
      '@type': 'Organization',
      name: 'JAHEZ TRADE CO',
    },
    serviceType: service.topic || undefined,
    ...(service.priceFrom && {
      offers: {
        '@type': 'Offer',
        priceCurrency: service.priceCurrency || 'USD',
        price: service.priceFrom,
        availability: 'https://schema.org/InStock',
      },
    }),
    image: image,
  };

  return <JsonLd data={data} />;
}