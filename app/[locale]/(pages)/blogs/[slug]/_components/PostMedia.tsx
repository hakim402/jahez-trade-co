// app/[locale]/(pages)/blogs/[slug]/_components/PostMedia.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PublicPostDetail } from "../../actions";
import { cn } from "@/lib/utils";

interface PostMediaProps {
  post: PublicPostDetail;
  isAr: boolean;
}

export function PostMedia({ post, isAr }: PostMediaProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = post.images ?? [];
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0];
  const otherImages = images.filter((img) => img.id !== primaryImage?.id);

  if (!images.length) return null;

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="my-8 space-y-6">
      {/* Hero image */}
      {primaryImage && (
        <div className="relative rounded-xl overflow-hidden bg-muted/30">
          <div className="relative aspect-video w-full">
            <Image
              src={primaryImage.url}
              alt={primaryImage.altText ?? post.title}
              fill
              className="object-cover cursor-pointer"
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              onClick={() => openLightbox(images.indexOf(primaryImage))}
            />
          </div>
        </div>
      )}

      {/* Thumbnail gallery */}
      {otherImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {otherImages.map((img, idx) => {
            const originalIndex = images.indexOf(img);
            return (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted/20 cursor-pointer hover:opacity-80 transition"
                onClick={() => openLightbox(originalIndex)}
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Dialog with hidden title */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent  className={cn(
                  "w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0",
                  "[&>button:last-child]:hidden",
                )}>
          <VisuallyHidden>
            <DialogTitle>
              Image {currentImageIndex + 1} of {images.length}
            </DialogTitle>
          </VisuallyHidden>

          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" />
          </button>

          {images.length > 0 && (
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="relative max-h-[85vh] max-w-full">
                <Image
                  src={images[currentImageIndex]?.url}
                  alt={images[currentImageIndex]?.altText ?? post.title}
                  width={1200}
                  height={800}
                  className="object-contain max-h-[85vh] w-auto"
                />
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
