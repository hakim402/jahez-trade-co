"use client";

// app/[locale]/_components/FooterHero.tsx

import { useState, useEffect, useRef } from "react";
import { motion, useInView, animate } from "motion/react";
import { useLocale } from "next-intl";
import {
  Package,
  Video,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  FileText,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import SA from "country-flag-icons/react/3x2/SA";
import AE from "country-flag-icons/react/3x2/AE";
import YE from "country-flag-icons/react/3x2/YE";

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
// Floating request card mockup (fully translated)
// ─────────────────────────────────────────────────────────────────────────────
function RequestMockup() {
  const locale = useLocale();
  const isAr = locale === "ar";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
      className="hidden md:block absolute top-4 right-0 w-56 bg-white dark:bg-card rounded-2xl shadow-xl shadow-black/10 border border-border/50 p-3.5 z-20"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center">
          <Package className="w-3.5 h-3.5 text-[#7b57fc]" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-foreground">
            {isAr ? "طلب جديد" : "New Request"}
          </p>
          <p className="text-[9px] text-muted-foreground">
            {isAr ? "قبل دقيقتين" : "2 mins ago"}
          </p>
        </div>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
          {isAr ? "مقتبس" : "Quoted"}
        </span>
      </div>
      <p className="text-[9px] text-muted-foreground mb-2 truncate flex items-center gap-1">
        <CN className="w-3.5 h-3.5 inline-block" />
        {isAr
          ? "سماعات أذن لاسلكية - الكمية 500"
          : "Wireless Earbuds — Qty 500"}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {isAr ? "تقدير" : "Estimate"}
        </span>
        <span className="text-sm font-bold text-[#7b57fc]">$2,450</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating booking card mockup (fully translated)
// ─────────────────────────────────────────────────────────────────────────────
function BookingMockup() {
  const locale = useLocale();
  const isAr = locale === "ar";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 1.5 }}
      transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
      className="hidden md:block absolute bottom-16 left-0 w-52 bg-white dark:bg-card rounded-2xl shadow-xl shadow-black/10 border border-border/50 p-3.5 z-20"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-foreground">
            {isAr ? "زيارة المصنع" : "Factory Visit"}
          </p>
          <p className="text-[9px] text-muted-foreground">
            {isAr ? "مؤكد ✓" : "Confirmed ✓"}
          </p>
        </div>
      </div>
      <div className="bg-muted/40 rounded-xl px-3 py-1.5 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />{" "}
          {isAr ? "السبت · 10:00 ص" : "Sat · 10:00 AM"}
        </span>
        <span className="text-[9px] text-muted-foreground flex text-center justify-center gap-2">
          <Video className="text-color size-3.5" /> Zoom
        </span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating quote card (fully translated)
// ─────────────────────────────────────────────────────────────────────────────
function QuoteMockup() {
  const locale = useLocale();
  const isAr = locale === "ar";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -0.5 }}
      animate={{ opacity: 1, y: 0, rotate: -0.5 }}
      transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
      className="hidden md:block absolute bottom-4 right-4 w-48 bg-white dark:bg-card rounded-2xl shadow-xl shadow-black/10 border border-border/50 p-3 z-20"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <FileText className="w-3 h-3 text-[#7b57fc]" />
        <span className="text-[10px] font-bold text-foreground">
          {isAr ? "عرض السعر جاهز" : "Quote Ready"}
        </span>
        <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      <p className="text-[9px] text-muted-foreground mb-1.5 truncate">
        {isAr ? "شريط LED ذكي × 200" : "Smart LED Strip × 200"}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant={"ghost"}
          className="flex-1 text-[9px] font-bold py-1 rounded-lg bg-[#7b57fc] text-white"
        >
          {isAr ? "قبول" : "Accept"}
        </Button>
        <Button
          variant={"ghost"}
          className="flex-1 text-[9px] font-bold py-1 rounded-lg bg-muted text-muted-foreground"
        >
          {isAr ? "رفض" : "Decline"}
        </Button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Central orbit graphic — abstract globe showing routes (wider, bilingual)
