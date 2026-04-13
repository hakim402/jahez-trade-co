// app/[locale]/(pages)/services/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { getDetailPageData } from "../actions";
import { ServiceDetailClient } from "./_components/ServiceDetailClient";
import { routing } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  const baseUrl = "https://jahez.online";

  const result = await getDetailPageData(id, 3);

  if (!result.success) {
    return {
      title: isAr ? "الخدمة غير موجودة | جاهز" : "Service Not Found | JAHEZ",
      description: isAr
        ? "عذراً، الخدمة التي تبحث عنها غير متوفرة."
        : "Sorry, the service you are looking for is not available.",
    };
  }

  const service = result.data.service;

  const title = (isAr ? service.titleAr : null) ?? service.title;
  const description =
    (isAr ? service.shortDescAr : null) ??
    service.shortDesc ??
    (isAr ? "خدمة استشارية من جاهز" : "Consulting service by JAHEZ");

  const canonicalUrl = `${baseUrl}/${locale}/services/${id}`;

  // Build hreflang alternates
  const languages: Record<string, string> = {};
  routing.locales.forEach((loc) => {
    languages[loc] = `${baseUrl}/${loc}/services/${id}`;
  });

  // Primary image (first primary or first available)
  const primaryImage =
    service.images.find((img) => img.isPrimary)?.url || service.images[0]?.url;
  const ogImage = primaryImage
    ? {
        url: primaryImage,
        width: 1200,
        height: 630,
        alt: title,
      }
    : undefined;

  return {
    title: `${title} | ${isAr ? "جاهز" : "JAHEZ"}`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title: `${title} | ${isAr ? "جاهز" : "JAHEZ"}`,
      description,
      url: canonicalUrl,
      siteName: isAr ? "جاهز" : "JAHEZ",
      locale: isAr ? "ar_SA" : "en_US",
      type: "website",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${isAr ? "جاهز" : "JAHEZ"}`,
      description,
      images: ogImage,
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  const result = await getDetailPageData(id, 3);

  if (!result.success) notFound();

  const { service, related } = result.data;

  // JSON‑LD Product/Service schema
  const primaryImage =
    service.images.find((img) => img.isPrimary)?.url || service.images[0]?.url;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    provider: {
      "@type": "Organization",
      name: "JAHEZ",
      url: "https://jahez.online",
    },
    serviceType: service.topic,
    category: service.category,
    url: `https://jahez.online/${locale}/services/${id}`,
    image: primaryImage,
    offers: {
      "@type": "Offer",
      price: service.priceFrom,
      priceCurrency: service.priceCurrency,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <Script
        id="service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <ServiceDetailClient service={service} related={related} isAr={isAr} />
    </>
  );
}