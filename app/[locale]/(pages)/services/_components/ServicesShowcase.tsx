"use client";

// app/[locale]/_components/ServicesShowcase.tsx
// Client component with motion animations — matches HomeBlogShowCase styling.

import { useState, useEffect, useRef } from "react";
import { useInView, motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Clock,
  Users,
  Star,
  Sparkles,
  ShoppingCart,
  Ship,
  Truck,
  Globe,
  Factory,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFeaturedConsultingServices } from "@/app/[locale]/(pages)/services/actions";
import type { PublicConsultingServiceCard } from "@/app/[locale]/(pages)/services/actions";
import type { ConsultingServiceTopic } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const TOPIC_ICONS: Record<ConsultingServiceTopic, React.ElementType> = {
  sourcing: ShoppingCart,
  import: Ship,
  logistics: Truck,
  market_entry: Globe,
  supplier: Factory,
  other: Briefcase,
};

const TOPIC_LABELS = {
  en: {
    sourcing: "Product Sourcing",
    import: "Import & Customs",
    logistics: "Logistics",
    market_entry: "Market Entry",
    supplier: "Supplier Sourcing",
    other: "General Consulting",
  },
  ar: {
    sourcing: "مصادر المنتجات",
    import: "الاستيراد والجمارك",
    logistics: "اللوجستيات",
    market_entry: "دخول الأسواق",
    supplier: "مصادر الموردين",
    other: "استشارة عامة",
  },
};

