// app/[locale]/(pages)/blogs/_components/BlogListClient.tsx

"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Loader2, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicPostCard, PublicCategory, PublicTag } from "../actions";
import { getPublishedPosts } from "../actions";
import { BlogCard } from "./BlogCard";

// Translations (unchanged)
const T = {
  en: {
    search: "Search articles…",
    allCategories: "All categories",
    allTags: "All tags",
    filters: "Filters",
    clearAll: "Clear all",
    results: (n: number) => `${n} article${n !== 1 ? "s" : ""}`,
    noResults: "No articles found",
    noResultsSub: "Try adjusting your filters or search terms",
    prev: "Previous",
    next: "Next",
    page: (p: number, t: number) => `Page ${p} of ${t}`,
  },
  ar: {
    search: "ابحث عن مقال…",
    allCategories: "كل التصنيفات",
    allTags: "كل الوسوم",
    filters: "تصفية",
    clearAll: "مسح الكل",
    results: (n: number) => `${n} مقال`,
    noResults: "لا توجد مقالات",
    noResultsSub: "جرّب تعديل الفلاتر أو كلمات البحث",
    prev: "السابق",
    next: "التالي",
    page: (p: number, t: number) => `صفحة ${p} من ${t}`,
  },
} as const;

interface Props {
  isAr: boolean;
  initialPosts: PublicPostCard[];
  initialTotal: number;
  initialTotalPages: number;
  initialPage: number;
  categories: PublicCategory[];
  tags: PublicTag[];
  initialFilters: {
    category?: string;
    tag?: string;
    search?: string;
  };
}

