// app/[locale]/page.tsx

import { Header } from "./_components/Header/Header";
import Pricing from "./_components/Pricing/Pricing";
import { FeatureSections } from "./_components/Features/FeaturesSection";
import { VideoBookingSections } from "./_components/Features/VideoBookingSection";
import { HomeHero } from "./_components/Hero/HomeHero";
import { HowItWorks } from "./_components/HowItWork/HowItWorks";
import { FooterSection } from "./_components/Footer/FooterSection";
import { TrendingProductsSection } from "./(pages)/products/_components/TrendingProductsSection";
import { FooterHero } from "./_components/Footer/FooterHero";
import { HowWeOperate } from "./(pages)/about/_components/HowWeOperate";
import { getLocale } from "next-intl/server";
import { MissionValues } from "./(pages)/about/_components/MissionValues";

export default async function Home() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return (
    <div>
      <Header />
      <HomeHero />
      <TrendingProductsSection />
      <FeatureSections />
      <HowWeOperate isAr={isAr} locale={locale} />
      <VideoBookingSections />
      <MissionValues isAr={isAr} />
      <HowItWorks />
      {/* <Pricing /> */}
      <FooterHero />
      <FooterSection />
    </div>
  );
}
