"use client";

// app/[locale]/(pages)/products/_components/ProductGallery.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, ZoomIn, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type GalleryImage = {
  url: string;
  isPrimary: boolean;
  altText: string | null;
};

interface ProductGalleryProps {
  images: GalleryImage[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center">
        <Package className="w-16 h-16 text-muted-foreground/20" />
      </div>
    );
  }

  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
  const next = () => setActive((a) => (a + 1) % images.length);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative rounded-2xl overflow-hidden bg-muted/20 border border-border/50 aspect-square group">
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={images[active].url}
            alt={images[active].altText ?? name}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Zoom button */}
        <Button
          variant={"ghost"}
          onClick={() => setLightbox(true)}
          className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>

        {/* Arrows — only if multiple images */}
        {images.length > 1 && (
          <>
            <Button
              variant={"ghost"}
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={"ghost"}
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-sm border border-border/40 text-muted-foreground tabular-nums">
            {active + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                i === active
                  ? "border-[#7b57fc] shadow-sm shadow-[#7b57fc]/20"
                  : "border-border/50 hover:border-border",
              )}
            >
              <img
                src={img.url}
                alt={img.altText ?? ""}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <motion.img
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              src={images[active].url}
              alt={images[active].altText ?? name}
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