// ─────────────────────────────────────────────────────────────────────────────
function OrbitGraphic({ isAr }: { isAr: boolean }) {
  // Define the country flags and labels with their SVG components
  const countries = isAr
    ? [
        { flag: CN, label: "الصين", angle: 315, dist: 90 },
        { flag: US, label: "الولايات المتحدة", angle: 45, dist: 90 },
        { flag: SA, label: "السعودية", angle: 180, dist: 82 },
        { flag: AE, label: "الإمارات", angle: 135, dist: 90 },
        { flag: YE, label: "اليمن", angle: 225, dist: 82 },
      ]
    : [
        { flag: CN, label: "China", angle: 315, dist: 90 },
        { flag: US, label: "USA", angle: 45, dist: 90 },
        { flag: SA, label: "Saudi Arabia", angle: 180, dist: 82 },
        { flag: AE, label: "UAE", angle: 135, dist: 90 },
        { flag: YE, label: "Yemen", angle: 225, dist: 82 },
      ];

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Outer dashed ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-dashed border-indigo-500"
      />
      {/* Inner ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-6 rounded-full border border-indigo-200"
      />
      {/* Center logo / platform icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
          className="group relative w-20 h-20 rounded-2xl bg-background shadow-xl shadow-indigo-500/30 flex items-center justify-center overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-60 group-hover:opacity-80 transition" />
          {/* Logo */}
          <div className="relative w-60 h-60">
            <Image
              src="/logo/icon.png"
              alt="Platform logo"
              fill
              className="object-contain"
              sizes="80px"
              priority
            />
          </div>
          {/* Optional subtle ring */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
        </motion.div>
      </div>
      {/* Country nodes on orbit */}
      {countries.map(({ flag: FlagComponent, label, angle, dist }, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * dist;
        const y = Math.sin(rad) * dist;

        return (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.5 + i * 0.12,
              duration: 0.4,
              type: "spring",
            }}
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Connection line to center — subtle */}
            <div
              className="absolute w-px bg-linear-to-b from-[#7b57fc]/30 to-transparent"
              style={{
                height: `${dist - 36}px`,
                transformOrigin: "top center",
                transform: `rotate(${angle + 180}deg)`,
                top: "50%",
              }}
            />
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-card shadow-md shadow-black/10 border border-border/50 flex items-center justify-center z-10">
              <FlagComponent className="w-6 h-6" />
            </div>
            <span className="text-[8px] font-medium text-muted-foreground whitespace-nowrap z-10">
              {label}
            </span>
          </motion.div>
        );
      })}
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
// Main Hero
// ─────────────────────────────────────────────────────────────────────────────
export function FooterHero() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-background pt-16 pb-20">
      <div
        className="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8 w-full flex flex-col items-center gap-10 md:gap-14"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* ── Main visual: orbit + floating cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="relative w-full max-w-2xl mx-auto"
          style={{ height: 360 }}
        >
          {/* Center orbit */}
          <div className="absolute inset-0 flex items-center justify-center">
            <OrbitGraphic isAr={isAr} />
          </div>

          {/* Floating cards */}
          <RequestMockup />
          <BookingMockup />
          <QuoteMockup />

          {/* Status pills */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="absolute top-1/2 -translate-y-1/2 -left-4 hidden md:block"
          >
            <StatusBadge
              icon={CheckCircle}
              label={isAr ? "عرض سعر جاهز ✓" : "Quote approved ✓"}
              color="bg-emerald-500"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.35, duration: 0.4 }}
            className="absolute top-1/3 -right-4 hidden md:block"
          >
            <StatusBadge
              icon={Truck}
              label={isAr ? "تم الشحن · ٥ أيام" : "Shipped · 5 days"}
              color="bg-[#7b57fc]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 hidden sm:block"
          >
            <StatusBadge
              icon={Star}
              label={isAr ? "4.9 · 200+ عميل راضٍ" : "4.9 · 200+ happy clients"}
              color="bg-amber-500"
            />
          </motion.div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mx-auto"
        >
          <StatCard
            to={500}
            suffix="+"
            label={isAr ? "مورد موثوق" : "Verified suppliers"}
            icon={Package}
            delay={0}
          />
          <StatCard
            to={48}
            suffix="h"
            label={isAr ? "وقت الاستجابة" : "Avg. response time"}
            icon={Clock}
            delay={0.08}
          />
          <StatCard
            to={200}
            suffix="+"
            label={isAr ? "عميل راضٍ" : "Happy clients"}
            icon={Star}
            delay={0.16}
          />
          <StatCard
            to={5}
            suffix="+"
            label={isAr ? "دول نعمل فيها" : "Countries served"}
            icon={TrendingUp}
            delay={0.24}
          />
        </motion.div>
      </div>
    </section>
  );
}
