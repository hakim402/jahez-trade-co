"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Video, Globe, Shield, Clock, Users, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

const iconMap = {
  Video,
  Globe,
  Shield,
  Clock,
  Users,
  TrendingUp,
};

export default function VideoCallFeatures() {
  const t = useTranslations("VideoBookingPage.features");

  // Get the features array from translations
  const features = t.raw("items") as Array<{ title: string; description: string }>;

  // Icons are static – we map them to each item in order
  const icons = [Video, Globe, Shield, Clock, Users, TrendingUp];

  return (
    <section className="relative py-24 overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0 bg-brand-pattern opacity-5" />
      <div className="absolute top-20 left-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />
      <div className="absolute bottom-20 right-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />

      <div className="container relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <span className="text-sm font-semibold tracking-wider uppercase text-brand">
            {t("subtitle")}
          </span>
          <h2 className="mt-2 text-balance text-3xl font-semibold md:text-5xl dark:text-white">
            {t("title")} <br />
            <span className="text-brand">{t("titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">{t("description")}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={icons[index]}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card className="group relative p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 bg-background/80 backdrop-blur-sm dark:bg-neutral-900/50 overflow-hidden">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full orb-brand transition-opacity group-hover:opacity-30" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <Icon className="h-8 w-8 text-brand transition-transform group-hover:scale-110" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
    </Card>
  );
}