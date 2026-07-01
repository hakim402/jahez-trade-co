"use client";

// app/[locale]/(pages)/products/_components/products-page-hero.tsx

import { useState } from "react";
import { motion } from "motion/react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Flame,
  Star,
  Package,
  Globe,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import SA from "country-flag-icons/react/3x2/SA";
import AE from "country-flag-icons/react/3x2/AE";
import YE from "country-flag-icons/react/3x2/YE";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ProductsHeroProps {
  isAr: boolean;
  totalCount: number;
  categories?: { value: string; labelAr: string | null }[];
  featuredCount?: number;
  onSearch?: (q: string) => void;
  onCategoryChange?: (cat: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Trend score ring visual
// ─────────────────────────────────────────────────────────────────────────────

function TrendRing({
  score,
  label,
  delay,
  className,
}: {
  score: number;
  label: string;
  delay: number;
  className?: string;
}) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#ef4444" : score >= 60 ? "#f97316" : "#7b57fc";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "bg-white dark:bg-card rounded-2xl shadow-md shadow-black/8 border border-border/50 p-3 flex items-center gap-2.5",
        className,
      )}
    >
      <div className="relative w-12 h-12 shrink-0">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="3"
          />
          <motion.circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ delay: delay + 0.3, duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-foreground tabular-nums">
            {score}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium">
          Trend
        </p>
        <p className="text-[11px] font-semibold text-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat pill
// ─────────────────────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  value,
  label,
  color,
  delay,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 dark:bg-card/70 backdrop-blur-sm border border-border/50 shadow-sm"
    >
      <div
        className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
          color,
        )}
      >
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground tabular-nums leading-none">
          {value}
        </p>
        <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function ProductsPageHero({
  isAr,
  totalCount,
  categories = [],
  featuredCount = 0,
  onSearch,
  onCategoryChange,
}: ProductsHeroProps) {
  return (
    <div className="relative overflow-hidden border-b border-border/50 bg-background">
      {/* ── Background layers ── */}
      {/* Lavender wash matches the rest of the homepage sections */}
      <div className="absolute inset-0 bg-[oklch(0.97_0.01_280)] dark:bg-[oklch(0.14_0.02_270)]" />
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.03] pointer-events-none" />

      {/* Orbs */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-150 h-75 rounded-full orb-brand pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full orb-brand pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full orb-brand pointer-events-none" />

      <div className="relative max-w-6xl mt-16 mx-auto px-4 md:px-6 lg:px-8 py-24">
        <div className="flex flex-col items-center gap-8">
          

          {/* ── Headline ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center space-y-3 max-w-2xl"
            dir={isAr ? "rtl" : "ltr"}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight">
              {isAr ? (
                <>
                  اكتشف <span className="text-color">المنتجات الرائجة</span> من
                  كل مكان
                </>
              ) : (
                <>
                  Discover <span className="text-color">trending products</span>{" "}
                  from everywhere
                </>
              )}
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {isAr
                ? "منتجات مُختارة بعناية من الصين، أمريكا، وغيرها. اطلب أي منتج بنقرة واحدة ودعنا نتكفل بالباقي."
                : "Hand-picked products from China, the USA, and beyond. Request anything with one click and let us handle the rest."}
            </p>
          </motion.div>

          {/* ── Stats row ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {totalCount > 0 && (
              <StatPill
                icon={Package}
                value={`${totalCount}+`}
                label={isAr ? "منتج متاح" : "products"}
                color="bg-[#7b57fc]"
                delay={0.5}
              />
            )}
            {featuredCount > 0 && (
              <StatPill
                icon={Star}
                value={String(featuredCount)}
                label={isAr ? "منتج مميز" : "featured"}
                color="bg-amber-500"
                delay={0.55}
              />
            )}
            <StatPill
              icon={Globe}
              value="5"
              label={isAr ? "دول" : "countries"}
              color="bg-emerald-500"
              delay={0.6}
            />
            <StatPill
              icon={Zap}
              value="48h"
              label={isAr ? "وقت الرد" : "response"}
              color="bg-blue-500"
              delay={0.65}
            />
          </motion.div>

          {/* ── Operating countries with SVG flags ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
              {isAr ? "مصادر منتجاتنا" : "Sourced from"}
            </span>
            {[
              { name: isAr ? "الصين" : "China", flag: CN },
              { name: isAr ? "أمريكا" : "USA", flag: US },
              { name: isAr ? "السعودية" : "Saudi Arabia", flag: SA },
              { name: isAr ? "الإمارات" : "UAE", flag: AE },
              { name: isAr ? "اليمن" : "Yemen", flag: YE },
            ].map(({ name, flag: FlagComponent }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.75 + i * 0.05 }}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <FlagComponent className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">{name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
