"use client";

// app/[locale]/(pages)/products/_components/TrendingProductsClient.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Flame,
  TrendingUp,
  Package,
  ArrowRight,
  Eye,
  Sparkles,
  ChevronRight,
  Globe,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Carousel from "@/app/[locale]/_components/Carousel/carousel";
import { RequestProductButton } from "./RequestProductDialog";
import { incrementProductView } from "../actions";
import type { Product } from "./ProductCard";
import { Button } from "@/components/ui/button";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import SA from "country-flag-icons/react/3x2/SA";
import AE from "country-flag-icons/react/3x2/AE";
import YE from "country-flag-icons/react/3x2/YE";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { value: string; labelAr: string | null };

// Map country code to SVG flag component
const COUNTRY_FLAG_COMPONENT: Record<string, React.ElementType> = {
  CN,
  US,
  SA,
  AE,
  YE,
};

function getTrendBadge(score: number, isAr: boolean) {
  if (score >= 80)
    return {
      label: isAr ? "🔥 ساخن" : "🔥 Hot",
      cls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    };
  if (score >= 60)
    return {
      label: isAr ? "📈 رائج" : "📈 Trending",
      cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    };
  return null;
}

// ─── Featured hero card ───────────────────────────────────────────────────────

function FeaturedHeroCard({
  product,
  isAr,
  locale,
}: {
  product: Product;
  isAr: boolean;
  locale: string;
}) {
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const name = isAr && product.nameAr ? product.nameAr : product.name;
  const desc =
    isAr && product.shortDescAr ? product.shortDescAr : product.shortDesc;
  const trendBadge = getTrendBadge(product.trendScore, isAr);
  const FlagComponent = product.sourceCountry
    ? COUNTRY_FLAG_COMPONENT[product.sourceCountry]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative rounded-2xl border border-[#7b57fc]/20 bg-card overflow-hidden mb-6 transition-all duration-300 hover:border-[#7b57fc]/40 hover:shadow-xl hover:shadow-[#7b57fc]/8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-5 min-h-65">
        {/* Image */}
        <Link
          href={`/${locale}/products/${product.id}`}
          onClick={() => incrementProductView(product.id).catch(() => {})}
          className="relative sm:col-span-2 overflow-hidden bg-muted/30 min-h-50 block"
        >
          {primary ? (
            <img
              src={primary.url}
              alt={primary.altText ?? name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-14 h-14 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#7b57fc] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
            <Sparkles className="w-3 h-3" />
            {isAr ? "منتج مميز" : "Featured Pick"}
          </div>
          {FlagComponent && (
            <div className="absolute top-3 right-3">
              <FlagComponent className="w-5 h-5 rounded-full shadow-sm" />
            </div>
          )}
        </Link>

        {/* Info */}
        <div
          className={cn(
            "sm:col-span-3 flex flex-col justify-between gap-4 p-6",
            isAr && "text-right",
          )}
          dir={isAr ? "rtl" : "ltr"}
        >
          <div className="space-y-3">
            <div
              className={cn("flex flex-wrap gap-2", isAr && "flex-row-reverse")}
            >
              {trendBadge && (
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2.5 py-1 rounded-full border",
                    trendBadge.cls,
                  )}
                >
                  {trendBadge.label}
                </span>
              )}
              {product.category && (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {isAr && product.categoryAr
                    ? product.categoryAr
                    : product.category}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-foreground leading-snug">
              {name}
            </h3>
            {desc && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {desc}
              </p>
            )}
            <div
              className={cn(
                "flex items-center gap-4 text-xs text-muted-foreground",
                isAr && "flex-row-reverse",
              )}
            >
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {product.viewCount.toLocaleString()} {isAr ? "مشاهدة" : "views"}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#7b57fc]" />
                {product.trendScore} {isAr ? "نقطة" : "pts"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {product.estimatedPrice !== null && (
              <div>
                <p className="text-[10px] text-muted-foreground">
                  {isAr ? "السعر التقديري" : "Estimated price"}
                </p>
                <p className="text-2xl font-bold text-[#7b57fc] tabular-nums">
                  {product.estimatedPrice.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {product.currency}
                  </span>
                </p>
              </div>
            )}
            {/* ⚠️ Use RequestProductButton from dialog — never inline router.push */}
            <div className={cn("flex gap-2", isAr && "flex-row-reverse")}>
              <div className="flex-1">
                <RequestProductButton
                  product={{
                    id: product.id,
                    name: product.name,
                    nameAr: product.nameAr,
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
              <Link
                href={`/${locale}/products/${product.id}`}
                className="h-9 px-4 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground flex items-center hover:text-foreground hover:border-[#7b57fc]/40 transition-all whitespace-nowrap"
              >
                {isAr ? "تفاصيل" : "Details"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Carousel product card ────────────────────────────────────────────────────

function CarouselCard({
  product,
  isAr,
  locale,
}: {
  product: Product;
  isAr: boolean;
  locale: string;
}) {
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const name = isAr && product.nameAr ? product.nameAr : product.name;
  const desc =
    isAr && product.shortDescAr ? product.shortDescAr : product.shortDesc;
  const cat =
    isAr && product.categoryAr ? product.categoryAr : product.category;
  const trendBadge = getTrendBadge(product.trendScore, isAr);
  const FlagComponent = product.sourceCountry
    ? COUNTRY_FLAG_COMPONENT[product.sourceCountry]
    : null;

  return (
    <div className="group flex flex-col h-full rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-[#7b57fc]/35 hover:shadow-lg hover:shadow-[#7b57fc]/6 hover:-translate-y-1">
      {/* Image — Link for navigation */}
      <Link
        href={`/${locale}/products/${product.id}`}
        onClick={() => incrementProductView(product.id).catch(() => {})}
        className="relative aspect-square overflow-hidden bg-muted/30 block shrink-0"
      >
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
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {trendBadge && (
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                trendBadge.cls,
              )}
            >
              {trendBadge.label}
            </span>
          )}
        </div>
        {FlagComponent && (
          <div className="absolute top-2.5 right-2.5">
            <FlagComponent className="w-5 h-5 rounded-full shadow-sm" />
          </div>
        )}
        {product.viewCount > 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
            <Eye className="w-2.5 h-2.5" />
            {product.viewCount.toLocaleString()}
          </div>
        )}
      </Link>

      {/* Info — also a link */}
      <Link
        href={`/${locale}/products/${product.id}`}
        className={cn(
          "flex flex-col gap-1.5 px-3.5 pt-3 flex-1",
          isAr && "text-right",
        )}
        dir={isAr ? "rtl" : "ltr"}
      >
        {cat && (
          <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wide font-semibold">
            {cat}
          </span>
        )}
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 min-h-10">
          {name}
        </h3>
        {desc && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {desc}
          </p>
        )}
        <div
          className={cn(
            "flex items-center justify-between pt-1 mt-auto",
            isAr && "flex-row-reverse",
          )}
        >
          {product.estimatedPrice !== null ? (
            <span className="text-sm font-bold text-[#7b57fc] tabular-nums">
              {product.estimatedPrice.toLocaleString()} {product.currency}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">
              {isAr ? "تواصل للسعر" : "Contact for price"}
            </span>
          )}
        </div>
      </Link>

      {/* Button — OUTSIDE link, opens dialog */}
      <div className="px-3.5 pb-3.5 pt-2">
        <RequestProductButton
          product={{
            id: product.id,
            name: product.name,
            nameAr: product.nameAr,
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
  );
}

// ─── Category pills ───────────────────────────────────────────────────────────

function CategoryPills({
  categories,
  active,
  onChange,
  isAr,
}: {
  categories: Category[];
  active: string;
  onChange: (c: string) => void;
  isAr: boolean;
}) {
  if (!categories.length) return null;
  return (
    <div className="flex flex-wrap gap-2" dir={isAr ? "rtl" : "ltr"}>
      <button
        onClick={() => onChange("")}
        className={cn(
          "px-4 py-1.5 text-xs rounded-full border font-medium transition-all",
          !active
            ? "bg-[#7b57fc] text-white border-[#7b57fc]"
            : "bg-background border-border/60 text-muted-foreground hover:border-[#7b57fc]/40",
        )}
      >
        {isAr ? "الكل" : "All"}
      </button>
      {categories.map((cat) => (
        <Button
          variant={"ghost"}
          key={cat.value}
          onClick={() => onChange(cat.value === active ? "" : cat.value)}
          className={cn(
            "px-4 py-1.5 text-xs rounded-full border font-medium transition-all",
            active === cat.value
              ? "bg-[#7b57fc] text-white border-[#7b57fc]"
              : "bg-background border-border/60 text-muted-foreground hover:border-[#7b57fc]/40",
          )}
        >
          {isAr && cat.labelAr ? cat.labelAr : cat.value}
        </Button>
      ))}
    </div>
  );
}

// ─── Arrow button for Carousel ────────────────────────────────────────────────

function ArrowBtn({
  direction,
  isAr,
}: {
  direction: "prev" | "next";
  isAr: boolean;
}) {
  const showLeft = isAr ? direction !== "prev" : direction === "prev";
  return (
    <div className="w-9 h-9 rounded-full border border-border/60 bg-background flex items-center justify-center text-muted-foreground hover:border-[#7b57fc]/40 hover:text-[#7b57fc] transition-all">
      {showLeft ? (
        <ChevronLeft className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function TrendingProductsClient({
  initialProducts,
  initialCategories,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
}) {
  const locale = useLocale();
  const isAr = locale === "ar";

  // Data arrives pre-fetched via props (server-rendered) — no loading state,
  // no client-side fetch. Real content ships in the initial HTML response.
  const [activeCategory, setActiveCategory] = useState("");

  const displayed = activeCategory
    ? initialProducts.filter((p) => p.category === activeCategory)
    : initialProducts;
  const topFeatured = displayed.find((p) => p.isFeatured) ?? null;
  const carouselItems = displayed.filter((p) => p.id !== topFeatured?.id);

  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 rounded-full orb-brand pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
          dir={isAr ? "rtl" : "ltr"}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#7b57fc]" />
              </div>
              <span className="text-xs font-semibold text-[#7b57fc] uppercase tracking-wider">
                {isAr ? "المنتجات الرائجة" : "Trending Products"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {isAr ? (
                <>
                  <span className="text-gradient">أحدث المنتجات</span> من
                  الأسواق العالمية
                </>
              ) : (
                <>
                  Latest products from{" "}
                  <span className="text-gradient">global markets</span>
                </>
              )}
            </h2>
            {initialProducts.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1.5">
                {isAr
                  ? `${initialProducts.length} منتج متاح الآن`
                  : `${initialProducts.length} products available now`}
              </p>
            )}
          </div>
          <Link
            href={`/${locale}/products`}
            className="group flex items-center gap-1.5 text-sm font-semibold text-[#7b57fc] hover:underline underline-offset-2 whitespace-nowrap self-start sm:self-auto"
          >
            {isAr ? "عرض الكل" : "View all"}
            <ChevronRight
              className={cn(
                "w-4 h-4 transition-transform group-hover:translate-x-0.5",
                isAr && "rotate-180",
              )}
            />
          </Link>
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <CategoryPills
            categories={initialCategories}
            active={activeCategory}
            onChange={setActiveCategory}
            isAr={isAr}
          />
        </motion.div>

        {/* Content */}
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground/25 mb-3" />
            <p className="text-muted-foreground text-sm">
              {isAr
                ? "لا توجد منتجات في هذه الفئة"
                : "No products in this category"}
            </p>
            <button
              onClick={() => setActiveCategory("")}
              className="mt-3 text-xs text-[#7b57fc] hover:underline underline-offset-2"
            >
              {isAr ? "عرض الكل" : "Show all"}
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {topFeatured && (
                <FeaturedHeroCard
                  product={topFeatured}
                  isAr={isAr}
                  locale={locale}
                />
              )}
              {carouselItems.length > 0 && (
                <Carousel
                  autoplay={false}
                  showDots={carouselItems.length > 4}
                  showControls={carouselItems.length > 1}
                  showProgress={false}
                  prevButton={<ArrowBtn direction="prev" isAr={isAr} />}
                  nextButton={<ArrowBtn direction="next" isAr={isAr} />}
                  opts={{
                    align: "start",
                    loop: carouselItems.length > 4,
                    slidesToScroll: 1,
                  }}
                  itemClassName={cn(
                    "basis-1/2 md:basis-1/3 lg:basis-1/4",
                    carouselItems.length === 1 &&
                      "basis-full sm:basis-1/2 lg:basis-1/3",
                  )}
                  className="px-0"
                >
                  {carouselItems.map((product) => (
                    <CarouselCard
                      key={product.id}
                      product={product}
                      isAr={isAr}
                      locale={locale}
                    />
                  ))}
                </Carousel>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Bottom CTAs */}
        {initialProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href={`/${locale}/products`}
              className="group flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#7b57fc] text-white text-sm font-semibold shadow-lg shadow-[#7b57fc]/25 hover:bg-[#6a48eb] hover:-translate-y-0.5 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              {isAr ? "تصفح جميع المنتجات" : "Browse all products"}
              <ArrowRight
                className={cn(
                  "w-4 h-4 transition-transform group-hover:translate-x-1",
                  isAr && "rotate-180",
                )}
              />
            </Link>
            <Link
              href={`/${locale}/dashboard/requests/new`}
              className="group flex items-center gap-2 px-7 py-3.5 rounded-full border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-[#7b57fc]/40 hover:-translate-y-0.5 transition-all"
            >
              <Globe className="w-4 h-4" />
              {isAr ? "اطلب منتجاً غير موجود" : "Request a custom product"}
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}