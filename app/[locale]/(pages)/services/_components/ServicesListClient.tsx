"use client";

// app/[locale]/(pages)/services/_components/ServicesListClient.tsx

import { useState, useCallback, useTransition, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowRight,
  Clock,
  Users,
  Star,
  Globe,
  Truck,
  ShoppingCart,
  Factory,
  Briefcase,
  Ship,
  TrendingUp,
  DollarSign,
  Tag,
  LayoutGrid,
  List,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConsultingServiceTopic } from "@prisma/client";
import type {
  PublicConsultingServiceCard,
  ServiceCategory,
  ServiceTopicCount,
} from "../actions";
import { getPublicConsultingServices } from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  en: {
    search: "Search services…",
    sort: "Sort",
    sortPopular: "Most popular",
    sortNewest: "Newest",
    sortPriceLow: "Price: low to high",
    sortPriceHigh: "Price: high to low",
    allTopics: "All topics",
    allCategories: "All categories",
    filters: "Filters",
    clearAll: "Clear all",
    results: (n: number) => `${n} service${n !== 1 ? "s" : ""}`,
    noResults: "No services found",
    noResultsSub: "Try adjusting your filters or search terms",
    viewDetails: "View details",
    from: "From",
    perSession: "/ session",
    featured: "Featured",
    requests: (n: number) => `${n} request${n !== 1 ? "s" : ""}`,
    topics: {
      sourcing: "Product Sourcing",
      import: "Import & Customs",
      logistics: "Logistics",
      market_entry: "Market Entry",
      supplier: "Supplier Sourcing",
      other: "General Consulting",
    },
    deliveryFormat: {
      video_call: "Video call",
      written_report: "Written report",
      on_site: "On-site",
      hybrid: "Hybrid",
      async: "Async",
    },
    prev: "Previous",
    next: "Next",
    page: (p: number, t: number) => `Page ${p} of ${t}`,
  },
  ar: {
    search: "ابحث عن خدمة…",
    sort: "ترتيب",
    sortPopular: "الأكثر طلباً",
    sortNewest: "الأحدث",
    sortPriceLow: "السعر: من الأقل",
    sortPriceHigh: "السعر: من الأعلى",
    allTopics: "كل المواضيع",
    allCategories: "كل الفئات",
    filters: "تصفية",
    clearAll: "مسح الكل",
    results: (n: number) => `${n} خدمة`,
    noResults: "لا توجد خدمات",
    noResultsSub: "جرّب تعديل الفلاتر أو مصطلحات البحث",
    viewDetails: "عرض التفاصيل",
    from: "يبدأ من",
    perSession: "/ جلسة",
    featured: "مميز",
    requests: (n: number) => `${n} طلب`,
    topics: {
      sourcing: "مصادر المنتجات",
      import: "الاستيراد والجمارك",
      logistics: "اللوجستيات",
      market_entry: "دخول الأسواق",
      supplier: "مصادر الموردين",
      other: "استشارة عامة",
    },
    deliveryFormat: {
      video_call: "مكالمة فيديو",
      written_report: "تقرير مكتوب",
      on_site: "في الموقع",
      hybrid: "هجين",
      async: "غير متزامن",
    },
    prev: "السابق",
    next: "التالي",
    page: (p: number, t: number) => `صفحة ${p} من ${t}`,
  },
} as const;

const TOPIC_ICONS: Record<ConsultingServiceTopic, React.ElementType> = {
  sourcing: ShoppingCart,
  import: Ship,
  logistics: Truck,
  market_entry: Globe,
  supplier: Factory,
  other: Briefcase,
};

const ALL_TOPICS: ConsultingServiceTopic[] = [
  "sourcing",
  "import",
  "logistics",
  "market_entry",
  "supplier",
  "other",
];

