import JsonLd from './JsonLd';

export default function FAQSchema({
  faqs,
}: {
  faqs: { q: string; a: string }[];
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
  return <JsonLd data={data} />;
}