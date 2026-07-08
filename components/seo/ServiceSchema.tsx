import JsonLd from './JsonLd';
import { PublicConsultingService } from '@/app/[locale]/(pages)/services/actions';
import { Locale } from '@/lib/seo/types';

export default function ServiceSchema({
  service,
  locale,
}: {
  service: PublicConsultingService;
  locale: Locale;
}) {
  const name = locale === 'ar' ? service.titleAr || service.title : service.title;
  const description =
    locale === 'ar' ? service.shortDescAr || service.shortDesc : service.shortDesc;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description: description || undefined,
    provider: {
      '@type': 'Organization',
      name: 'JAHEZ TRADE CO',
    },
    serviceType: service.topic,
    ...(service.priceFrom && {
      offers: {
        '@type': 'Offer',
        priceCurrency: service.priceCurrency || 'USD',
        price: service.priceFrom,
        availability: 'https://schema.org/InStock',
      },
    }),
  };
  return <JsonLd data={data} />;
}