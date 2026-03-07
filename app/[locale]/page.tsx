// app/[locale]/page.tsx

import { Header } from "./_components/Header/Header";
import HeroSection from "./_components/Hero/HomeHero";
import FooterSection from "./_components/Footer/FooterSection";
import Pricing from "./_components/Pricing/Pricing";
import CTA from "./_components/CTA/CTA";
import Features from "./_components/Features/features";
import HomeHero from "./_components/Hero/HomeHero";
import StatsSection from "./_components/Stats/StatsSections";
import HowItWorksSection from "./_components/HowItWork/HowItWork";
import TestimonialsCarousel from "./_components/Testimonials/Testimonials";
import Testimonials from "./_components/Testimonials/Testimonials";
import FAQs from "./_components/FAQs/Faqs";


export default function Home() {
  return (
    <div>
      <Header />
      <HomeHero />
      <StatsSection />
      <Features />
      <HowItWorksSection />
      {/* <Pricing /> */}
      <Testimonials />
      <FAQs />
      <CTA />
      <FooterSection />
    </div>
  );
}
