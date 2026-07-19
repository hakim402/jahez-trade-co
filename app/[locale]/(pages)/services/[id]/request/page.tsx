// app/[locale]/(pages)/services/[id]/request/page.tsx

import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublicConsultingServiceById } from "../../actions";
import { ConsultingRequestForm } from "./_components/ConsultingRequestForm";
import { Header } from "../../../../_components/Header/Header";
import { FooterHero } from "../../../../_components/Footer/FooterHero";
import { FooterSection } from "../../../../_components/Footer/FooterSection";

// ─── SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

// ─── METADATA ─────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const result = await getPublicConsultingServiceById(id);

  if (!result.success) {
    return {
      title: locale === "ar" ? "الخدمة غير موجودة | جاهز" : "Service Not Found | JAHEZ",
    };
  }

  const service = result.data;
  const isAr = locale === "ar";
  const name = (isAr && service.titleAr) ? service.titleAr : service.title;

  return generatePageMetadata({
    pageType: "request",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
    pathSegment: `services/${id}/request`,
    customTitle: isAr ? `طلب ${name} | جاهز` : `Request ${name} | JAHEZ`,
    customDescription: isAr
      ? `اطلب استشارة ${name}. املأ النموذج وسنرد عليك خلال ٢٤ ساعة.`
      : `Request a consultation for ${name}. Fill in the form and we'll get back to you within 24 hours.`,
    modifiedDate: service.createdAt,
  });
}

// ─── PAGE ────────────────────────────────────
export default async function ConsultingRequestPage({ params }: PageProps) {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  const result = await getPublicConsultingServiceById(id);

  if (!result.success) notFound();

  const service = result.data;
  const serviceName = isAr && service.titleAr ? service.titleAr : service.title;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "الخدمات" : "Services", url: `/${locale}/services` },
    { name: serviceName, url: `/${locale}/services/${id}` },
    { name: isAr ? "طلب استشارة" : "Request", url: "" },
  ];

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* ─── SCHEMA MARKUP ─────────────────────── */}
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Hero section */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 bg-linear-to-b from-muted/50 to-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#7b57fc] uppercase tracking-wide mb-3">
            {isAr ? "طلب استشارة" : "Consultation Request"}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {isAr ? `اطلب ${serviceName}` : `Request ${serviceName}`}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            {isAr
              ? "املأ النموذج أدناه وسنرد عليك خلال ٢٤ ساعة مع التفاصيل والأسعار."
              : "Fill in the form below and we'll get back to you within 24 hours with details and pricing."}
          </p>
        </div>
      </section>

      {/* Form section */}
      <section className="py-8 md:py-12 bg-background">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <Suspense fallback={null}>
            <ConsultingRequestForm
              service={service}
              isAr={isAr}
              locale={locale as "ar" | "en"}
            />
          </Suspense>
        </div>
      </section>

      <FooterHero />
      <FooterSection />
    </main>
  );
}
