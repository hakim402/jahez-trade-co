import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroHeader } from "../../_components/Header/HeroHeader";
import { ChevronRight, CirclePlay } from "lucide-react";
import Image from "next/image";
import Carousel from "../Carousel/carousel";

const productImages = [
  "/Products/item-1.png",
  "/Products/item-2.png",
  "/Products/item-3.png",
  "/Products/item-4.png",
];

export default function HeroSection() {
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
      <HeroHeader />
      <main className="overflow-hidden">
        <section className="bg-linear-to-b to-muted from-background">
          <div className="relative py-36">
            <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
              <div className="md:w-1/2">
                <div>
                  <h1 className="max-w-md text-balance text-5xl font-medium md:text-6xl">
                    Find the{" "}
                    <span className="text-gradient"> Right Product </span> from
                    China
                  </h1>

                  <p className="text-muted-foreground my-8 max-w-2xl text-balance text-xl">
                    We help you source products from China with real suppliers,
                    clear pricing, and quotes delivered within 24 hours.
                  </p>

                  <div className="flex items-center gap-3">
                    <Button asChild size="lg" className="pr-4.5 bg-color">
                      <Link href="#link">
                        <span className="text-nowrap">Start For Free</span>
                        <ChevronRight className="opacity-50" />
                      </Link>
                    </Button>
                    <Button
                      key={2}
                      asChild
                      size="lg"
                      variant="outline"
                      className="pl-5"
                    >
                      <Link href="#link">
                        <CirclePlay className="fill-primary/25 stroke-primary" />
                        <span className="text-nowrap">See How It Works</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="perspective-near mt-24 translate-x-12 md:absolute md:-right-6 md:bottom-16 md:left-1/2 md:top-40 md:mt-0 md:translate-x-0">
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
                    autoplayDelay={3000} // 3 seconds is more standard for hero carousels
                    showControls={false}
                    showDots={false}
                    showProgress={false}
                    effect="slide"
                    itemClassName="basis-full"
                    // Custom responsive controls
                    nextButton={
                      <div className="hidden sm:inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background transition-colors">
                        <span className="text-lg">❯</span>
                      </div>
                    }
                    prevButton={
                      <div className="hidden sm:inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background transition-colors">
                        <span className="text-lg">❮</span>
                      </div>
                    }
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
