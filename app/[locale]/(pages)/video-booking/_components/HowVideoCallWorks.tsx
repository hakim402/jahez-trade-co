"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function HowVideoCallWorks() {
  const t = useTranslations("VideoBookingPage.howItWorks");

  // Use t.raw to get the steps array (assuming it's a plain array)
  const steps = t.raw("steps") as Array<{ title: string; description: string }>;

  return (
    <section className="relative py-24 overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0 bg-brand-pattern opacity-5" />
      <div className="absolute top-20 right-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />
      <div className="absolute bottom-20 left-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />

      <div className="container relative mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold tracking-wider uppercase text-brand">
            {t("subtitle")}
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold dark:text-white">
            {t("title")} <span className="text-brand">{t("titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">{t("description")}</p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-24.5 left-0 right-0 h-0.5 bg-color" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <div className="relative p-6 bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 z-10">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full orb-brand transition-opacity group-hover:opacity-30" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                      <span className="text-2xl font-bold text-brand">
                        {`0${index + 1}`}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-3 w-2 h-2 rounded-full bg-brand z-20" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/how-it-works" passHref>
            <Button
              variant="outline"
              size="lg"
              className="group border-2 border-brand text-brand hover:bg-brand/5"
            >
              {t("cta")}
              <ArrowRight className="h-4 w-4 ml-2 text-brand transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}