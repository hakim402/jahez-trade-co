"use client";

// app/[locale]/_components/feature-sections.tsx
// Alternating feature sections with floating UI mockup cards
// Fully bilingual AR/EN

import { motion } from "motion/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  Package,
  CheckCircle,
  Clock,
  TrendingUp,
  Star,
  Truck,
  FileText,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Floating mockup sub-components ──────────────────────────────────────────

function RequestCard({
  product,
  status,
  price,
  delay = 0,
  className,
  isAr = false,
}: {
  product: string;
  status: "submitted" | "quoted" | "approved" | "shipped";
  price?: string;
  delay?: number;
  className?: string;
  isAr?: boolean;
}) {
  const STATUS = {
    submitted: {
      label: "Submitted",
      labelAr: "تم الإرسال",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    },
    quoted: {
      label: "Quoted",
      labelAr: "تم التسعير",
      color:
        "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    },
    approved: {
      label: "Approved",
      labelAr: "مقبول",
      color:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    },
    shipped: {
      label: "Shipped",
      labelAr: "تم الشحن",
      color:
        "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
    },
  };
  const s = STATUS[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={cn(
        "bg-white dark:bg-card rounded-2xl shadow-lg shadow-black/8 border border-border/40 p-3.5 w-64",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-[#7b57fc]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">
            {product}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            <span className="fi fi-cn mr-1"></span> {isAr ? "الصين" : "China"} ·{" "}
            {isAr ? "الكمية:" : "Qty:"} 100
          </p>
        </div>
        <span
          className={cn(
            "text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0",
            s.color,
          )}
        >
          {isAr ? s.labelAr : s.label}
        </span>
      </div>
      {price && (
        <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {isAr ? "السعر التقديري" : "Estimated price"}
          </span>
          <span className="text-sm font-bold text-[#7b57fc]">{price}</span>
        </div>
      )}
    </motion.div>
  );
}

function QuoteCard({
  amount,
  currency,
  product,
  validity,
  delay = 0,
  className,
  isAr = false,
}: {
  amount: string;
  currency: string;
  product: string;
  validity: string;
  delay?: number;
  className?: string;
  isAr?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={cn(
        "bg-white dark:bg-card rounded-2xl shadow-lg shadow-black/8 border border-border/40 p-4 w-60",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-[#7b57fc]" />
        <span className="text-xs font-semibold text-foreground">
          {isAr ? "عرض السعر جاهز" : "Quote Ready"}
        </span>
        <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      <p className="text-[10px] text-muted-foreground truncate mb-1">
        {product}
      </p>
      <p className="text-2xl font-bold text-foreground tabular-nums">
        {amount}{" "}
        <span className="text-sm font-medium text-muted-foreground">
          {currency}
        </span>
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {isAr ? "صالح حتى" : "Valid until"} {validity}
        </span>
        <div className="flex gap-1">
          <Button
            variant={"ghost"}
            className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold"
          >
            {isAr ? "قبول" : "Accept"}
          </Button>
          <Button
            variant={"ghost"}
            className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold"
          >
            {isAr ? "رفض" : "Decline"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function NotificationPill({
  icon: Icon,
  text,
  color,
  delay = 0,
  className,
}: {
  icon: React.ElementType;
  text: string;
  color: string;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "flex items-center gap-2 bg-white dark:bg-card rounded-full pl-2 pr-3 py-1.5 shadow-md shadow-black/8 border border-border/40 w-fit",
        className,
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center",
          color,
        )}
      >
        <Icon className="w-3 h-3 text-white" />
      </div>
      <span className="text-[10px] font-semibold text-foreground whitespace-nowrap">
        {text}
      </span>
    </motion.div>
  );
}

function StatsChip({
  value,
  label,
  delay = 0,
  className,
}: {
  value: string;
  label: string;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "bg-white dark:bg-card rounded-2xl shadow-lg shadow-black/8 border border-border/40 px-4 py-3 text-center",
        className,
      )}
    >
      <p className="text-xl font-bold text-[#7b57fc] tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

// ─── MOCKUP 1 — Product Requests ─────────────────────────────────────────────

function RequestsMockup() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="relative w-full h-72 md:h-80">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full orb-brand" />
      </div>

      {/* Main card */}
      <RequestCard
        product={isAr ? "سماعات لاسلكية برو" : "Wireless Earbuds Pro"}
        status="quoted"
        price={isAr ? "$1,240" : "$1,240"}
        delay={0.1}
        className="absolute top-2 left-1/2 -translate-x-1/2 z-20"
        isAr={isAr}
      />

      {/* Secondary card - slightly behind and below */}
      <RequestCard
        product={isAr ? "شريط LED ذكي ٥م" : "Smart LED Strip 5m"}
        status="shipped"
        delay={0.25}
        className="absolute top-20 left-1/2 -translate-x-1/3 translate-y-8 z-10 opacity-80 scale-95"
        isAr={isAr}
      />

      {/* Notification pills */}
      <NotificationPill
        icon={CheckCircle}
        text={isAr ? "تم قبول العرض ✓" : "Quote approved!"}
        color="bg-emerald-500"
        delay={0.4}
        className="absolute bottom-4 left-4 z-30"
      />
      <NotificationPill
        icon={Truck}
        text={isAr ? "تم الشحن · متوقع خلال ٥ أيام" : "Shipped · ETA 5 days"}
        color="bg-[#7b57fc]"
        delay={0.5}
        className="absolute bottom-4 right-4 z-30"
      />

      {/* Stats chips */}
      <StatsChip
        value="48h"
        label={isAr ? "متوسط الرد" : "Avg. response"}
        delay={0.35}
        className="absolute top-4 right-0 z-30"
      />
    </div>
  );
}

// ─── MOCKUP 2 — Quotes & Consulting ──────────────────────────────────────────

function QuotesMockup() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="relative w-full h-72 md:h-80">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full orb-brand" />
      </div>

      {/* Main quote card */}
      <QuoteCard
        amount="3,850"
        currency="USD"
        product={
          isAr
            ? "سماعة بلوتوث محمولة × 200"
            : "Portable Bluetooth Speaker × 200"
        }
        validity={isAr ? "30 يونيو" : "Jun 30"}
        delay={0.1}
        className="absolute top-2 right-1/2 translate-x-1/2 z-20"
        isAr={isAr}
      />

      {/* Notification pills */}
      <NotificationPill
        icon={MessageSquare}
        text={isAr ? "رد المشرف على طلبك" : "Admin replied to your request"}
        color="bg-blue-500"
        delay={0.35}
        className="absolute top-52 left-0 z-30"
      />
      <NotificationPill
        icon={ShieldCheck}
        text={isAr ? "الدفع مؤمن" : "Payment secured"}
        color="bg-emerald-500"
        delay={0.45}
        className="absolute bottom-2 right-2 z-30"
      />

      {/* Stats chips */}
      <StatsChip
        value="500+"
        label={isAr ? "مورد" : "Suppliers"}
        delay={0.3}
        className="absolute top-4 left-0 z-30"
      />
      <StatsChip
        value="98%"
        label={isAr ? "رضا العملاء" : "Satisfaction"}
        delay={0.4}
        className="absolute top-4 right-0 z-30"
      />
    </div>
  );
}

// ─── Feature Section Row ──────────────────────────────────────────────────────

interface FeatureRowProps {
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  mockup: React.ReactNode;
  reverse?: boolean;
  isAr?: boolean;
}

function FeatureRow({
  tag,
  title,
  subtitle,
  description,
  ctaLabel,
  ctaHref,
  mockup,
  reverse = false,
  isAr = false,
}: FeatureRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center",
        reverse && "md:[&>*:first-child]:order-2",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Text side */}
      <motion.div
        initial={{ opacity: 0, x: reverse ? 24 : -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={cn(
          "flex flex-col gap-5",
          reverse ? "md:text-right" : "md:text-left",
          "text-center",
        )}
      >
        {/* Tag */}
        <span className="inline-flex items-center justify-center md:justify-start gap-1.5 text-xs font-semibold text-[#7b57fc] uppercase tracking-wider">
          <span className="w-4 h-px bg-[#7b57fc]" />
          {tag}
        </span>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-sm font-semibold text-color">{subtitle}</p>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">
          {description}
        </p>

        {/* CTA */}
        <div className="flex justify-center md:justify-start">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#7b57fc] text-white text-sm font-semibold hover:bg-[#6a48eb] transition-all shadow-md shadow-[#7b57fc]/25 hover:shadow-lg hover:shadow-[#7b57fc]/30 hover:-translate-y-0.5"
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Mockup side */}
      <motion.div
        initial={{ opacity: 0, x: reverse ? -24 : 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {mockup}
      </motion.div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function FeatureSections() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const features = isAr
    ? [
        {
          tag: "طلبات المنتجات",
          title: "استورد أي منتج من أي مكان",
          subtitle: "نتابع طلبك خطوة بخطوة حتى يصلك",
          description:
            "أرسل رابط المنتج أو وصفه وسيتولى فريقنا التفاوض مع الموردين في الصين وأمريكا وغيرها وإيصاله إليك بأفضل سعر.",
          ctaLabel: "ابدأ طلبك الآن",
          ctaHref: `/${locale}/dashboard/requests/new`,
          mockup: <RequestsMockup />,
          reverse: false,
        },
        {
          tag: "عروض الأسعار",
          title: "عروض أسعار دقيقة وسريعة",
          subtitle: "شفافية كاملة في التسعير",
          description:
            "يستلم فريقنا طلبك ويُرسل لك عرض سعر تفصيلياً خلال 48 ساعة. وافق على العرض بنقرة واحدة وسنبدأ التنفيذ فوراً.",
          ctaLabel: "تعرف على خدماتنا",
          ctaHref: `/${locale}/about`,
          mockup: <QuotesMockup />,
          reverse: true,
        },
      ]
    : [
        {
          tag: "Product Requests",
          title: "Source any product from anywhere",
          subtitle: "We handle everything from factory to your door",
          description:
            "Share a product link or description and our team negotiates with suppliers in China, the USA, and more — delivering it to you at the best price.",
          ctaLabel: "Start your request",
          ctaHref: `/${locale}/dashboard/requests/new`,
          mockup: <RequestsMockup />,
          reverse: false,
        },
        {
          tag: "Quotes & Pricing",
          title: "Fast, transparent quotes",
          subtitle: "Know exactly what you pay before you commit",
          description:
            "Our team reviews your request and sends a detailed quote within 48 hours. Approve with one click and we begin sourcing immediately.",
          ctaLabel: "Learn about our services",
          ctaHref: `/${locale}/about`,
          mockup: <QuotesMockup />,
          reverse: true,
        },
      ];

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Lavender section background — matches the reference image */}
      <div className="absolute inset-0 bg-[oklch(0.97_0.01_280)] dark:bg-[oklch(0.14_0.02_270)]" />

      {/* Subtle dot pattern */}
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.025]" />

      {/* Large orb top-right */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full orb-brand" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full orb-brand" />

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col gap-20 md:gap-28">
        {features.map((feature, i) => (
          <FeatureRow key={i} {...feature} isAr={isAr} />
        ))}
      </div>
    </section>
  );
}
