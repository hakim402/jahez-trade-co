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

export const metadata: Metadata = {
  title: "About Us | من نحن",
  description:
    "Learn how Mewan connects businesses in Saudi Arabia, Yemen, UAE and beyond with trusted suppliers in China and the USA.",
};

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
