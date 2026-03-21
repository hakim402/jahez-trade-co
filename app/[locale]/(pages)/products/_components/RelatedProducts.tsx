// app/[locale]/(pages)/products/_components/RelatedProducts.tsx

import Link from "next/link";
import { TrendingUp, Package, Star } from "lucide-react";
import { getRelatedProducts } from "../actions";
import { getLocale } from "next-intl/server";

interface RelatedProductsProps {
  currentId: string;
  category: string | null;
  isAr: boolean;
}

export async function RelatedProducts({
  currentId,
  category,
  isAr,
}: RelatedProductsProps) {
  const locale = await getLocale();
  const related = await getRelatedProducts(currentId, category, 4);

  if (related.length === 0) return null;

  return (
    <div className="mt-16 pt-10 border-t border-border/50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6" dir={isAr ? "rtl" : "ltr"}>
        <TrendingUp className="w-4 h-4 text-[#7b57fc]" />
        <h2 className="text-base font-semibold text-foreground">
          {isAr ? "منتجات ذات صلة" : "Related Products"}
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map((p) => {
          const image = p.images[0];
          const name = isAr && p.nameAr ? p.nameAr : p.name;
          const desc = isAr && p.shortDescAr ? p.shortDescAr : p.shortDesc;
          // estimatedPrice is already serialized by getRelatedProducts
          const price = p.estimatedPrice;

          return (
            <Link
              key={p.id}
              href={`/${locale}/products/${p.id}`}
              className="group flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-[#7b57fc]/35 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-muted/30">
                {image ? (
                  <img
                    src={image.url}
                    alt={image.altText ?? name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                )}
                {p.isFeatured && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#7b57fc] text-white">
                    <Star className="w-2 h-2" />
                    {isAr ? "مميز" : "Featured"}
                  </span>
                )}
              </div>

              {/* Info */}
              <div
                className={`flex flex-col gap-1 p-3 flex-1 ${isAr ? "text-right" : "text-left"}`}
                dir={isAr ? "rtl" : "ltr"}
              >
                <h3 className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                  {name}
                </h3>
                {desc && (
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                )}
                {price !== null ? (
                  <p className="text-xs font-bold text-[#7b57fc] tabular-nums mt-auto pt-1">
                    {price.toLocaleString()} {p.currency}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground/50 mt-auto pt-1">
                    {isAr ? "تواصل للسعر" : "Contact for price"}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