// ─────────────────────────────────────────────────────────────────────────────
// Service card
// ─────────────────────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  isAr,
  t,
  layout,
}: {
  service: PublicConsultingServiceCard;
  isAr: boolean;
  t: typeof T.en;
  layout: "grid" | "list";
}) {
  const title = (isAr ? service.titleAr : null) ?? service.title;
  const shortDesc = (isAr ? service.shortDescAr : null) ?? service.shortDesc;
  const category = (isAr ? service.categoryAr : null) ?? service.category;
  const duration = (isAr ? service.durationAr : null) ?? service.duration;
  const primaryImg =
    service.images.find((i) => i.isPrimary) ?? service.images[0];
  const TopicIcon = TOPIC_ICONS[service.topic];
  const topicLabel = t.topics[service.topic];

  if (layout === "list")
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="group rounded-2xl border border-border/40 bg-card hover:border-[#7b57fc]/30 hover:shadow-lg hover:shadow-[#7b57fc]/5 transition-all duration-300 overflow-hidden"
      >
        <Link
          href={`/services/${service.id}`}
          className="flex items-center gap-5 p-5"
        >
          {/* Image */}
          <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-muted/30">
            {primaryImg ? (
              <Image
                src={primaryImg.url}
                alt={primaryImg.altText ?? title}
                width={96}
                height={96}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#7b57fc]/8">
                <TopicIcon className="w-8 h-8 text-[#7b57fc]/40" />
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {service.isFeatured && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 mb-1.5">
                    <Star className="w-2.5 h-2.5" /> {t.featured}
                  </span>
                )}
                <h3 className="text-base font-bold text-foreground group-hover:text-[#7b57fc] transition-colors truncate">
                  {title}
                </h3>
                {shortDesc && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                    {shortDesc}
                  </p>
                )}
              </div>
              {service.priceFrom !== null && (
                <div className={cn("shrink-0 text-right", isAr && "text-left")}>
                  <p className="text-[10px] text-muted-foreground">{t.from}</p>
                  <p className="text-lg font-bold text-foreground">
                    {service.priceCurrency} {service.priceFrom.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t.perSession}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full border border-border/40">
                <TopicIcon className="w-3 h-3" /> {topicLabel}
              </span>
              {duration && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" /> {duration}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                <Users className="w-3 h-3" /> {t.requests(service.requestCount)}
              </span>
            </div>
          </div>
          <ArrowRight
            className={cn(
              "w-5 h-5 text-muted-foreground/30 group-hover:text-[#7b57fc] group-hover:translate-x-1 transition-all shrink-0",
              isAr &&
                "rotate-180 group-hover:-translate-x-0 group-hover:translate-x-1",
            )}
          />
        </Link>
      </motion.div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-2xl border border-border/40 bg-card hover:border-[#7b57fc]/30 hover:shadow-xl hover:shadow-[#7b57fc]/5 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-muted/20">
        {primaryImg ? (
          <Image
            src={primaryImg.url}
            alt={primaryImg.altText ?? title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#7b57fc]/8 to-[#7b57fc]/4">
            <TopicIcon className="w-12 h-12 text-[#7b57fc]/30" />
          </div>
        )}
        {/* Topic chip overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm border border-border/40 text-foreground shadow-sm",
              isAr && "right-3 left-auto",
            )}
          >
            <TopicIcon className="w-3 h-3 text-[#7b57fc]" /> {topicLabel}
          </span>
        </div>
        {service.isFeatured && (
          <div
            className={cn(
              "absolute top-3 right-3",
              isAr && "left-3 right-auto",
            )}
          >
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-md">
              <Star className="w-2.5 h-2.5" /> {t.featured}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-base font-bold text-foreground group-hover:text-[#7b57fc] transition-colors line-clamp-2 leading-snug">
          {title}
        </h3>
        {shortDesc && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed flex-1">
            {shortDesc}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-border/30">
          {duration && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" /> {duration}
            </span>
          )}
          {service.deliveryFormat && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground capitalize">
              <TrendingUp className="w-3 h-3" />
              {t.deliveryFormat[
                service.deliveryFormat as keyof typeof t.deliveryFormat
              ] ?? service.deliveryFormat}
            </span>
          )}
          {service.requestCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
              <Users className="w-3 h-3" /> {t.requests(service.requestCount)}
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-3 mt-4">
          {service.priceFrom !== null ? (
            <div>
              <p className="text-[10px] text-muted-foreground leading-none">
                {t.from}
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {service.priceCurrency} {service.priceFrom.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  {t.perSession}
                </span>
              </p>
            </div>
          ) : (
            <div />
          )}
          <Link href={`/services/${service.id}`}>
            <Button
              size="sm"
              className="h-9 px-4 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-xs gap-1.5 group/btn shrink-0"
            >
              {t.viewDetails}
              <ArrowRight
                className={cn(
                  "w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform",
                  isAr &&
                    "rotate-180 group-hover/btn:-translate-x-0.0 group-hover/btn:translate-x-5",
                )}
              />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  isAr: boolean;
  initialServices: PublicConsultingServiceCard[];
  initialTotal: number;
  initialTotalPages: number;
  initialPage: number;
  categories: ServiceCategory[];
  topicCounts: ServiceTopicCount[];
  initialFilters: {
    topic?: ConsultingServiceTopic;
    category?: string;
    search?: string;
    sortBy: "newest" | "popular" | "price_asc" | "price_desc";
  };
}

export function ServicesListClient({
  isAr,
  initialServices,
  initialTotal,
  initialTotalPages,
  initialPage,
  categories,
  topicCounts,
  initialFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const t = (isAr ? T.ar : T.en) as typeof T.en;
  const [isPending, startTransition] = useTransition();

  const [services, setServices] = useState(initialServices);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [page, setPage] = useState(initialPage);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [mobileFilters, setMobileFilters] = useState(false);

  const [search, setSearch] = useState(initialFilters.search ?? "");
  const [topic, setTopic] = useState(initialFilters.topic ?? "");
  const [category, setCategory] = useState(initialFilters.category ?? "");
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [loading, setLoading] = useState(false);

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchServices = useCallback(
    async (opts: {
      search?: string;
      topic?: string;
      category?: string;
      sortBy?: string;
      page?: number;
    }) => {
      setLoading(true);
      const r = await getPublicConsultingServices({
        search: opts.search || undefined,
        topic: (opts.topic || undefined) as ConsultingServiceTopic | undefined,
        category: opts.category || undefined,
        sortBy: (opts.sortBy || "popular") as
          | "newest"
          | "popular"
          | "price_asc"
          | "price_desc",
        page: opts.page ?? 1,
        pageSize: 12,
      });
      if (r.success) {
        setServices(r.data.items);
        setTotal(r.data.total);
        setTotalPages(r.data.totalPages);
        setPage(r.data.page);
      }
      setLoading(false);
    },
    [],
  );

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debRef.current) {
      clearTimeout(debRef.current);
    }
    debRef.current = setTimeout(() => {
      fetchServices({ search: val, topic, category, sortBy, page: 1 });
    }, 350);
  };

  const handleTopicChange = (val: string) => {
    setTopic(val);
    fetchServices({ search, topic: val, category, sortBy, page: 1 });
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    fetchServices({ search, topic, category: val, sortBy, page: 1 });
  };

  const handleSortChange = (val: string) => {
    setSortBy(val as typeof sortBy);
    fetchServices({ search, topic, category, sortBy: val, page: 1 });
  };

  const handlePage = (p: number) => {
    fetchServices({ search, topic, category, sortBy, page: p });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAll = () => {
    setSearch("");
    setTopic("");
    setCategory("");
    setSortBy("popular");
    fetchServices({ page: 1 });
  };

  const hasFilters = !!(search || topic || category || sortBy !== "popular");

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Topics */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          {t.allTopics}
        </p>
        <div className="space-y-1">
          <button
            onClick={() => handleTopicChange("")}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              !topic
                ? "bg-[#7b57fc]/10 text-[#7b57fc] border border-[#7b57fc]/25"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
            )}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{t.allTopics}</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                !topic
                  ? "bg-[#7b57fc]/15 text-[#7b57fc]"
                  : "bg-muted/60 text-muted-foreground",
              )}
            >
              {topicCounts.reduce((s, x) => s + x.count, 0)}
            </span>
          </button>
          {ALL_TOPICS.map((tp) => {
            const Icon = TOPIC_ICONS[tp];
            const count = topicCounts.find((x) => x.topic === tp)?.count ?? 0;
            if (count === 0) return null;
            return (
              <Button variant={"ghost"}
                key={tp}
                onClick={() => handleTopicChange(topic === tp ? "" : tp)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  topic === tp
                    ? "bg-[#7b57fc]/10 text-[#7b57fc] border border-[#7b57fc]/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{t.topics[tp]}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                    topic === tp
                      ? "bg-[#7b57fc]/15 text-[#7b57fc]"
                      : "bg-muted/60 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <>
          <div className="h-px bg-border/30" />
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              {t.allCategories}
            </p>
            <div className="space-y-1">
              {categories.map((cat) => {
                const catLabel = (isAr ? cat.categoryAr : null) ?? cat.category;
                return (
                  <button
                    key={cat.category}
                    onClick={() =>
                      handleCategoryChange(
                        category === cat.category ? "" : cat.category,
                      )
                    }
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                      category === cat.category
                        ? "bg-[#7b57fc]/10 text-[#7b57fc] border border-[#7b57fc]/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                    )}
                  >
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 text-left">{catLabel}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                        category === cat.category
                          ? "bg-[#7b57fc]/15 text-[#7b57fc]"
                          : "bg-muted/60 text-muted-foreground",
                      )}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Clear */}
      {hasFilters && (
        <Button
          variant={"ghost"}
          onClick={clearAll}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2 border border-border/40 rounded-xl hover:border-border/80"
        >
          <X className="w-3.5 h-3.5" /> {t.clearAll}
        </Button>
      )}
    </div>
  );

  const Prev = isAr ? ChevronRight : ChevronLeft;
  const Next = isAr ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col lg:flex-row gap-8" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-20 self-start">
        <FilterSidebar />
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            {loading ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
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
                variant={"ghost"}
                onClick={() => handleSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="h-10 w-44 rounded-xl border-border/60 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">{t.sortPopular}</SelectItem>
              <SelectItem value="newest">{t.sortNewest}</SelectItem>
              <SelectItem value="price_asc">{t.sortPriceLow}</SelectItem>
              <SelectItem value="price_desc">{t.sortPriceHigh}</SelectItem>
            </SelectContent>
          </Select>

          {/* Layout toggle (desktop) */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl border border-border/60 bg-muted/20">
            <Button variant={"ghost"}
              onClick={() => setLayout("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                layout === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={'ghost'}
              onClick={() => setLayout("list")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                layout === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile filter button */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden h-10 gap-1.5 rounded-xl border-border/60"
            onClick={() => setMobileFilters(true)}
          >
            <SlidersHorizontal className="w-4 h-4" /> {t.filters}
            {hasFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#7b57fc]" />
            )}
          </Button>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {topic && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20 font-medium">
                {t.topics[topic as ConsultingServiceTopic]}
                <Button variant={"ghost"} onClick={() => handleTopicChange("")}>
                  <X className="w-3 h-3" />
                </Button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20 font-medium">
                {(isAr
                  ? categories.find((c) => c.category === category)?.categoryAr
                  : null) ?? category}
                <Button variant={"ghost"} onClick={() => handleCategoryChange("")}>
                  <X className="w-3 h-3" />
                </Button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20 font-medium">
                "{search}"
                <Button variant={"ghost"} onClick={() => handleSearch("")}>
                  <X className="w-3 h-3" />
                </Button>
              </span>
            )}
          </div>
        )}

        {/* Result count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {total}
            </span>{" "}
            {t.results(total).replace(String(total), "").trim()}
          </p>
        </div>

        {/* Grid / List */}
        <AnimatePresence mode="wait">
          {services.length === 0 ? (
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
                <p className="text-sm font-semibold text-muted-foreground">
                  {t.noResults}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {t.noResultsSub}
                </p>
              </div>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={clearAll}
                >
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
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  : "flex flex-col gap-3",
              )}
            >
              <AnimatePresence initial={false}>
                {services.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  >
                    <ServiceCard
                      service={s}
                      isAr={isAr}
                      t={t}
                      layout={layout}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              {t.page(page, totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl gap-1.5"
                disabled={page <= 1}
                onClick={() => handlePage(page - 1)}
              >
                <Prev className="w-4 h-4" /> {t.prev}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl gap-1.5"
                disabled={page >= totalPages}
                onClick={() => handlePage(page + 1)}
              >
                {t.next} <Next className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile filter drawer ─────────────────────────────────────── */}
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
                isAr ? "right-0 border-l" : "left-0 border-r",
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-foreground">
                  {t.filters}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setMobileFilters(false)}
                >
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
