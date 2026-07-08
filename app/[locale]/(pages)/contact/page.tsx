// app/[locale]/(pages)/contact/page.tsx

import { getLocale } from "next-intl/server";
import { ContactHero } from "./_components/ContactHero";
import { ContactForm } from "./_components/ContactForm";
import { ContactMap } from "./_components/ContactMap";
import { ContactInfo } from "./_components/ContactInfo";
import type { Metadata } from "next";
import { Header } from "../../_components/Header/Header";
import { FooterHero } from "../../_components/Footer/FooterHero";
import { FooterSection } from "../../_components/Footer/FooterSection";

// ─── SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import FAQSchema from "@/components/seo/FAQSchema";

interface PageProps {
  params: Promise<{ locale: string }>;
}

// ─── SIMPLIFIED METADATA ─────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({
    pageType: "contact",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
    pathSegment: "contact",
  });
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  // Breadcrumb items
  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "اتصل بنا" : "Contact", url: `/${locale}/contact` },
  ];

  // Optional FAQ data (customize these)
  const faqs = isAr
    ? [
        { q: "كيف أبدأ الاستيراد من الصين؟", a: "تواصل معنا وسنرشدك خلال العملية." },
        { q: "هل تقدمون خدمات الشحن؟", a: "نعم، لدينا شركاء شحن موثوقون." },
      ]
    : [
        { q: "How do I start sourcing from China?", a: "Contact us and we'll guide you through the process." },
        { q: "Do you offer shipping services?", a: "Yes, we have trusted shipping partners." },
      ];

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* ─── SCHEMA MARKUP ─────────────────────── */}
      <BreadcrumbSchema items={breadcrumbItems} />
      <FAQSchema faqs={faqs} />

      <ContactHero isAr={isAr} locale={locale} />

      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 pb-20">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <ContactInfo isAr={isAr} locale={locale} />
            </div>
            <div className="lg:col-span-3">
              <ContactForm isAr={isAr} locale={locale} />
            </div>
          </div>
          <ContactMap isAr={isAr} />
        </div>
      </section>

      <FooterHero />
      <FooterSection />
    </main>
  );
}