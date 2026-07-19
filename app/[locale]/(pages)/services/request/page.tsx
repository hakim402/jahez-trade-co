// app/[locale]/(pages)/services/request/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import { GeneralConsultingRequestForm } from "./_components/GeneralConsultingRequestForm";
import { Header } from "../../../_components/Header/Header";
import { FooterHero } from "../../../_components/Footer/FooterHero";
import { FooterSection } from "../../../_components/Footer/FooterSection";

// ─── SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import FAQSchema from "@/components/seo/FAQSchema";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({
    pageType: "request",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
    pathSegment: "services/request",
    customTitle: locale === "ar"
      ? "طلب استشارة | جاهز"
      : "Request a Consultation | JAHEZ",
    customDescription: locale === "ar"
      ? "اطلب استشارة تجارية خبيرة في التوريد والاستيراد واللوجستيات. املأ النموذج وسنرد عليك خلال ٢٤ ساعة."
      : "Request expert trade consulting in sourcing, import, and logistics. Fill in the form and we'll reply within 24 hours.",
  });
}

export default async function ConsultingRequestPage({ params }: PageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "الخدمات" : "Services", url: `/${locale}/services` },
    { name: isAr ? "طلب استشارة" : "Request a Consultation", url: "" },
  ];

  const faqs = isAr
    ? [
        { q: "كم يستغرق الرد على طلبي؟", a: "نرد عادةً خلال ٢٤ ساعة مع التفاصيل والأسعار." },
        { q: "هل يمكنني طلب خدمة مخصصة؟", a: "نعم، يمكنك شرح احتياجاتك في حقل الوصف وسنصمم حلاً مخصصاً لك." },
      ]
    : [
        { q: "How long until I get a reply?", a: "We usually reply within 24 hours with details and pricing." },
        { q: "Can I request a custom service?", a: "Yes, describe your needs in the description field and we'll tailor a solution." },
      ];

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <BreadcrumbSchema items={breadcrumbItems} />
      <FAQSchema faqs={faqs} />

      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 bg-linear-to-b from-muted/50 to-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#7b57fc] uppercase tracking-wide mb-3">
            {isAr ? "طلب استشارة" : "Consultation Request"}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {isAr ? "اطلب استشارة تجارية" : "Request Trade Consulting"}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            {isAr
              ? "اختر الخدمة التي تحتاجها واملأ النموذج أدناه. سنرد عليك خلال ٢٤ ساعة مع أفضل الحلول والأسعار."
              : "Select the service you need and fill in the form below. We'll reply within 24 hours with the best solutions and pricing."}
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-background">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <Suspense fallback={null}>
            <GeneralConsultingRequestForm isAr={isAr} locale={locale as "ar" | "en"} />
          </Suspense>
        </div>
      </section>

      <FooterHero />
      <FooterSection />
    </main>
  );
}
