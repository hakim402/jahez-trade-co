// app/[locale]/(pages)/bookings/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import { VideoBookingForm } from "./_components/VideoBookingForm";
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({
    pageType: "bookings",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
    pathSegment: "bookings",
    customTitle: locale === "ar"
      ? "احجز جلسة فيديو | جاهز"
      : "Book a Video Session | JAHEZ",
    customDescription: locale === "ar"
      ? "احجز جلسة فيديو مباشرة مع خبرائنا في الصين. جولات سوق، زيارات مصانع، واستشارات مخصصة."
      : "Book a live video session with our experts in China. Market tours, factory visits, and custom consultations.",
  });
}

export default async function BookingsPage({ params }: PageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "حجز جلسة" : "Book a Session", url: "" },
  ];

  const faqs = isAr
    ? [
        { q: "كيف تعمل جلسات الفيديو؟", a: "بعد الحجز، سنتواصل معك لتأكيد الموعد وإرسال رابط الجلسة." },
        { q: "كم تكلفة الجلسة؟", a: "تختلف التكلفة حسب نوع الجلسة. سنرسل لك التفاصيل بعد مراجعة طلبك." },
        { q: "هل يمكنني إلغاء الحجز؟", a: "نعم، يمكنك إلغاء الحجز قبل موعده بـ ٢٤ ساعة." },
      ]
    : [
        { q: "How do video sessions work?", a: "After booking, we'll contact you to confirm the time and send you the session link." },
        { q: "How much does a session cost?", a: "Cost varies by session type. We'll send you details after reviewing your request." },
        { q: "Can I cancel my booking?", a: "Yes, you can cancel up to 24 hours before the scheduled time." },
      ];

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <BreadcrumbSchema items={breadcrumbItems} />
      <FAQSchema faqs={faqs} />

      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 bg-linear-to-b from-muted/50 to-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#7b57fc] uppercase tracking-wide mb-3">
            {isAr ? "حجز جلسة فيديو" : "Video Session Booking"}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {isAr ? "احجز جلسة مباشرة مع خبرائنا" : "Book a Live Session with Our Experts"}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            {isAr
              ? "جولات سوق مباشرة، زيارات مصانع، واستشارات تجارية مخصصة عبر الفيديو."
              : "Live market tours, factory visits, and custom business consultations via video."}
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-background">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <Suspense fallback={null}>
            <VideoBookingForm isAr={isAr} locale={locale as "ar" | "en"} />
          </Suspense>
        </div>
      </section>

      <FooterHero />
      <FooterSection />
    </main>
  );
}
