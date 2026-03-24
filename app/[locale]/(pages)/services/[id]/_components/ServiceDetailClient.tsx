"use client";

// app/[locale]/(pages)/services/[id]/_components/ServiceDetailClient.tsx

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowLeft,
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
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Calendar,
  Zap,
  Tag,
  TrendingUp,
  Share2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ConsultingServiceTopic } from "@prisma/client";
import type {
  PublicConsultingService,
  PublicConsultingServiceCard,
} from "../../actions";

// ─────────────────────────────────────────────────────────────────────────────
// Strings
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  en: {
    back: "All services",
    requestService: "Request this service",
    contactTeam: "Contact the team",
    featured: "Featured",
    priceFrom: "Starting from",
    perSession: "/ session",
    duration: "Duration",
    delivery: "Delivery",
    category: "Category",
    topic: "Topic",
    requests: (n: number) => `${n} request${n !== 1 ? "s" : ""}`,
    views: (n: number) => `${n} view${n !== 1 ? "s" : ""}`,
    includes: "What's included",
    description: "About this service",
    relatedTitle: "Related services",
    viewAll: "View all services",
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
    imageOf: (n: number, t: number) => `Image ${n} of ${t}`,
    readMore: "Read more",
    readLess: "Read less",
    tags: "Tags",
  },
  ar: {
    back: "كل الخدمات",
    requestService: "طلب هذه الخدمة",
    contactTeam: "تواصل مع الفريق",
    featured: "مميز",
    priceFrom: "يبدأ من",
    perSession: "/ جلسة",
    duration: "المدة",
    delivery: "طريقة التقديم",
    category: "الفئة",
    topic: "الموضوع",
    requests: (n: number) => `${n} طلب`,
    views: (n: number) => `${n} مشاهدة`,
    includes: "ما يتضمنه",
    description: "عن هذه الخدمة",
    relatedTitle: "خدمات ذات صلة",
    viewAll: "عرض كل الخدمات",
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
    imageOf: (n: number, t: number) => `صورة ${n} من ${t}`,
    readMore: "اقرأ المزيد",
    readLess: "اقرأ أقل",
    tags: "الوسوم",
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

// ─────────────────────────────────────────────────────────────────────────────
// Image gallery
// ─────────────────────────────────────────────────────────────────────────────

function ImageGallery({
  images,
  title,
  isAr,
  t,
}: {
  images: {
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
  }[];
  title: string;
  isAr: boolean;
  t: typeof T.en;
}) {
  const [active, setActive] = useState(
    images.findIndex((i) => i.isPrimary) >= 0
      ? images.findIndex((i) => i.isPrimary)
      : 0,
  );

  if (images.length === 0) return null;

  const Prev = isAr ? ChevronRight : ChevronLeft;
  const Next = isAr ? ChevronLeft : ChevronRight;

  const go = (dir: 1 | -1) =>
    setActive((p) => (p + dir + images.length) % images.length);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted/20 shadow-xl">
        <Image
          src={images[active].url}
          alt={images[active].altText ?? title}
          fill
          className="object-cover"
          priority
        />
        {images.length > 1 && (
          <>
            <Button
              variant={"ghost"}
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors shadow-lg"
            >
              <Prev className="w-4 h-4" />
            </Button>
            <Button
              variant={"ghost"}
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors shadow-lg"
            >
              <Next className="w-4 h-4" />
            </Button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-[11px] text-muted-foreground font-medium">
              {t.imageOf(active + 1, images.length)}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <Button
              variant={"ghost"}
              key={img.id}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                i === active
                  ? "border-[#7b57fc] shadow-md shadow-[#7b57fc]/20"
                  : "border-border/40 hover:border-border/80",
              )}
            >
              <Image
                src={img.url}
                alt={img.altText ?? title}
                fill
                className="object-cover"
              />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Related card (compact)
// ─────────────────────────────────────────────────────────────────────────────

function RelatedCard({
  service,
  isAr,
  t,
}: {
  service: PublicConsultingServiceCard;
  isAr: boolean;
  t: typeof T.en;
}) {
  const title = (isAr ? service.titleAr : null) ?? service.title;
  const shortDesc = (isAr ? service.shortDescAr : null) ?? service.shortDesc;
  const TopicIcon = TOPIC_ICONS[service.topic];
  const primaryImg =
    service.images.find((i) => i.isPrimary) ?? service.images[0];

  return (
    <Link
      href={`/services/${service.id}`}
      className="group flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:border-[#7b57fc]/30 hover:bg-[#7b57fc]/3 transition-all"
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted/20">
        {primaryImg ? (
          <Image
            src={primaryImg.url}
            alt={title}
            width={56}
            height={56}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#7b57fc]/8">
            <TopicIcon className="w-5 h-5 text-[#7b57fc]/40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground group-hover:text-[#7b57fc] transition-colors truncate">
          {title}
        </p>
        {shortDesc && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {shortDesc}
          </p>
        )}
        {service.priceFrom !== null && (
          <p className="text-xs font-bold text-foreground mt-0.5 tabular-nums">
            {service.priceCurrency} {service.priceFrom.toLocaleString()}
          </p>
        )}
      </div>
      <ArrowRight
        className={cn(
          "w-4 h-4 text-muted-foreground/30 group-hover:text-[#7b57fc] shrink-0",
          isAr && "rotate-180",
        )}
      />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function ServiceDetailClient({
  service,
  related,
  isAr,
}: {
  service: PublicConsultingService;
  related: PublicConsultingServiceCard[];
  isAr: boolean;
}) {
  const t = (isAr ? T.ar : T.en) as typeof T.en;
  const [expanded, setExpanded] = useState(false);

  const title = (isAr ? service.titleAr : null) ?? service.title;
  const description =
    (isAr ? service.descriptionAr : null) ?? service.description;
  const shortDesc = (isAr ? service.shortDescAr : null) ?? service.shortDesc;
  const category = (isAr ? service.categoryAr : null) ?? service.category;
  const duration = (isAr ? service.durationAr : null) ?? service.duration;
  const includes = isAr ? service.includesAr : service.includesEn;
  const TopicIcon = TOPIC_ICONS[service.topic];

  const TRUNCATE_AT = 600;
  const isLong = description.length > TRUNCATE_AT;

  const Back = isAr ? ArrowRight : ArrowLeft;

  return (
    <main className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <div className="border-b border-border/30 bg-muted/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Back className="w-4 h-4" /> {t.back}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16">
          {/* ── LEFT: content ──────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Title + badges */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-muted/30 text-muted-foreground border border-border/40">
                  <TopicIcon className="w-3 h-3 text-[#7b57fc]" />{" "}
                  {t.topics[service.topic]}
                </span>
                {service.isFeatured && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <Star className="w-3 h-3" /> {t.featured}
                  </span>
                )}
                {category && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-full bg-muted/20 text-muted-foreground border border-border/40">
                    <Tag className="w-3 h-3" /> {category}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                {title}
              </h1>
              {shortDesc && (
                <p className="text-lg text-muted-foreground mt-3 leading-relaxed">
                  {shortDesc}
                </p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {service.requestCount > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />{" "}
                    {t.requests(service.requestCount)}
                  </span>
                )}
                {service.viewCount > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />{" "}
                    {t.views(service.viewCount)}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Gallery */}
            {service.images.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-8"
              >
                <ImageGallery
                  images={service.images}
                  title={title}
                  isAr={isAr}
                  t={t}
                />
              </motion.div>
            )}

            {/* Description */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-8"
            >
              <h2 className="text-lg font-bold text-foreground mb-4">
                {t.description}
              </h2>
              <div
                className={cn(
                  "text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm",
                  !expanded && isLong && "line-clamp-5",
                )}
              >
                {description}
              </div>
              {isLong && (
                <button
                  onClick={() => setExpanded((p) => !p)}
                  className="flex items-center gap-1 mt-2 text-xs text-[#7b57fc] hover:underline underline-offset-2 font-medium"
                >
                  {expanded ? t.readLess : t.readMore}
                  {expanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </motion.div>

            {/* What's included */}
            {includes.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-8"
              >
                <h2 className="text-lg font-bold text-foreground mb-4">
                  {t.includes}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {includes.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15"
                    >
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground/80">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tags */}
            {service.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-8"
              >
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  {t.tags}
                </p>
                <div className="flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full border border-border/40 bg-muted/20 text-muted-foreground hover:border-[#7b57fc]/30 hover:text-[#7b57fc] transition-colors cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── RIGHT: sticky sidebar ───────────────────────────────────── */}
          <aside className="lg:w-80 xl:w-88 shrink-0">
            <div className="sticky top-20 space-y-4">
              {/* Booking card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden"
              >
                {/* Price header */}
                <div className="px-6 py-5 bg-linear-to-br from-[#7b57fc]/8 to-transparent border-b border-border/30">
                  {service.priceFrom !== null ? (
                    <>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {t.priceFrom}
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-0.5 tabular-nums">
                        {service.priceCurrency}{" "}
                        {service.priceFrom.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}
                          {t.perSession}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-foreground">
                      {title}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div className="px-6 py-4 space-y-3 border-b border-border/30">
                  {duration && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" /> {t.duration}
                      </span>
                      <span className="font-medium text-foreground">
                        {duration}
                      </span>
                    </div>
                  )}
                  {service.deliveryFormat && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Zap className="w-4 h-4" /> {t.delivery}
                      </span>
                      <span className="font-medium text-foreground capitalize">
                        {t.deliveryFormat[
                          service.deliveryFormat as keyof typeof t.deliveryFormat
                        ] ?? service.deliveryFormat}
                      </span>
                    </div>
                  )}
                  {category && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="w-4 h-4" /> {t.category}
                      </span>
                      <span className="font-medium text-foreground">
                        {category}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="px-6 py-5 space-y-3">
                  <Link
                    href={`/dashboard/consulting?serviceId=${service.id}`}
                    className="block"
                  >
                    <Button className="w-full h-11 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-lg shadow-[#7b57fc]/25 gap-2 text-sm font-semibold">
                      <MessageSquare className="w-4 h-4" /> {t.requestService}
                    </Button>
                  </Link>
                  <Link href="/contact" className="block">
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl gap-2 text-sm"
                    >
                      <Calendar className="w-4 h-4" /> {t.contactTeam}
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Related services */}
              {related.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl border border-border/50 bg-card overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-border/30">
                    <h3 className="text-sm font-bold text-foreground">
                      {t.relatedTitle}
                    </h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {related.map((s) => (
                      <RelatedCard key={s.id} service={s} isAr={isAr} t={t} />
                    ))}
                  </div>
                  <div className="px-5 pb-4">
                    <Link href="/services">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full rounded-xl text-xs text-muted-foreground gap-1.5 hover:text-foreground"
                      >
                        {t.viewAll}{" "}
                        <ArrowRight
                          className={cn("w-3.5 h-3.5", isAr && "rotate-180")}
                        />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
