import JsonLd from './JsonLd';
import { Locale } from '@/lib/seo/types';

// The shape returned by getPublicProductBySlug / getTrendingProducts
interface TrendingProduct {
  id: string;
  title: string;
  titleAr?: string | null;
  shortDescription?: string | null;
  shortDescriptionAr?: string | null;
  estimatedPrice?: number | null;
  priceCurrency?: string;
  images?: { url: string; altText?: string | null }[];
  slug: string | null;
  category?: string | null;
  categoryAr?: string | null;
}

export default function ProductSchema({
  product,
  locale,
}: {
  product: TrendingProduct;
  locale: Locale;
}) {
  const name = locale === 'ar' ? product.titleAr || product.title : product.title;
  const description =
    locale === 'ar'
      ? product.shortDescriptionAr || product.shortDescription
      : product.shortDescription;
  const image = product.images?.[0]?.url || 'https://jahez.online/og-image.jpg';

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description || undefined,
    image,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'JAHEZ TRADE CO',
    },
    ...(product.estimatedPrice && {
      offers: {
        '@type': 'Offer',
        priceCurrency: product.priceCurrency || 'USD',
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