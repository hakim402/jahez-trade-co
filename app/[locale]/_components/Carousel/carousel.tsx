"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";

import {
  Carousel as ShadCarousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl"; // <-- import useLocale

interface CarouselProps {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
  opts?: EmblaOptionsType;

  // Controls
  showControls?: boolean;
  nextButton?: React.ReactNode;
  prevButton?: React.ReactNode;

  // Autoplay
  autoplay?: boolean;
  autoplayDelay?: number;

  // Dots
  showDots?: boolean;

  // Thumbnails
  thumbnails?: React.ReactNode[];

  // Progress bar
  showProgress?: boolean;

  // Effects
  effect?: "slide" | "fade" | "parallax";

  // Vertical
  vertical?: boolean;

  // External API
  onApiReady?: (api: EmblaCarouselType) => void;

  // Responsive slides
  itemClassName?: string;
}

export default function Carousel({
  children,
  className = "",
  opts,
  showControls = true,
  nextButton,
  prevButton,
  autoplay = true,
  autoplayDelay = 1000,
  showDots = false,
  thumbnails,
  showProgress = false,
  effect = "slide",
  vertical = false,
  onApiReady,
  itemClassName = "basis-full",
}: CarouselProps) {
  const locale = useLocale(); // Get current locale
  const isRTL = locale === 'ar';

  // Adjust direction in Embla options
  const emblaOptions: EmblaOptionsType = {
    axis: vertical ? "y" : "x",
    direction: isRTL ? 'rtl' : 'ltr', // <-- set RTL when Arabic
    ...opts,
  };

  // Autoplay plugin
  const autoplayPlugin = React.useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: true })
  );

  // Prepare plugins
  const plugins = React.useMemo(() => {
    const list: any[] = [];
    if (autoplay) list.push(autoplayPlugin.current);
    if (effect === "fade") list.push(Fade());
    return list;
  }, [autoplay, effect]);

  // State for Embla API
  const [emblaApi, setEmblaApi] = React.useState<EmblaCarouselType>();

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  // Setup event listeners when API is ready
  React.useEffect(() => {
    if (!emblaApi) return;

    onApiReady?.(emblaApi);
    setScrollSnaps(emblaApi.scrollSnapList());
    setSelectedIndex(emblaApi.selectedScrollSnap());

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    const onScroll = () => {
      setScrollProgress(emblaApi.scrollProgress());
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("scroll", onScroll);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("scroll", onScroll);
    };
  }, [emblaApi, onApiReady]);

  // Determine default previous/next symbols based on RTL
  const defaultPrev = isRTL ? "❯" : "❮";
  const defaultNext = isRTL ? "❮" : "❯";

  return (
    <div className={cn("relative", className)}>
      <ShadCarousel
        setApi={setEmblaApi} // Use shadcn's setApi to capture embla instance
        opts={emblaOptions} // Pass our options including direction
        plugins={plugins}
      >
        <CarouselContent
          className={cn(
            vertical ? "flex-col -mt-4" : "-ml-4",
            effect === "fade" && "ml-0"
          )}
        >
          {React.Children.map(children, (child, idx) => (
            <CarouselItem
              key={idx}
              className={cn(
                vertical ? "pt-4" : "pl-4",
                "shrink-0",
                itemClassName
              )}
              style={
                effect === "parallax"
                  ? {
                      transform: `translateX(${
                        (idx - selectedIndex) * scrollProgress * 50
                      }px)`,
                    }
                  : undefined
              }
            >
              {child}
            </CarouselItem>
          ))}
        </CarouselContent>

        {showControls && (
          <>
            <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer">
              {prevButton ?? defaultPrev}
            </CarouselPrevious>
            <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer">
              {nextButton ?? defaultNext}
            </CarouselNext>
          </>
        )}
      </ShadCarousel>

      {/* Progress Bar */}
      {showProgress && (
        <div className="mt-3 h-1 w-full bg-muted overflow-hidden rounded">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      )}

      {/* Dots */}
      {showDots && scrollSnaps.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {scrollSnaps.map((_, index) => (
            <Button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "h-0 w-0 rounded-full transition-all",
                index === selectedIndex ? "bg-color w-1" : "bg-muted"
              )}
            />
          ))}
        </div>
      )}

      {/* Thumbnails */}
      {thumbnails && thumbnails.length > 0 && (
        <div className="mt-4 flex gap-2 justify-center">
          {thumbnails.map((thumb, index) => (
            <Button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "border rounded overflow-hidden opacity-60",
                index === selectedIndex && "opacity-100 ring-2 ring-primary"
              )}
            >
              {thumb}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}