import { Card } from "@/components/ui/card";
import * as React from "react";
import {
  MdOutlineBrandingWatermark,
  MdOutlineSubscriptions,
  MdImageSearch,
} from "react-icons/md";
import { CiImport } from "react-icons/ci";
import { BsChatQuote } from "react-icons/bs";
import { SiMarketo } from "react-icons/si";
import { getTranslations } from "next-intl/server";

export default async function Features() {
  const t = await getTranslations("Features");

  // Map icons to each item (order matches the translation items)
  const icons = [
    MdImageSearch,
    BsChatQuote,
    SiMarketo,
    MdOutlineBrandingWatermark,
    CiImport,
    MdOutlineSubscriptions,
  ];

  return (
    <section className="relative py-24 overflow-hidden bg-white dark:bg-neutral-950">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-brand-pattern opacity-5" />

      {/* Gradient orbs for depth */}
      <div className="absolute top-20 left-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />
      <div className="absolute bottom-20 right-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />

      <div className="container relative mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <span className="text-sm font-semibold tracking-wider uppercase text-brand">
            {t("section.subtitle")}
          </span>
          <h2 className="mt-2 text-balance text-3xl font-semibold md:text-5xl dark:text-white">
            {t("section.title")} <br />
            <span className="text-brand">{t("section.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            {t("section.description")}
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {icons.map((Icon, index) => (
            <FeatureCard
              key={index}
              icon={Icon}
              title={t(`items.${index}.title`)}
              description={t(`items.${index}.description`)}
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
      {/* Icon with glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full orb-brand transition-opacity group-hover:opacity-30" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <Icon className="h-8 w-8 text-brand transition-transform group-hover:scale-110" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>

      {/* Decorative hover line */}
      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
    </Card>
  );
}
