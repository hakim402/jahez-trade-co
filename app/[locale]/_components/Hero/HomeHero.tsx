"use client";

// app/[locale]/_components/Hero/HomeHero.tsx

import { useState, useEffect, useRef } from "react";
import { motion, useInView, animate } from "motion/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  Package,
  Video,
  TrendingUp,
  Zap,
  MessageSquare,
  Factory,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SA from "country-flag-icons/react/3x2/SA";
import YE from "country-flag-icons/react/3x2/YE";
import AE from "country-flag-icons/react/3x2/AE";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import IpadPreview from "./IpadPreview";

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
      className="flex flex-wrap justify-center gap-2 hidden sm:flex"
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Hero
// ─────────────────────────────────────────────────────────────────────────────
export function HomeHero() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const whatsapp = (
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT ?? "+86 152 6866 4202"
  ).replace(/\D/g, "");
  const msg = encodeURIComponent(
    isAr ? "مرحباً، أحتاج مساعدة" : "Hello, I need help",
  );

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-background pt-24 pb-10">
      {/* Background */}
      <div className="absolute inset-0 bg-[oklch(0.97_0.01_280)] dark:bg-[oklch(0.14_0.02_270)]" />
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" />

      <div
        className="relative max-w-6xl mt-16 mx-auto px-4 md:px-6 lg:px-8 w-full flex flex-col items-center gap-10 md:gap-14"
        dir={isAr ? "rtl" : "ltr"}
      >
       

        {/* ── Main headline ── */}
        <div className="text-center space-y-5 max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight"
          >
            {isAr ? (
              <span className="leading-normal">
                استورد أي منتج <span className="text-color">بثقة وسهولة</span>{" "}
                من الصين وأمريكا
              </span>
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
              ? "أرسل طلبك، شاهد المصنع عبر الفيديو، استلم عرض سعر دقيق كل شيء في منصة واحدة مع فريق متخصص في الصين وأمريكا."
              : "Submit your request, watch the factory live, receive an accurate quote all in one platform with our specialist team on the ground in China and the USA."}
          </motion.p>
        </div>

        {/* ── CTA buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center gap-3 w-full max-w-md mx-auto"
        >
          {/* WhatsApp */}
          <a
            href={`https://wa.me/${whatsapp}?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span className="whitespace-nowrap">
              {isAr ? "واتساب مباشر" : "Chat on WhatsApp"}
            </span>
            <ArrowRight
              className={cn(
                "w-4 h-4 transition-transform group-hover:translate-x-1",
                isAr && "rotate-180",
              )}
            />
          </a>

          {/* Video Booking */}
          <Link
            href={`/${locale}/dashboard/bookings`}
            className="group flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-border/70 bg-background/80 backdrop-blur-sm text-[10px] sm:text-sm font-semibold text-foreground hover:border-[#7b57fc]/50 hover:text-[#7b57fc] hover:-translate-y-0.5 transition-all whitespace-nowrap"
          >
            <Video className="w-4 h-4" />
            {isAr ? "احجز جلسة فيديو" : "Book a video session"}
          </Link>
        </motion.div>

        {/* ── Service pills ── */}
        <ServicePills isAr={isAr} />
        <IpadPreview />
      </div>
    </section>
  );
}
