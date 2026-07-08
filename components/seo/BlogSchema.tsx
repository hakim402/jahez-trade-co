import JsonLd from './JsonLd';
import { PublicPostDetail } from '@/app/[locale]/(pages)/blogs/actions';
import { Locale } from '@/lib/seo/types';

export default function BlogSchema({
  post,
  locale,
}: {
  post: PublicPostDetail;
  locale: Locale;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.seo.ogImageUrl || post.images[0]?.url || 'https://jahez.online/og-image.jpg',
    datePublished: post.publishedAt || undefined,
    dateModified: post.publishedAt || undefined,
    author: {
      '@type': 'Person',
      name: post.author.fullName,
    },
    publisher: {
      '@type': 'Organization',
      name: locale === 'ar' ? 'جاهز' : 'JAHEZ TRADE CO',
      logo: {
        '@type': 'ImageObject',
        url: 'https://jahez.online/logo.png',
      },
    },
    description: post.seo.metaDescription || post.excerpt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://jahez.online/${locale}/blogs/${post.slug}`,
    },
  };
  return <JsonLd data={data} />;
}