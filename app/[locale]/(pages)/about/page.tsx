// app/[locale]/(pages)/about/page.tsx

import { getLocale } from "next-intl/server";
import { AboutHero } from "./_components/AboutHero";
import { MissionValues } from "./_components/MissionValues";
import { HowWeOperate } from "./_components/HowWeOperate";
import { TeamPresence } from "./_components/TeamPresence";
import type { Metadata } from "next";
import { Header } from "../../_components/Header/Header";
import { FooterSection } from "../../_components/Footer/FooterSection";
import { FooterHero } from "../../_components/Footer/FooterHero";
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

  const title = isAr ? "من نحن | جاهز" : "About Us | JAHEZ TRADE CO";
  const description = isAr
    ? "تعرف على جاهز – منصتك الموثوقة لربط الشركات في السعودية، اليمن، الإمارات وغيرها بموردين موثوقين في الصين والولايات المتحدة."
    : "Learn how JAHEZ TRADE CO connects businesses in Saudi Arabia, Yemen, UAE and beyond with trusted suppliers in China and the USA.";

  const alternates = {
    canonical: `${baseUrl}/${locale}/about`,
    languages: {
      en: `${baseUrl}/en/about`,
      ar: `${baseUrl}/ar/about`,
    },
  };

  const ogImage = {
    url: `${baseUrl}/images/about-og.jpg`,
    width: 1200,
    height: 630,
    alt: isAr ? "تعرف على جاهز" : "About JAHEZ TRADE CO",
  };

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/about`,
      siteName: isAr ? "جاهز" : "JAHEZ TRADE CO",
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

export default async function AboutPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <AboutHero isAr={isAr} locale={locale} />
      <MissionValues isAr={isAr} />
      <TeamPresence isAr={isAr} />
      <HowWeOperate isAr={isAr} locale={locale} />
      <FooterHero />
      <FooterSection />
    </main>
  );
}