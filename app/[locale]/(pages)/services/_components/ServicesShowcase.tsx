// app/[locale]/_components/ServicesShowcase.tsx
//
// Lightweight server component — safe to drop into any page.
// Fetches featured services at build/request time (no client JS needed).
// Pass isAr={locale === "ar"} from the parent server component.
//
// Usage:
//   import { ServicesShowcase } from "@/app/[locale]/_components/ServicesShowcase"
//   <ServicesShowcase isAr={isAr} limit={6} />

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShoppingCart,
  Ship,
  Truck,
  Globe,
  Factory,
  Briefcase,
  Clock,
  Users,
  Star,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFeaturedConsultingServices } from "@/app/[locale]/(pages)/services/actions";
import type { PublicConsultingServiceCard } from "@/app/[locale]/(pages)/services/actions";
import type { ConsultingServiceTopic } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Config
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
// Service card (pure server-rendered, no JS)
// ─────────────────────────────────────────────────────────────────────────────

function ShowcaseCard({
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
  const duration = (isAr ? service.durationAr : null) ?? service.duration;
  const primaryImg =
    service.images.find((i) => i.isPrimary) ?? service.images[0];
  const TopicIcon = TOPIC_ICONS[service.topic];
  const topicLabel = TOPIC_LABELS[isAr ? "ar" : "en"][service.topic];

  return (
    <Link
      href={`/services/${service.id}`}
      className="group relative rounded-2xl border border-border/40 bg-card overflow-hidden flex flex-col
                 hover:border-[#7b57fc]/30 hover:shadow-xl hover:shadow-[#7b57fc]/5
                 transition-all duration-300"
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
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#7b57fc]/8 to-[#7b57fc]/3">
            <TopicIcon className="w-12 h-12 text-[#7b57fc]/25" />
          </div>
        )}

        {/* Topic badge */}
        <div className={cn("absolute top-3", isAr ? "right-3" : "left-3")}>
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full
                           bg-background/90 backdrop-blur-sm border border-border/40 text-foreground shadow-sm"
          >
            <TopicIcon className="w-3 h-3 text-[#7b57fc]" />
            {topicLabel}
          </span>
        </div>

        {/* Featured badge */}
        {service.isFeatured && (
          <div className={cn("absolute top-3", isAr ? "left-3" : "right-3")}>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full
                             bg-amber-500 text-white shadow-md"
            >
              <Star className="w-2.5 h-2.5 fill-white" /> {t.featured}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-base font-bold text-foreground group-hover:text-[#7b57fc] transition-colors line-clamp-2 leading-snug">
          {title}
        </h3>
        {shortDesc && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed flex-1">
            {shortDesc}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 pt-3 border-t border-border/30">
          {duration && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" /> {duration}
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

          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold text-[#7b57fc]",
              "group-hover:gap-2.5 transition-all",
            )}
          >
            {t.viewDetail}
            <ArrowRight
              className={cn(
                "w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5",
                isAr &&
                  "rotate-180 group-hover:-translate-x-0.0 group-hover:translate-x-5",
              )}
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — server component
// ─────────────────────────────────────────────────────────────────────────────

interface ServicesShowcaseProps {
  isAr?: boolean;
  limit?: number;
  /** Override heading / subheading for different placement contexts */
  heading?: string;
  subheading?: string;
  /** Hide the header section (e.g. when embedding inside a section with its own header) */
  hideHeader?: boolean;
  /** Additional wrapper className */
  className?: string;
  locale?: string;
}

export async function ServicesShowcase({
  isAr = false,
  limit = 6,
  heading,
  subheading,
  hideHeader = false,
  className,
}: ServicesShowcaseProps) {
  const services = await getFeaturedConsultingServices(limit);
  const t = (isAr ? T.ar : T.en) as typeof T.en;

  if (services.length === 0) return null;

  return (
    <section
      className={cn(
        "relative py-16 md:py-24 overflow-hidden bg-background",
        className,
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        {!hideHeader && (
          <div className="mb-10 max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full border border-[#7b57fc]/25 bg-[#7b57fc]/8 text-xs font-semibold text-[#7b57fc] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {t.badge}
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
              {heading ?? t.heading}
            </h2>

            <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
              {subheading ?? t.subheading}
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => (
            <ShowcaseCard
              key={service.id}
              service={service}
              isAr={isAr}
              t={t}
            />
          ))}
        </div>

        {/* View all CTA */}
        <div
          className={cn("flex mt-8", isAr ? "justify-start" : "justify-start")}
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#7b57fc] hover:text-[#6a48eb]
                     border border-[#7b57fc]/30 hover:border-[#7b57fc]/60 bg-[#7b57fc]/5 hover:bg-[#7b57fc]/10
                     px-5 py-2.5 rounded-xl transition-all group"
          >
            {t.viewAll}
            <ArrowRight
              className={cn(
                "w-4 h-4 group-hover:translate-x-0.5 transition-transform",
                isAr &&
                  "rotate-180 group-hover:-translate-x-0.0 group-hover:translate-x-5",
              )}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
