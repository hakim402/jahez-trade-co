// app/[locale]/(pages)/services/page.tsx

import type { Metadata } from "next";
import { Suspense } from "react";
import { getListingPageMeta, getPublicConsultingServices } from "./actions";
import type { ConsultingServiceTopic } from "@prisma/client";
import { ServicesListClient } from "./_components/ServicesListClient";
import { ServicesListSkeleton } from "./_components/ServicesListSkeleton";
import { Header } from "../../_components/Header/Header";
import { FooterSection } from "../../_components/Footer/FooterSection";
import { ServicesHero } from "./_components/ServicesHero";

// ─── SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ServiceSchema from "@/components/seo/ServiceSchema";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    topic?: string;
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

// ─── SIMPLIFIED METADATA ─────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({
    pageType: "service",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
    pathSegment: "services",
  });
}

export const revalidate = 300;

export default async function ServicesPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const isAr = locale === "ar";

  const topic = sp.topic as ConsultingServiceTopic | undefined;
  const category = sp.category || undefined;
  const search = sp.search || undefined;
  const sortBy = (sp.sort || "popular") as
    | "newest"
    | "popular"
    | "price_asc"
    | "price_desc";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [meta, initialServices] = await Promise.all([
    getListingPageMeta(3),
    getPublicConsultingServices({
      topic,
      category,
      search,
      sortBy,
      page,
      pageSize: 12,
    }),
  ]);

  const services = initialServices.success ? initialServices.data.items : [];
  const total = initialServices.success ? initialServices.data.total : 0;
  const totalPages = initialServices.success
    ? initialServices.data.totalPages
    : 0;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "الخدمات" : "Services", url: `/${locale}/services` },
  ];

  // Featured services (from meta) to use in schema
  const featuredServices = meta.featured.slice(0, 3);

  return (
    <main className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />

      {/* ─── SCHEMA MARKUP ─────────────────────── */}
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Service Schema for featured services */}
      {featuredServices.map((service) => (
        <Suspense key={service.id} fallback={null}>
          <ServiceSchema service={service as any} locale={locale as "en" | "ar"} />
        </Suspense>
      ))}

      <ServicesHero
        isAr={isAr}
        totalCount={meta.totalCount}
        featuredCount={meta.featured.length}
        topics={meta.topicCounts}
        categories={meta.categories}
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<ServicesListSkeleton isAr={isAr} />}>
          <ServicesListClient
            isAr={isAr}
            initialServices={services}
            initialTotal={total}
            initialTotalPages={totalPages}
            initialPage={page}
            categories={meta.categories}
            topicCounts={meta.topicCounts}
            initialFilters={{ topic, category, search, sortBy }}
          />
        </Suspense>
      </section>

      <FooterSection />
    </main>
  );
}