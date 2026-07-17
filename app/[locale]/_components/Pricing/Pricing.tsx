import { PricingTable } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";

export default async function Pricing() {
  const t = await getTranslations("Pricing");

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

        {/* Clerk PricingTable with custom appearance */}
        <PricingTable />

        {/* Additional trust indicator */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            {t("footer")}
          </p>
        </div>
      </div>
    </section>
  );
}