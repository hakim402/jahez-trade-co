// app/[locale]/(pages)/products/request/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductRequestForm } from "./_components/ProductRequestForm";
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
    pathSegment: "products/request",
    customTitle: locale === "ar"
      ? "طلب منتج | جاهز"
      : "Request a Product | JAHEZ",
    customDescription: locale === "ar"
      ? "اطلب أي منتج من الصين أو أمريكا. املأ النموذج وسنرسل لك عرض سعر خلال ٢٤ ساعة."
      : "Request any product from China or the USA. Fill in the form and we'll send you a quote within 24 hours.",
  });
}

export default async function ProductRequestPage({ params }: PageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "المنتجات" : "Products", url: `/${locale}/products` },
    { name: isAr ? "طلب منتج" : "Request a Product", url: "" },
  ];

  const faqs = isAr
    ? [
        { q: "كم يستغرق الرد على طلبي؟", a: "نرد عادةً خلال ٢٤ ساعة مع عرض سعر." },
        { q: "هل يمكنني طلب منتجات متعددة؟", a: "نعم، يمكنك ذكرها في حقل الملاحظات الإضافية." },
      ]
    : [
        { q: "How long until I get a quote?", a: "We usually reply within 24 hours with pricing." },
        { q: "Can I request multiple products?", a: "Yes, mention them in the additional notes field." },
      ];

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <BreadcrumbSchema items={breadcrumbItems} />
      <FAQSchema faqs={faqs} />

      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 bg-linear-to-b from-muted/50 to-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#7b57fc] uppercase tracking-wide mb-3">
            {isAr ? "طلب منتج" : "Product Request"}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {isAr ? "اطلب منتجك من الصين أو أمريكا" : "Source Your Product from China or the USA"}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            {isAr
              ? "املأ النموذج أدناه وسنرسل لك أفضل الأسعار وخيارات الشحن خلال ٢٤ ساعة."
              : "Fill in the form below and we'll send you the best pricing and shipping options within 24 hours."}
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-background">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <Suspense fallback={null}>
            <ProductRequestForm isAr={isAr} locale={locale as "ar" | "en"} />
          </Suspense>
        </div>
      </section>

      <FooterHero />
      <FooterSection />
    </main>
  );
}
