import { Globe, Shield, Zap } from "lucide-react";
import { Header } from "@/app/[locale]/_components/Header/Header";
import Hero from "@/app/[locale]/_components/Hero/Hero";
import FooterSection from "@/app/[locale]/_components/Footer/FooterSection";
import ContactCard from "./_components/ContactCard";
import ContactForm from "./_components/ContactForm";
import ContactMap from "./_components/ContactMap";
import CTA from "@/app/[locale]/_components/CTA/CTA";
import StatsSection from "@/app/[locale]/_components/Stats/StatsSections";
import { getTranslations } from "next-intl/server";

export default async function ContactPage() {
  const t = await getTranslations("ContactPage.hero");

  const badges = [
    {
      label: t("badges.verified"),
      icon: <Shield className="w-4 h-4 mr-2 text-brand" />,
    },
    {
      label: t("badges.fastShipping"),
      icon: <Zap className="w-4 h-4 mr-2 text-brand" />,
    },
    {
      label: t("badges.globalSourcing"),
      icon: <Globe className="w-4 h-4 mr-2 text-brand" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 relative overflow-hidden">
      <Header />

      <Hero
        title={t("title")}
        highlight={t("highlight")}
        description={t("description")}
        badges={badges}
        primaryButton={{ label: t("primaryButton"), href: "/about" }}
        secondaryButton={{ label: t("secondaryButton"), href: "#how-it-works" }}
        image={"/hero/hero.png"}
      />

      <div className="mx-auto md:max-w-7xl md:px-6 relative z-10">
        <ContactMap />
        <div className="grid lg:grid-cols-2 gap-12 items-start py-16">
          <div className="space-y-8">
            <ContactCard />
          </div>
          <div>
            <ContactForm />
          </div>
        </div>
      </div>

      <StatsSection />
      <CTA />
      <FooterSection />
    </div>
  );
}