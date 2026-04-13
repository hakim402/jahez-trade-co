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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const baseUrl = "https://jahez.online";

  const title = isAr
    ? "خدمات الاستشارة | جاهز"
    : "Consulting Services | JAHEZ";

  const description = isAr
    ? "استكشف خدمات الاستشارة المتخصصة في مصادر المنتجات واللوجستيات ودخول الأسواق. خبراء في مساعدتك على النمو."
    : "Explore expert consulting services for product sourcing, logistics, and market entry. We help your business grow.";

  const alternates = {
    canonical: `${baseUrl}/${locale}/services`,
    languages: {
      en: `${baseUrl}/en/services`,
      ar: `${baseUrl}/ar/services`,
    },
  };

  const ogImage = {
    url: `${baseUrl}/images/services-og.jpg`, // Update with actual path if available
    width: 1200,
    height: 630,
    alt: isAr ? "خدمات جاهز الاستشارية" : "JAHEZ Consulting Services",
  };

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/services`,
      siteName: isAr ? "جاهز" : "JAHEZ",
      locale: isAr ? "ar_SA" : "en_US",
      type: "website",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage,
    },
  };
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

  return (
    <main className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />
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