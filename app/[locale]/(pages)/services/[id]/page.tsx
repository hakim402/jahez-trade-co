import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDetailPageData } from "../actions";
import { ServiceDetailClient } from "./_components/ServiceDetailClient";

// ─── SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
import ServiceSchema from "@/components/seo/ServiceSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

// ─── HELPER: Safe string extraction ──────────
function getSafeString(value: string | null | undefined | false): string | null {
  if (value === null || value === undefined || value === false || value === "") {
    return null;
  }
  return value;
}

// ─── SIMPLIFIED METADATA ─────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const result = await getDetailPageData(id, 3);

  if (!result.success) {
    return {
      title: locale === "ar" ? "الخدمة غير موجودة | جاهز" : "Service Not Found | JAHEZ",
    };
  }

  const service = result.data.service;
  const isAr = locale === "ar";

  // ✅ Safe extraction with explicit null checks
  const name = getSafeString(isAr ? service.titleAr : null) ?? service.title;
  const description = getSafeString(isAr ? service.shortDescAr : null) 
    ?? getSafeString(service.shortDesc) 
    ?? getSafeString(service.description) 
    ?? null;
  
  const imageUrl = getSafeString(
    service.images.find((img) => img.isPrimary)?.url || service.images[0]?.url || null
  );
  const imageAlt = getSafeString(isAr ? service.titleAr : null) ?? name;

  return generatePageMetadata({
    pageType: "service",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
    pathSegment: `services/${id}`,
    customTitle: name,
    customDescription: description,
    ogImageUrl: imageUrl,
    ogImageAlt: imageAlt,
    modifiedDate: service.createdAt,
  });
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  const result = await getDetailPageData(id, 3);

  if (!result.success) notFound();

  const { service, related } = result.data;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "الخدمات" : "Services", url: `/${locale}/services` },
    { name: isAr && service.titleAr ? service.titleAr : service.title, url: "" },
  ];

  return (
    <>
      {/* ─── SCHEMA MARKUP ─────────────────────── */}
      <Suspense fallback={null}>
        <ServiceSchema service={service as any} locale={locale as "en" | "ar"} />
        <BreadcrumbSchema items={breadcrumbItems} />
      </Suspense>

      <ServiceDetailClient service={service} related={related} isAr={isAr} />
    </>
  );
}