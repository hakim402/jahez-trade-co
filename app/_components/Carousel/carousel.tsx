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
  const autoplayPlugin = React.useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: true }),
  );

  const plugins = React.useMemo(() => {
    const list: any[] = [];
    if (autoplay) list.push(autoplayPlugin.current);
    if (effect === "fade") list.push(Fade());
    return list;
  }, [autoplay, effect]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      axis: vertical ? "y" : "x",
      ...opts,
    },
    plugins,
  );

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
  const [scrollProgress, setScrollProgress] = React.useState(0);

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

  return (
    <div className={cn("relative", className)}>
      <ShadCarousel
        ref={emblaRef}
        opts={opts}
        plugins={[
          Autoplay({
            delay: 2000,
          }),
        ]}
      >
        <CarouselContent
          className={cn(
            vertical ? "flex-col -mt-4" : "-ml-4",
            effect === "fade" && "ml-0",
          )}
        >
          {React.Children.map(children, (child, idx) => (
            <CarouselItem
              key={idx}
              className={cn(
                vertical ? "pt-4" : "pl-4",
                "shrink-0",
                itemClassName,
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
              {prevButton ?? "❮"}
            </CarouselPrevious>
            <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer">
              {nextButton ?? "❯"}
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
                "h-2 w-2 rounded-full transition-all",
                index === selectedIndex ? "bg-primary w-4" : "bg-muted",
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
                index === selectedIndex && "opacity-100 ring-2 ring-primary",
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
