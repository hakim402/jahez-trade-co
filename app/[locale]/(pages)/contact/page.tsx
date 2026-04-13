// app/[locale]/contact/page.tsx
import { getLocale } from "next-intl/server";
import { ContactHero } from "./_components/ContactHero";
import { ContactForm } from "./_components/ContactForm";
import { ContactMap } from "./_components/ContactMap";
import { ContactInfo } from "./_components/ContactInfo";
import type { Metadata } from "next";
import { Header } from "../../_components/Header/Header";
import { FooterHero } from "../../_components/Footer/FooterHero";
import { FooterSection } from "../../_components/Footer/FooterSection";
import { routing } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const baseUrl = "https://jahez.online";

  const title = isAr ? "اتصل بنا | جاهز" : "Contact Us | JAHEZ";
  const description = isAr
    ? "تواصل مع فريق جاهز لطلبات توريد المنتجات، حجز الفيديو كول، أو الاستشارات التجارية."
    : "Get in touch with the JAHEZ team for product sourcing, video bookings, or business consulting.";

  const alternates = {
    canonical: `${baseUrl}/${locale}/contact`,
    languages: {
      en: `${baseUrl}/en/contact`,
      ar: `${baseUrl}/ar/contact`,
    },
  };

  const ogImage = {
    url: `${baseUrl}/images/contact-og.jpg`,
    width: 1200,
    height: 630,
    alt: isAr ? "اتصل بجاهز" : "Contact JAHEZ",
  };

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/contact`,
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

export default async function ContactPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <ContactHero isAr={isAr} locale={locale} />

      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 pb-20">
            {/* Left — contact info + map */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <ContactInfo isAr={isAr} locale={locale} />
              {/* <ContactMap isAr={isAr} /> */}
            </div>

            {/* Right — form */}
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