import FooterSection from "@/app/[locale]/_components/Footer/FooterSection";
import { Header } from "@/app/[locale]/_components/Header/Header";
import Hero from "@/app/[locale]/_components/Hero/Hero";
import HowItWorks from "@/app/[locale]/_components/HowItWork/HowItWork";
import { Globe, Shield, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function RequestQuotePage() {
  const t = await getTranslations("RequestQuotePage.hero");

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
    <div className="min-h-screen">
      <Header />
      <Hero
        title={t("title")}
        highlight={t("highlight")}
        description={t("description")}
        badges={badges}
        primaryButton={{ label: t("primaryButton"), href: "/contact" }}
        secondaryButton={{ label: t("secondaryButton"), href: "#how-it-works" }}
      />
      <HowItWorks />
      <FooterSection />
    </div>
  );
}