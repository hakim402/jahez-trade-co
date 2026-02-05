import Image from "next/image";
import { HeroHeader } from "./_components/Header/HeroHeader";
import HeroSection from "./_components/Hero/HeroSection";
import Features from "./_components/Features/features";
import Integrations from "./_components/Integrations/integrations";
import StatsSection from "./_components/Stats/StatsSections";
import TeamSection from "./_components/Teams/TeamSection";
import FooterSection from "./_components/Footer/FooterSection";
import Pricing from "./_components/Pricing/Pricing";
import FAQs from "@/components/faqs-section-two";


export default function Home() {
  return (
    <div>
      <HeroHeader />
      <HeroSection />
      <Features />
      <Integrations />
      <Pricing />
      <StatsSection />
      <TeamSection />
      <FAQs />
      <FooterSection />
    </div>
  );
}
