"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "../Header/Header";
import { ChevronRight, CirclePlay } from "lucide-react";
import Image from "next/image";
import Carousel from "../Carousel/carousel";
import { useTranslations, useLocale } from "next-intl";

const productImages = [
  "/Products/product-1.png",
  "/Products/product-2.png",
  "/Products/product-3.png",
  "/Products/product-4.png",
];

export default function HomeHero() {
  const t = useTranslations("HomeHero");
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const slides = productImages.map((src, index) => (
    <div
      key={`slide-${index}`}
      className="relative h-50 sm:h-62.5 md:h-75 lg:h-87.5 xl:h-100 w-full flex items-center justify-center"
    >
      <Image
        src={src}
        alt={`Product ${index + 1}`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 75vw, (max-width: 1024px) 60vw, 50vw"
        className="object-contain p-4 sm:p-6 md:p-8"
        priority={index === 0}
      />
    </div>
  ));

  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <section className="relative overflow-hidden bg-linear-to-b from-background to-muted">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/30">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 dark:opacity-20" />
            {/* Floating shapes */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-blob" />
            <div className="absolute top-40 right-10 w-80 h-80 bg-linear-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-linear-to-r from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-blob animation-delay-4000" />
          </div>
          <div className="relative py-36">
            <div className="relative mx-auto w-full max-w-5xl px-6">
              <div className="md:w-1/2">
                <div>
                  <h1 className="max-w-md text-balance text-5xl font-medium md:text-6xl z-10">
                    {t("title")}{" "}
                    <span className="text-color">{t("titleHighlight")}</span>{" "}
                    {t("titleSuffix")}
                  </h1>

                  <p className="text-muted-foreground my-8 max-w-2xl text-balance text-xl">
                    {t("subtitle")}
                  </p>

                  <div className="flex items-center gap-3">
                    <Button
                      asChild
                      size="lg"
                      className="bg-color hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg px-8"
                    >
                      <Link href="#link">
                        <span className="text-nowrap">{t("startForFree")}</span>
                        <ChevronRight className="opacity-50" />
                      </Link>
                    </Button>
                    <Button
                      key={2}
                      asChild
                      size="lg"
                      variant="outline"
                      className="border-2 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-8"
                    >
                      <Link href="#link">
                        <CirclePlay className="fill-primary/25 stroke-primary" />
                        <span className="text-nowrap">{t("seeHowItWorks")}</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel container with conditional positioning for RTL */}
            <div
              className={`perspective-near mt-24 translate-x-12 md:absolute md:bottom-16 md:top-40 md:mt-0 md:translate-x-0 ${
                isRTL
                  ? 'md:right-1/2 md:-left-6'
                  : 'md:-right-6 md:left-1/2'
              }`}
            >
              <div className="before:border-foreground/5 before:bg-foreground/5 relative h-full before:absolute before:-inset-x-4 before:bottom-7 before:top-0 before:skew-x-6 before:rounded-[calc(var(--radius)+1rem)] before:border">
                <div className="bg-background rounded-lg shadow-foreground/10 ring-foreground/5 relative h-full -translate-y-12 skew-x-6 overflow-hidden border border-transparent shadow-md ring-1">
                  <Carousel
                    className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto"
                    opts={{
                      loop: true,
                      duration: 30,
                      startIndex: 0,
                      containScroll: "trimSnaps",
                      watchResize: true,
                      breakpoints: {
                        "(min-width: 640px)": { dragFree: false },
                        "(min-width: 768px)": { dragFree: false },
                      },
                    }}
                    autoplay={true}
                    autoplayDelay={3000}
                    showControls={false}
                    showDots={false}
                    showProgress={false}
                    effect="slide"
                    itemClassName="basis-full"
                  >
                    {slides}
                  </Carousel>

                  {/* Mobile indicator dots */}
                  <div className="sm:hidden flex justify-center gap-1.5 mt-4 pb-2">
                    {slides.map((_, index) => (
                      <div
                        key={index}
                        className="w-1.5 h-1.5 rounded-full bg-muted"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}