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

export default function Home() {
  return (
    <div>
      <Header />
      <HomeHero />
      <TrendingProductsSection />
      <FeatureSections />
      <VideoBookingSections />
      <HowItWorks />
      {/* <Pricing /> */}
      <FooterHero />
      <FooterSection />
    </div>
  );
}
