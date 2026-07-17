"use client";

// app/[locale]/(pages)/products/_components/ProductCard.tsx

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { Star, Package, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { RequestProductButton } from "./RequestProductDialog";
import { getProductHref } from "../_lib/product-url";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import SA from "country-flag-icons/react/3x2/SA";
import AE from "country-flag-icons/react/3x2/AE";
import YE from "country-flag-icons/react/3x2/YE";

// ─── Type ─────────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string | null;
  shortDesc: string | null;
  shortDescAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  estimatedPrice: number | null;
  currency: string;
  category: string | null;
  categoryAr: string | null;
  trendScore: number;
  viewCount: number;
  isFeatured: boolean;
  tags: string[];
  sourceCountry: string | null;
  sourceUrl: string | null;
  supplier: string | null;
  images: { url: string; isPrimary: boolean; altText: string | null }[];
};

// Map country code to SVG flag component
const COUNTRY_FLAG_COMPONENT: Record<string, React.ElementType> = {
  CN,
  US,
  SA,
  AE,
  YE,
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  isAr: boolean;
  index: number;
  featured?: boolean;
}

export function ProductCard({
  product,
  isAr,
  index,
  featured,
}: ProductCardProps) {
  const params = useParams();
  const locale = params.locale as string;
  const href = getProductHref(product, locale);
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const name = isAr && product.nameAr ? product.nameAr : product.name;
  const desc =
    isAr && product.shortDescAr ? product.shortDescAr : product.shortDesc;
  const cat =
    isAr && product.categoryAr ? product.categoryAr : product.category;

  const trendBadge =
    product.trendScore >= 80
      ? {
          label: isAr ? "ساخن" : "Hot",
          cls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        }
      : product.trendScore >= 60
        ? {
            label: isAr ? "رائج" : "Rising",
            cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
          }
        : null;

  // Get the flag component if country code exists
  const FlagComponent = product.sourceCountry
    ? COUNTRY_FLAG_COMPONENT[product.sourceCountry]
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group"
    >
      <div
        className={cn(
          "relative flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden h-full",
          "transition-all duration-300 hover:border-[#7b57fc]/40 hover:shadow-lg hover:shadow-[#7b57fc]/5 hover:-translate-y-1",
          featured && "ring-1 ring-[#7b57fc]/20",
        )}
      >
        {/* ── Clickable area: image + info ── */}
        <Link href={href} className="flex flex-col flex-1">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-muted/30">
            {primary ? (
              <img
                src={primary.url}
                alt={primary.altText ?? name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-10 h-10 text-muted-foreground/20" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
              {product.isFeatured && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7b57fc] text-white shadow-sm">
                  <Star className="w-2.5 h-2.5" />
                  {isAr ? "مميز" : "Featured"}
                </span>
              )}
              {trendBadge && (
                <span
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                    trendBadge.cls,
                  )}
                >
                  {trendBadge.label}
                </span>
              )}
            </div>

            {/* Country flag (SVG) */}
            {FlagComponent && (
              <div className="absolute top-2.5 right-2.5">
                <FlagComponent className="w-5 h-5 rounded-full shadow-sm" />
              </div>
            )}

            {/* Hover arrow */}
            <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-[#7b57fc] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
              <ArrowUpRight className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Info */}
          <div
            className={cn(
              "flex flex-col gap-1.5 p-3.5 flex-1",
              isAr && "text-right",
            )}
            dir={isAr ? "rtl" : "ltr"}
          >
            {cat && (
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wide font-medium">
                {cat}
              </span>
            )}

            <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 flex-1">
              {name}
            </h3>

            {desc && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {desc}
              </p>
            )}

            {/* Price row */}
            <div
              className={cn(
                "flex items-center justify-between pt-1",
                isAr && "flex-row-reverse",
              )}
            >
              {product.estimatedPrice !== null ? (
                <span className="text-sm font-bold text-[#7b57fc] tabular-nums">
                  {product.estimatedPrice.toLocaleString()} {product.currency}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground/60">
                  {isAr ? "تواصل للسعر" : "Contact for price"}
                </span>
              )}

              {product.trendScore > 0 && (
                <div className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background:
                        product.trendScore >= 80
                          ? "#ef4444"
                          : product.trendScore >= 60
                            ? "#f97316"
                            : product.trendScore >= 40
                              ? "#f59e0b"
                              : "var(--muted-foreground)",
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {product.trendScore}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* -- Request button -- */}
        <div className="px-3.5 pb-3.5">
          <RequestProductButton
            product={{
              id: product.id,
              name: product.name,
              nameAr: product.nameAr,
              slug: product.slug,
              shortDesc: product.shortDesc,
              shortDescAr: product.shortDescAr,
              description: product.description,
              sourceUrl: product.sourceUrl,
              supplier: product.supplier,
              estimatedPrice: product.estimatedPrice,
              currency: product.currency,
              imageUrl: product.images[0]?.url ?? null,
            }}
            variant="card"
          />
        </div>
      </div>
    </motion.div>
  );
}