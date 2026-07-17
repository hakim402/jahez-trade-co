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
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set()); // Track failed images

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

  // ✅ Helper: Handle image load errors gracefully
  const handleImageError = (url: string) => {
    console.error(`🖼️ Image failed to load: ${url}`);
    setImageErrors((prev) => new Set(prev).add(url));
    
    // Optional: Fallback to native <img> tag if Next.js optimizer fails
    // return <img src={url} alt="Fallback" className="object-cover" />;
  };

  return (
    <div className="my-8 space-y-6">
      {/* Hero image */}
      {primaryImage && !imageErrors.has(primaryImage.url) && (
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
              
              // ✅ FIX: Skip optimization for dynamic user uploads
              unoptimized={true}
              
              // ✅ FIX: Add error handler for debugging
              onError={() => handleImageError(primaryImage.url)}
            />
          </div>
        </div>
      )}
      
      {/* Fallback if primary image fails */}
      {primaryImage && imageErrors.has(primaryImage.url) && (
        <div className="relative rounded-xl overflow-hidden bg-muted/30 aspect-video flex items-center justify-center">
          <img
            src={primaryImage.url}
            alt={primaryImage.altText ?? post.title}
            className="object-cover w-full h-full"
            onError={(e) => {
              console.error("🖼️ Fallback image also failed:", primaryImage.url);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="text-muted-foreground text-sm">Image unavailable</span>
        </div>
      )}

      {/* Thumbnail gallery */}
      {otherImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {otherImages.map((img, idx) => {
            const originalIndex = images.indexOf(img);
            const hasError = imageErrors.has(img.url);
            
            return (
              <div
                key={img.id}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden bg-muted/20 cursor-pointer hover:opacity-80 transition",
                  hasError && "opacity-50"
                )}
                onClick={() => !hasError && openLightbox(originalIndex)}
              >
                {!hasError ? (
                  <Image
                    src={img.url}
                    alt={img.altText ?? post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    
                    // ✅ FIX: Skip optimization for dynamic uploads
                    unoptimized={true}
                    
                    // ✅ FIX: Track errors
                    onError={() => handleImageError(img.url)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                    Failed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className={cn(
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

          {images.length > 0 && !imageErrors.has(images[currentImageIndex]?.url) && (
            <div className="relative w-full h-full flex items-center justify-center bg-black/20">
              <div className="relative max-h-[85vh] max-w-full">
                <Image
                  src={images[currentImageIndex]?.url}
                  alt={images[currentImageIndex]?.altText ?? post.title}
                  width={1200}
                  height={800}
                  className="object-contain max-h-[85vh] w-auto"
                  
                  // ✅ FIX: Skip optimization in lightbox too
                  unoptimized={true}
                  
                  // ✅ FIX: Handle errors
                  onError={() => handleImageError(images[currentImageIndex]?.url)}
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
          
          {/* Fallback for lightbox image error */}
          {images.length > 0 && imageErrors.has(images[currentImageIndex]?.url) && (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <p>Image failed to load. <a href={images[currentImageIndex]?.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open directly</a></p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}