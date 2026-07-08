import JsonLd from './JsonLd';
import { Locale } from '@/lib/seo/types';

export default function ProductSchema({
  product,
  locale,
}: {
  product: any;
  locale: Locale;
}) {
  if (!product) return null;

  const name = locale === 'ar' ? product.titleAr || product.title : product.title;
  const description =
    locale === 'ar'
      ? product.shortDescAr || product.shortDesc
      : product.shortDesc || undefined;
  const image = product.images?.[0]?.url || 'https://jahez.online/og-image.jpg';
  const sku = product.slug || product.id;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name || 'Product',
    description: description,
    image: image,
    sku: sku,
    brand: {
      '@type': 'Brand',
      name: 'JAHEZ TRADE CO',
    },
    ...(product.estimatedPrice && {
      offers: {
        '@type': 'Offer',
        priceCurrency: product.currency || 'USD',
        price: product.estimatedPrice,
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'JAHEZ TRADE CO',
        },
      },
    }),
  };

  return <JsonLd data={data} />;
}