"use client";

// app/[locale]/(pages)/products/_components/ProductsGrid.tsx

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  X,
  Flame,
  TrendingUp,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import type { Product } from "./ProductCard";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductsGridProps {
  products: Product[];
  categories: { value: string; labelAr: string | null }[];
  isAr: boolean;
  initialSearch: string;
  initialCategory: string;
  initialSort: string;
}

// ─── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  {
    value: "trending",
    labelEn: "Trending",
    labelAr: "الأكثر رواجاً",
    icon: TrendingUp,
  },
  { value: "newest", labelEn: "Newest", labelAr: "الأحدث", icon: Flame },
  { value: "price_asc", labelEn: "Price ↑", labelAr: "السعر ↑", icon: null },
  { value: "price_desc", labelEn: "Price ↓", labelAr: "السعر ↓", icon: null },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductsGrid({
  products,
  categories,
  isAr,
  initialSearch,
  initialCategory,
  initialSort,
}: ProductsGridProps) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);

  // Featured strip — top 3, shown only when no filters active
  const featured = products.filter((p) => p.isFeatured).slice(0, 3);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...products];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameAr ?? "").toLowerCase().includes(q) ||
          (p.shortDesc ?? "").toLowerCase().includes(q) ||
          (p.category ?? "").toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)),
      );
    }

    if (category) list = list.filter((p) => p.category === category);

    switch (sort) {
      case "trending":
        list.sort((a, b) => b.trendScore - a.trendScore);
        break;
      case "price_asc":
        list.sort((a, b) => (a.estimatedPrice ?? 0) - (b.estimatedPrice ?? 0));
        break;
      case "price_desc":
        list.sort((a, b) => (b.estimatedPrice ?? 0) - (a.estimatedPrice ?? 0));
        break;
    }

    return list;
  }, [products, search, category, sort]);

  const hasFilters = Boolean(search || category);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-20 pt-8">
      {/* Featured strip */}
      {featured.length > 0 && !hasFilters && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-[#7b57fc]" />
            <span className="text-sm font-semibold text-foreground">
              {isAr ? "منتجات مميزة" : "Featured Products"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                isAr={isAr}
                index={i}
                featured
              />
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className="flex flex-col sm:flex-row gap-3 mb-6"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث عن منتج..." : "Search products..."}
            className="pl-9 h-10 rounded-xl text-sm"
          />
          {search && (
            <Button
              variant={"ghost"}
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={cn(
                "h-9 px-3 text-xs rounded-xl border transition-all font-medium",
                sort === opt.value
                  ? "bg-[#7b57fc] text-white border-[#7b57fc]"
                  : "bg-background border-border/60 text-muted-foreground hover:border-[#7b57fc]/50 hover:text-foreground",
              )}
            >
              {isAr ? opt.labelAr : opt.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6" dir={isAr ? "rtl" : "ltr"}>
          <button
            onClick={() => setCategory("")}
            className={cn(
              "px-3.5 py-1.5 text-xs rounded-full border font-medium transition-all",
              !category
                ? "bg-[#7b57fc] text-white border-[#7b57fc]"
                : "bg-background border-border/60 text-muted-foreground hover:border-[#7b57fc]/50",
            )}
          >
            {isAr ? "الكل" : "All"}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setCategory(cat.value === category ? "" : cat.value)
              }
              className={cn(
                "px-3.5 py-1.5 text-xs rounded-full border font-medium transition-all",
                category === cat.value
                  ? "bg-[#7b57fc] text-white border-[#7b57fc]"
                  : "bg-background border-border/60 text-muted-foreground hover:border-[#7b57fc]/50",
              )}
            >
              {isAr && cat.labelAr ? cat.labelAr : cat.value}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {hasFilters && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            {isAr
              ? `${filtered.length} نتيجة`
              : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setCategory("");
            }}
            className="h-7 text-xs text-muted-foreground gap-1"
          >
            <X className="w-3 h-3" />
            {isAr ? "مسح الفلاتر" : "Clear filters"}
          </Button>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">
            {isAr ? "لا توجد منتجات" : "No products found"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {isAr ? "جرب البحث بكلمة أخرى" : "Try a different search term"}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                isAr={isAr}
                index={i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
