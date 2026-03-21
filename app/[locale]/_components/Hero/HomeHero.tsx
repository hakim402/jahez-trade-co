"use client";

// app/[locale]/_components/hero.tsx

import { useState, useEffect, useRef } from "react";
import { motion, useInView, animate } from "motion/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  Package,
  Video,
  TrendingUp,
  CheckCircle,
  Clock,
  Zap,
  Star,
  ChevronRight,
  FileText,
  Truck,
  MessageSquare,
  Factory,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Animated counter hook
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(to: number, duration = 1.4, suffix = "") {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate(v) {
        setDisplay(Math.round(v).toLocaleString() + suffix);
      },
    });
    return () => controls.stop();
  }, [inView, to, duration, suffix]);

  return { ref, display };
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating status badge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({
  icon: Icon,
  label,
  color,
  className,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-white dark:bg-card rounded-full pl-2 pr-3.5 py-1.5",
        "shadow-lg shadow-black/8 border border-border/50",
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
      <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat counter card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  to,
  suffix,
  label,
  icon: Icon,
  delay,
}: {
  to: number;
  suffix?: string;
  label: string;
  icon: React.ElementType;
  delay: number;
}) {
  const { ref, display } = useCountUp(to, 1.6, suffix ?? "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center gap-1.5 px-5 py-4 rounded-2xl bg-card border border-border/50 hover:border-[#7b57fc]/30 transition-colors"
    >
      <Icon className="w-4 h-4 text-[#7b57fc] mb-0.5" />
      <span
        ref={ref}
        className="text-2xl font-bold text-foreground tabular-nums"
      >
        {display}
      </span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Service pill row
// ─────────────────────────────────────────────────────────────────────────────
function ServicePills({ isAr }: { isAr: boolean }) {
  const services = isAr
    ? [
        { icon: Package, label: "استيراد المنتجات", color: "bg-violet-500" },
        { icon: Video, label: "جلسات فيديو", color: "bg-blue-500" },
        { icon: Store, label: "جولات السوق", color: "bg-orange-500" },
        { icon: Factory, label: "زيارات المصانع", color: "bg-emerald-500" },
        { icon: TrendingUp, label: "منتجات رائجة", color: "bg-rose-500" },
        {
          icon: MessageSquare,
          label: "استشارات تجارية",
          color: "bg-amber-500",
        },
      ]
    : [
        { icon: Package, label: "Product Sourcing", color: "bg-violet-500" },
        { icon: Video, label: "Video Sessions", color: "bg-blue-500" },
        { icon: Store, label: "Market Tours", color: "bg-orange-500" },
        { icon: Factory, label: "Factory Visits", color: "bg-emerald-500" },
        { icon: TrendingUp, label: "Trending Products", color: "bg-rose-500" },
        { icon: MessageSquare, label: "Consulting", color: "bg-amber-500" },
      ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.1, duration: 0.5 }}
      className="flex flex-wrap justify-center gap-2"
    >
      {services.map(({ icon: Icon, label, color }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 + i * 0.06 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-background/80 backdrop-blur-sm text-xs font-medium text-muted-foreground hover:text-foreground hover:border-[#7b57fc]/40 transition-colors cursor-default"
        >
          <div
            className={cn(
              "w-3.5 h-3.5 rounded-full flex items-center justify-center",
              color,
            )}
          >
            <Icon className="w-2 h-2 text-white" />
          </div>
          {label}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Hero
// ─────────────────────────────────────────────────────────────────────────────
export function HomeHero() {
  const locale = useLocale();
  const isAr = locale === "ar";

  // Map emoji to country code for flag-icons
  const flagMap: Record<string, string> = {
    "🇸🇦": "sa",
    "🇾🇪": "ye",
    "🇦🇪": "ae",
    "🇨🇳": "cn",
    "🇺🇸": "us",
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-background pt-16 pb-10">
      {/* Background */}
      <div className="absolute inset-0 bg-[oklch(0.97_0.01_280)] dark:bg-[oklch(0.14_0.02_270)]" />
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.03] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: "52px 52px",
        }}
      />

      <div
        className="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8 w-full flex flex-col items-center gap-10 md:gap-14"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* ── Trust badge ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7b57fc]/25 bg-[#7b57fc]/8"
        >
          <div className="flex space-x-1">
            {["🇸🇦", "🇾🇪", "🇦🇪", "🇨🇳", "🇺🇸"].map((f, i) => (
              <span key={i} className={`fi fi-${flagMap[f]} text-sm`}></span>
            ))}
          </div>

          <span className="text-xs font-semibold text-[#7b57fc]">
            {isAr ? "نعمل في ٥ دول حول العالم" : "Operating across 5 countries"}
          </span>
          <Zap className="w-3 h-3 text-[#7b57fc]" />
        </motion.div>

        {/* ── Main headline ── */}
        <div className="text-center space-y-5 max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight"
          >
            {isAr ? (
              <>
                استورد أي منتج <span className="text-color">بثقة وسهولة</span>{" "}
                من الصين وأمريكا
              </>
            ) : (
              <>
                Source any product{" "}
                <span className="text-color">with confidence</span> from China &
                beyond
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
          >
            {isAr
              ? "أرسل طلبك، شاهد المصنع عبر الفيديو، استلم عرض سعر دقيق — كل شيء في منصة واحدة مع فريق متخصص في الصين وأمريكا."
              : "Submit your request, watch the factory live, receive an accurate quote — all in one platform with our specialist team on the ground in China and the USA."}
          </motion.p>
        </div>

        {/* ── CTA buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href={`/${locale}/dashboard/requests/new`}
            className="group flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#7b57fc] text-white text-sm font-semibold shadow-lg shadow-[#7b57fc]/30 hover:bg-[#6a48eb] hover:shadow-xl hover:shadow-[#7b57fc]/35 hover:-translate-y-0.5 transition-all"
          >
            <Package className="w-4 h-4" />
            {isAr ? "ابدأ طلبك الآن" : "Start your request"}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href={`/${locale}/dashboard/bookings/new`}
            className="group flex items-center gap-2 px-7 py-3.5 rounded-full border border-border/70 bg-background/80 backdrop-blur-sm text-sm font-semibold text-foreground hover:border-[#7b57fc]/50 hover:text-[#7b57fc] hover:-translate-y-0.5 transition-all"
          >
            <Video className="w-4 h-4" />
            {isAr ? "احجز جلسة فيديو" : "Book a video session"}
          </Link>
        </motion.div>

        {/* ── Service pills ── */}
        <ServicePills isAr={isAr} />
      </div>
    </section>
  );
}
