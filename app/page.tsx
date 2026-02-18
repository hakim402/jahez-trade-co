// app/page.tsx

import { HeroHeader } from "./_components/Header/HeroHeader";
import HeroSection from "./_components/Hero/HeroSection";
import TeamSection from "./_components/Teams/TeamSection";
import FooterSection from "./_components/Footer/FooterSection";
import Pricing from "./_components/Pricing/Pricing";
import FAQs from "@/components/faqs-section-two";
import CTA from "./_components/CTA/CTA";
import Features from "./_components/Features/features";


export default function Home() {
  return (
    <div>
      <HeroHeader />
      <HeroSection />
      <Features />
      <Pricing />
      <TeamSection />
      <FAQs />
      <CTA />
      <FooterSection />
    </div>
  );
}
