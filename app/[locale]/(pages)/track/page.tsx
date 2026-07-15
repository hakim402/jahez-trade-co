// app/[locale]/(pages)/track/page.tsx

import type { Metadata } from "next";
import { Header } from "../../_components/Header/Header";
import { FooterHero } from "../../_components/Footer/FooterHero";
import { FooterSection } from "../../_components/Footer/FooterSection";
import { TrackSearchForm } from "./_components/TrackSearchForm";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "تتبع شحنتك | جاهز" : "Track Your Shipment | JAHEZ Trade Co.",
    description: isAr
      ? "أدخل رمز التتبع لمعرفة حالة شحنتك من الصين إلى اليمن أو الإمارات أو أمريكا."
      : "Enter your tracking code to see the live status of your shipment from China to Yemen, UAE, or the USA.",
  };
}

export default async function TrackPage({ params }: PageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
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
