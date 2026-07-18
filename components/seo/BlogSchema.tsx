import JsonLd from './JsonLd';
import { Locale } from '@/lib/seo/types';

export default function BlogSchema({
  post,
  locale,
}: {
  post: any; // Accept any, we'll handle safely
  locale: Locale;
}) {
  if (!post) return null;

  const title = post.title || '';
  const slug = post.slug || '';
  const description = post.seo?.metaDescription || post.excerpt || '';
  const authorName = post.author?.fullName || 'JAHEZ';
  const publishedDate = post.publishedAt || undefined;

  // Find image: seo > primaryImage > images[0] > fallback
  const image =
    post.seo?.ogImageUrl ||
    post.primaryImage?.url ||
    post.images?.[0]?.url ||
    'https://jahez.online/og-image.jpg';

  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    image: image,
    datePublished: publishedDate,
    dateModified: publishedDate,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: locale === 'ar' ? 'جاهز' : 'JAHEZ TRADE CO',
      logo: {
        '@type': 'ImageObject',
        url: 'https://jahez.online/logo/jahez.png',
      },
    },
    description: description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://jahez.online/${locale}/blogs/${slug}`,
    },
  };

  return <JsonLd data={data} />;
}