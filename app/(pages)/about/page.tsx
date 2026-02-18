// app/about/page.tsx

import { Users, Globe, BadgeCheck, Clock, MessageSquare } from "lucide-react";
import FooterSection from "@/app/_components/Footer/FooterSection";
import { HeroHeader } from "@/app/_components/Header/HeroHeader";
import Pricing from "@/app/_components/Pricing/Pricing";
import CTA from "@/app/_components/CTA/CTA";
import CoreValues from "@/app/_components/Values/CoreValues";
import AboutHero from "./_components/AboutHero";
import MissionVision from "./_components/MissionVision";
import Features from "@/app/_components/Features/features";

export default function AboutPage() {
  const steps = [
    {
      number: "1",
      title: "Send Photo or Link",
      description: "Upload an image or paste a product link from any platform",
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      number: "2",
      title: "Research & Negotiation",
      description: "Our team negotiates with suppliers for the best price",
      icon: <Users className="w-6 h-6" />,
    },
    {
      number: "3",
      title: "Receive Price Quote",
      description: "Get competitive price within 24 hours",
      icon: <Clock className="w-6 h-6" />,
    },
    {
      number: "4",
      title: "Approve or Modify",
      description: "Customize branding, quality, and packaging as needed",
      icon: <BadgeCheck className="w-6 h-6" />,
    },
    {
      number: "5",
      title: "Production & Shipping",
      description: "Monitor production and track shipping to your country",
      icon: <Globe className="w-6 h-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <HeroHeader />
      {/* Hero Section */}
      <AboutHero />

      {/* Mission & Vision */}
      <MissionVision />

      {/* How It Works */}
      <Features />

      {/* Subscription Plans */}
      <Pricing />

      {/* Core Values */}
      <CoreValues />

      {/* CTA Section */}
      <CTA />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
