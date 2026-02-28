import { Globe, Shield, Zap } from "lucide-react";
import FooterSection from "@/app/[locale]/_components/Footer/FooterSection";
import { Header } from "@/app/[locale]/_components/Header/Header";
import Pricing from "@/app/[locale]/_components/Pricing/Pricing";
import CTA from "@/app/[locale]/_components/CTA/CTA";
import MissionVision from "./_components/MissionVision";
import Features from "@/app/[locale]/_components/Features/features";
import Hero from "@/app/[locale]/_components/Hero/Hero";
import Testimonials from "@/app/[locale]/_components/Testimonials/Testimonials";
import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("AboutPage.hero");

  const badges = [
    {
      label: t("badges.verified"),
      icon: <Shield className="w-4 h-4 mr-2 text-blue-500" />,
    },
    {
      label: t("badges.fastShipping"),
      icon: <Zap className="w-4 h-4 mr-2 text-purple-500" />,
    },
    {
      label: t("badges.globalSourcing"),
      icon: <Globe className="w-4 h-4 mr-2 text-indigo-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <Header />

      <Hero
        title={t("title")}
        highlight={t("highlight")}
        description={t("description")}
        badges={badges}
        primaryButton={{ label: t("primaryButton"), href: "/contact" }}
        secondaryButton={{ label: t("secondaryButton"), href: "#how-it-works" }}
      />

      <MissionVision />
      <Features />
      <Pricing />
      <Testimonials />
      <CTA />
      <FooterSection />
    </div>
  );
}