export function BlogListClient({
  isAr,
  initialPosts,
  initialTotal,
  initialTotalPages,
  initialPage,
  categories,
  tags,
  initialFilters,
}: Props) {
  const t = isAr ? T.ar : T.en;

  const [posts, setPosts] = useState(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [page, setPage] = useState(initialPage);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [mobileFilters, setMobileFilters] = useState(false);

  const [search, setSearch] = useState(initialFilters.search ?? "");
  const [category, setCategory] = useState(initialFilters.category ?? "");
  const [tag, setTag] = useState(initialFilters.tag ?? "");
  const [loading, setLoading] = useState(false);

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPosts = useCallback(
    async (opts: { search?: string; category?: string; tag?: string; page?: number }) => {
      setLoading(true);
      const result = await getPublishedPosts({
        locale: isAr ? "ar" : "en",
        search: opts.search || undefined,
        categorySlug: opts.category || undefined,
        tagSlug: opts.tag || undefined,
        page: opts.page ?? 1,
        limit: 12,
      });
      if (result.success) {
        setPosts(result.data.posts);
        setTotal(result.data.total);
        setTotalPages(result.data.pages);
        setPage(result.data.page);
      }
      setLoading(false);
    },
    [isAr]
  );

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      fetchPosts({ search: val, category, tag, page: 1 });
    }, 350);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    fetchPosts({ search, category: val, tag, page: 1 });
  };

  const handleTagChange = (val: string) => {
    setTag(val);
    fetchPosts({ search, category, tag: val, page: 1 });
  };

  const handlePage = (p: number) => {
    fetchPosts({ search, category, tag, page: p });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAll = () => {
    setSearch("");
    setCategory("");
    setTag("");
    fetchPosts({ page: 1 });
  };

  const hasFilters = !!(search || category || tag);

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          {t.allCategories}
        </p>
        <div className="space-y-1">
          <button
            onClick={() => handleCategoryChange("")}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              !category
                ? "bg-color/10 text-color border border-color/25"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <span className="flex-1 text-left">{t.allCategories}</span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold", !category ? "bg-color/15 text-color" : "bg-muted/60")}>
              {categories.reduce((s, c) => s + c.postCount, 0)}
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(category === cat.slug ? "" : cat.slug)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                category === cat.slug
                  ? "bg-color/10 text-color border border-color/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <span className="flex-1 text-left truncate">{cat.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/60">{cat.postCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <>
          <div className="h-px bg-border/30" />
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              {t.allTags}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTagChange("")}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full transition-all",
                  !tag ? "bg-color/10 text-color border border-color/25" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {t.allTags}
              </button>
              {tags.map((tg) => (
                <button
                  key={tg.slug}
                  onClick={() => handleTagChange(tag === tg.slug ? "" : tg.slug)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full transition-all",
                    tag === tg.slug ? "bg-color/10 text-color border border-color/25" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {tg.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {hasFilters && (
        <Button variant="ghost" onClick={clearAll} className="w-full flex items-center justify-center gap-1.5 text-xs">
          <X className="w-3.5 h-3.5" /> {t.clearAll}
        </Button>
      )}
    </div>
  );

  const Prev = isAr ? ChevronRight : ChevronLeft;
  const Next = isAr ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-20 self-start">
        <FilterSidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-52">
            {loading ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t.search}
              className="pl-10 h-10 rounded-xl border-border/60 text-sm"
            />
            {search && (
              <Button
                variant="ghost"
                onClick={() => handleSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Layout toggle */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl border border-border/60 bg-muted/20">
            <Button
              variant="ghost"
              onClick={() => setLayout("grid")}
              className={cn("p-1.5 rounded-lg", layout === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLayout("list")}
              className={cn("p-1.5 rounded-lg", layout === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" className="lg:hidden h-10 gap-1.5 rounded-xl" onClick={() => setMobileFilters(true)}>
            <SlidersHorizontal className="w-4 h-4" /> {t.filters}
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-color" />}
          </Button>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {category && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-color/8 text-color border border-color/20 font-medium">
                {categories.find((c) => c.slug === category)?.name ?? category}
                <Button variant="ghost" onClick={() => handleCategoryChange("")}>
                  <X className="w-3 h-3" />
                </Button>
              </span>
            )}
            {tag && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-color/8 text-color border border-color/20 font-medium">
                {tags.find((t) => t.slug === tag)?.name ?? tag}
                <Button variant="ghost" onClick={() => handleTagChange("")}>
                  <X className="w-3 h-3" />
                </Button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-color/8 text-color border border-color/20 font-medium">
                "{search}"
                <Button variant="ghost" onClick={() => handleSearch("")}>
                  <X className="w-3 h-3" />
                </Button>
              </span>
            )}
          </div>
        )}

        {/* Result count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{total}</span> {t.results(total).replace(String(total), "").trim()}
          </p>
        </div>

        {/* Posts grid/list */}
        <AnimatePresence mode="wait">
          {posts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border/60 bg-muted/5 gap-5 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                <Search className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t.noResults}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{t.noResultsSub}</p>
              </div>
              {hasFilters && (
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={clearAll}>
                  <X className="w-3.5 h-3.5" /> {t.clearAll}
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={layout}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                layout === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "flex flex-col gap-4"
              )}
            >
              <AnimatePresence initial={false}>
                {posts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  >
                    <BlogCard post={post} isAr={isAr} layout={layout} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-border/40">
            <p className="text-xs text-muted-foreground">{t.page(page, totalPages)}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1.5" disabled={page <= 1} onClick={() => handlePage(page - 1)}>
                <Prev className="w-4 h-4" /> {t.prev}
              </Button>
              <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1.5" disabled={page >= totalPages} onClick={() => handlePage(page + 1)}>
                {t.next} <Next className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileFilters(false)}
            />
            <motion.div
              initial={{ x: isAr ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "fixed top-0 bottom-0 z-50 w-72 bg-card border-border/30 p-6 overflow-y-auto shadow-2xl lg:hidden",
                isAr ? "right-0 border-l" : "left-0 border-r"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-foreground">{t.filters}</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setMobileFilters(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <FilterSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}