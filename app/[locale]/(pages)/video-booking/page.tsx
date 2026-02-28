import { Header } from "@/app/[locale]/_components/Header/Header";
import FooterSection from "@/app/[locale]/_components/Footer/FooterSection";
import Hero from "@/app/[locale]/_components/Hero/Hero";
import { Globe, Shield, Zap } from "lucide-react";
import VideoCallTeaser from "./_components/VideoCallTeaser";
import VideoCallFeatures from "./_components/VideoCallFeatures";
import HowVideoCallWorks from "./_components/HowVideoCallWorks";
import { useTranslations } from "next-intl";

export default function VideoBookingPage() {
  const t = useTranslations("VideoBookingPage");


   const badges = [
    {
      label: t("badges.0.label"), // "Verified Suppliers"
      icon: <Shield className="w-4 h-4 mr-2 text-brand" />,
    },
    {
      label: t("badges.1.label"), // "Fast Shipping"
      icon: <Zap className="w-4 h-4 mr-2 text-brand" />,
    },
    {
      label: t("badges.2.label"), // "Global Sourcing"
      icon: <Globe className="w-4 h-4 mr-2 text-brand" />,
    },
  ];


  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 relative overflow-hidden">
      {/* Background pattern and orbs */}
      <div className="absolute inset-0 bg-brand-pattern opacity-5 pointer-events-none" />
      <div className="absolute top-20 left-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-20 right-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply pointer-events-none" />

      <Header />

      {/* Hero Section */}
      <Hero
        title={t("hero.title")}
        highlight={t("hero.highlight")}
        description={t("hero.description")}
        badges={badges}
        primaryButton={{
          label: t("hero.primaryButton"),
          href: "#",
        }}
        secondaryButton={{
          label: t("hero.secondaryButton"),
          href: "#how-it-works",
        }}
        image="/hero/video-booking.png"
      />
      <VideoCallFeatures />
      <HowVideoCallWorks />
      <VideoCallTeaser />
      <FooterSection />
    </div>
  );
}
