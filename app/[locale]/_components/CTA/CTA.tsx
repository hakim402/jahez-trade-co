"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function CTA() {
  const t = useTranslations("CTA");

  return (
    <section className="relative py-24 overflow-hidden bg-white dark:bg-neutral-950">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-brand-pattern opacity-5" />

      {/* Gradient orbs for depth */}
      <div className="absolute top-20 left-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />
      <div className="absolute bottom-20 right-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />

      <div className="container relative mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="group relative bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Decorative hover line */}
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />

            <CardHeader className="text-center pb-2">
              {/* Small badge */}
              <span className="inline-block text-sm font-semibold tracking-wider uppercase text-brand mb-2">
                {t("badge")}
              </span>
              <CardTitle className="text-3xl md:text-4xl font-bold dark:text-white">
                {t("title")}{" "}
                <span className="text-brand">{t("titleHighlight")}</span>
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
                {t("description")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Button
                  asChild
                  size="lg"
                  className="bg-brand hover:bg-brand/90 text-white font-medium px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Link href="/contact">{t("primaryButton")}</Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-brand text-brand hover:bg-brand/5 font-medium px-8 py-6 text-lg transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Link href="#">{t("secondaryButton")}</Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-6 text-center">
                {t("footer")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}