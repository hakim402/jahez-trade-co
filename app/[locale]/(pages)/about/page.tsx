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

// ─── SEO IMPORTS ─────────────────────────────
import { generatePageMetadata } from "@/lib/seo/metadata";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

interface PageProps {
  params: Promise<{ locale: string }>;
}

// ─── SIMPLIFIED METADATA ─────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({
    pageType: "about",
    locale: locale as "en" | "ar",
    country: "GLOBAL",
    pathSegment: "about",
  });
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  // Breadcrumb items
  const breadcrumbItems = [
    { name: isAr ? "الرئيسية" : "Home", url: `/${locale}` },
    { name: isAr ? "من نحن" : "About", url: `/${locale}/about` },
  ];

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* ─── SCHEMA MARKUP ─────────────────────── */}
      <BreadcrumbSchema items={breadcrumbItems} />

      <AboutHero isAr={isAr} locale={locale} />
      <MissionValues isAr={isAr} />
      <TeamPresence isAr={isAr} />
      <HowWeOperate isAr={isAr} locale={locale} />
      <FooterHero />
      <FooterSection />
    </main>
  );
}