const T = {
  en: {
    badge: "Consulting Services",
    heading: "Expert guidance for every step",
    subheading:
      "From sourcing strategy to market entry — our specialists are ready to help.",
    from: "From",
    perSession: "/ session",
    featured: "Featured",
    requests: (n: number) => `${n} request${n !== 1 ? "s" : ""}`,
    viewAll: "View all services",
    viewDetail: "View details",
  },
  ar: {
    badge: "خدمات الاستشارة",
    heading: "إرشاد متخصص في كل خطوة",
    subheading:
      "من استراتيجية المصادر إلى دخول الأسواق — متخصصونا على أهبة الاستعداد.",
    from: "يبدأ من",
    perSession: "/ جلسة",
    featured: "مميز",
    requests: (n: number) => `${n} طلب`,
    viewAll: "عرض كل الخدمات",
    viewDetail: "عرض التفاصيل",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatPrice(price: number | null, currency: string, isAr: boolean) {
  if (price === null) return null;
  return new Intl.NumberFormat(isAr ? "ar-SA" : "en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// ─────────────────────────────────────────────────────────────────────────────
// Category Pill (matches blog style)
// ─────────────────────────────────────────────────────────────────────────────

function CategoryPill({
  label,
  icon: Icon,
  inverted = false,
}: {
  label: string;
  icon?: React.ElementType;
  inverted?: boolean;
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase
        ${
          inverted
            ? "bg-white/20 text-white backdrop-blur-sm border border-white/30"
            : "bg-(--brand)/10 text-(--brand) border border-(--brand)/20"
        }
      `}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Card (matches blog card structure)
// ─────────────────────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  locale,
  index,
  t,
}: {
  service: PublicConsultingServiceCard;
  locale: string;
  index: number;
  t: typeof T.en;
}) {
  const isAr = locale === "ar";
  const isRtl = isAr;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const title = (isAr ? service.titleAr : null) ?? service.title;
  const shortDesc = (isAr ? service.shortDescAr : null) ?? service.shortDesc;
  const duration = (isAr ? service.durationAr : null) ?? service.duration;
  const primaryImg =
    service.images.find((i) => i.isPrimary) ?? service.images[0];
  const TopicIcon = TOPIC_ICONS[service.topic];
  const topicLabel = TOPIC_LABELS[isAr ? "ar" : "en"][service.topic];
  const formattedPrice = formatPrice(
    service.priceFrom,
    service.priceCurrency,
    isAr
  );

  // Image error handling (like blog)
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.55,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group flex flex-col h-full"
    >
      <Link
        href={`/${locale}/services/${service.id}`}
        className="flex flex-col h-full rounded-2xl overflow-hidden border border-border/40 bg-card hover:border-(--brand)/40 hover:shadow-[0_8px_32px_rgba(123,87,252,0.12)] transition-all duration-400"
      >
        {/* Image area */}
        <div className="relative h-48 overflow-hidden bg-linear-to-br from-indigo-100 to-purple-50 dark:from-indigo-950 dark:to-purple-900/50 shrink-0">
          {primaryImg && !imgError ? (
            <Image
              src={primaryImg.url}
              alt={primaryImg.altText ?? title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImgError(true)}
              unoptimized // for user uploads
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <TopicIcon className="w-12 h-12 text-(--brand)/30" />
              {primaryImg && imgError && (
                <span className="absolute bottom-2 text-[10px] text-muted-foreground">
                  Image unavailable
                </span>
              )}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-(--brand)/0 group-hover:bg-(--brand)/8 transition-colors duration-400" />

          {/* Topic badge (like category) */}
          <div className={`absolute top-3 ${isRtl ? "right-3" : "left-3"}`}>
            <CategoryPill label={topicLabel} icon={TopicIcon} />
          </div>

          {/* Featured badge (if any) */}
          {service.isFeatured && (
            <div className={`absolute top-3 ${isRtl ? "left-3" : "right-3"}`}>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-md">
                <Star className="w-2.5 h-2.5 fill-white" /> {t.featured}
              </span>
            </div>
          )}
        </div>

        {/* Content body */}
        <div
          className={`flex flex-col grow p-5 gap-3 ${
            isRtl ? "text-right items-end" : "text-left items-start"
          }`}
        >
          <h3 className="font-bold text-base leading-snug text-foreground line-clamp-2 group-hover:text-(--brand) transition-colors duration-200">
            {title}
          </h3>

          {shortDesc && (
            <p className="text-muted-foreground text-sm line-clamp-2 grow">
              {shortDesc}
            </p>
          )}

          <div className="grow" />

          {/* Meta row: duration + requests */}
          <div className="w-full pt-3 border-t border-border/30 flex items-center justify-between gap-2 flex-wrap">
            {duration && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" /> {duration}
              </span>
            )}
            {service.requestCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" /> {t.requests(service.requestCount)}
              </span>
            )}
          </div>

          {/* Price + CTA row (like "read more" from blog) */}
          <div className="w-full flex items-center justify-between gap-3 mt-2">
            {formattedPrice && (
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">
                  {t.from}
                </p>
                <p className="text-base font-bold text-foreground tabular-nums">
                  {formattedPrice}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    {t.perSession}
                  </span>
                </p>
              </div>
            )}
            <span
              className={cn(
                "text-sm font-semibold text-(--brand) flex items-center gap-1.5",
                "group-hover:gap-2.5 transition-all"
              )}
            >
              {t.viewDetail}
              <ArrowRight
                className={cn(
                  "w-4 h-4 transition-transform group-hover:translate-x-0.5",
                  isRtl && "rotate-180 group-hover:-translate-x-0.5"
                )}
              />
            </span>
          </div>
        </div>

        {/* Animated bottom bar */}
        <div
          className={`h-0.5 bg-linear-to-r from-(--brand) to-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-400 ${
            isRtl ? "origin-right" : "origin-left"
          }`}
        />
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Header (identical to blog showcase)
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  cta,
  ctaHref,
  isRtl,
}: {
  title: string;
  cta?: string;
  ctaHref?: string;
  isRtl: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-center justify-between mb-10 ${
        isRtl ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`flex items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}
      >
        <div className="h-8 w-1 rounded-full bg-linear-to-b from-(--brand) to-indigo-400" />
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          {title}
        </h2>
      </div>
      {cta && ctaHref && (
        <Link
          href={ctaHref}
          className="text-sm font-medium text-(--brand) hover:opacity-75 transition-opacity flex items-center gap-1.5"
        >
          <span>{cta}</span>
          <span className="text-lg leading-none">{isRtl ? "←" : "→"}</span>
        </Link>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component (client with async data)
// ─────────────────────────────────────────────────────────────────────────────

interface ServicesShowcaseProps {
  isAr?: boolean;
  limit?: number;
  heading?: string;
  subheading?: string;
  hideHeader?: boolean;
  className?: string;
  locale?: string; // if not provided, we infer from isAr or default 'en'
}

export function ServicesShowcase({
  isAr = false,
  limit = 6,
  heading,
  subheading,
  hideHeader = false,
  className,
  locale: propLocale,
}: ServicesShowcaseProps) {
  const [services, setServices] = useState<PublicConsultingServiceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = propLocale ?? (isAr ? "ar" : "en");
  const isRtl = locale === "ar";
  const t = (isAr ? T.ar : T.en) as typeof T.en;

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      const data = await getFeaturedConsultingServices(limit);
      setServices(data);
      setLoading(false);
    }
    fetchServices();
  }, [limit]);

  if (services.length === 0 && !loading) return null;

  // Skeleton loader (matches blog skeleton)
  const SkeletonCard = () => (
    <div className="rounded-2xl overflow-hidden border border-border/40 bg-card">
      <div className="h-48 bg-muted animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-4/5 bg-muted animate-pulse rounded" />
        <div className="h-3 w-full bg-muted animate-pulse rounded" />
        <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
        <div className="pt-3 border-t border-border/30 flex justify-between">
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  );

  return (
    <section
      className={cn("w-full mt-20", className)}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header with badge (same as blog) */}
      {!hideHeader && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7b57fc]/10 border border-[#7b57fc]/20 mb-4">
            <Sparkles className="w-4 h-4 text-[#7b57fc]" />
            <span className="text-sm font-semibold text-[#7b57fc]">
              {t.badge}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-3">
            {heading ? (
              heading
            ) : isAr ? (
              <>
                {t.heading.split(" ").slice(0, -1).join(" ")}{" "}
                <span className="text-gradient">
                  {t.heading.split(" ").slice(-1)}
                </span>
              </>
            ) : (
              <>
                {t.heading.split(" ").slice(0, -1).join(" ")}{" "}
                <span className="text-gradient">
                  {t.heading.split(" ").slice(-1)}
                </span>
              </>
            )}
          </h2>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {subheading ?? t.subheading}
          </p>
        </motion.div>
      )}

      {/* Content container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 space-y-16">
        {/* Section header + grid */}
        <div>
          <SectionHeader
            title={t.heading}
            cta={t.viewAll}
            ctaHref={`/${locale}/services`}
            isRtl={isRtl}
          />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: limit }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : services.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              {isAr ? "لا توجد خدمات حالياً." : "No services found."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, idx) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  locale={locale}
                  index={idx}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All CTA button (like blog) */}
        {!loading && services.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-center pt-4"
          >
            <Link
              href={`/${locale}/services`}
              className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-full border border-(--brand)/30 bg-(--brand)/5 hover:bg-(--brand)/10 text-(--brand) font-semibold text-sm transition-all duration-300 hover:border-(--brand)/60"
            >
              <span>{t.viewAll}</span>
              <span
                className={`transition-transform duration-300 text-lg ${
                  isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"
                }`}
              >
                {isRtl ? "←" : "→"}
              </span>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}