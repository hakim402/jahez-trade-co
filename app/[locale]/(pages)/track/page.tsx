// app/[locale]/(pages)/track/page.tsx

import type { Metadata } from "next";
import { Header } from "../../_components/Header/Header";
import { FooterHero } from "../../_components/Footer/FooterHero";
import { FooterSection } from "../../_components/Footer/FooterSection";
import { TrackSearchForm } from "./_components/TrackSearchForm";

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
    pageType: "track",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
    pathSegment: "track",
  });
}

export default async function TrackPage({ params }: PageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "تتبع الشحنات" : "Track Shipment", url: "" },
  ];

  const faqs = isAr
    ? [
        { q: "كيف أتتبع شحنتي؟", a: "أدخل رمز التتبع المرسل إليك عبر البريد أو الواتساب في الحقل أعلاه." },
        { q: "كم مرة يتم تحديث حالة الشحنة؟", a: "يتم تحديث الحالة فور حدوث أي تغيير في مسار الشحنة." },
      ]
    : [
        { q: "How do I track my shipment?", a: "Enter the tracking code sent to you via email or WhatsApp in the field above." },
        { q: "How often is the status updated?", a: "The status updates in real time whenever there's a change in your shipment's journey." },
      ];

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* ─── SCHEMA MARKUP ─────────────────────── */}
      <BreadcrumbSchema items={breadcrumbItems} />
      <FAQSchema faqs={faqs} />
      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#7b57fc]/10 px-4 py-1.5 text-sm font-medium text-[#7b57fc]">
          {isAr ? "تتبع الشحنات" : "Shipment Tracking"}
        </div>
        <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
          {isAr ? "تتبع شحنتك مباشرة" : "Track your shipment in real time"}
        </h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          {isAr
            ? "أدخل رمز التتبع الموجود في فاتورتك أو رسالة الواتساب لمعرفة آخر تحديث على شحنتك."
            : "Enter the tracking code from your invoice or WhatsApp message to see the latest update on your shipment."}
        </p>
        <TrackSearchForm locale={locale} />
      </section>
      <FooterHero />
      <FooterSection />
    </main>
  );
}
