"use client";

// app/[locale]/(pages)/products/_components/products-page-hero.tsx
// Hero section for the public products listing page
// Shows: headline, search, stats, country badges, category quick-links

import { useState } from "react";
import { motion } from "motion/react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Flame,
  Search,
  TrendingUp,
  Star,
  Package,
  Globe,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Map emoji to country code for flag-icons
const flagToCode: Record<string, string> = {
  "🇨🇳": "cn",
  "🇺🇸": "us",
  "🇸🇦": "sa",
  "🇦🇪": "ae",
  "🇾🇪": "ye",
};

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
// Search bar
// ─────────────────────────────────────────────────────────────────────────────

function HeroSearch({
  isAr,
  onSearch,
}: {
  isAr: boolean;
  onSearch?: (q: string) => void;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(value.trim());
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      className="relative w-full max-w-lg mx-auto"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="relative flex items-center">
        <Search
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10",
            isAr ? "right-4" : "left-4",
          )}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            isAr
              ? "ابحث عن منتج إلكترونيات، ملابس، إكسسوارات…"
              : "Search products electronics, fashion, accessories…"
          }
          className={cn(
            "w-full h-12 bg-white dark:bg-card border border-border/60 rounded-2xl text-sm text-foreground",
            "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#7b57fc]/30 focus:border-[#7b57fc]/50",
            "shadow-sm transition-all",
            isAr ? "pr-12 pl-28" : "pl-12 pr-28",
          )}
        />
        <button
          type="submit"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-8 px-4 rounded-xl bg-[#7b57fc] text-white text-xs font-semibold",
            "hover:bg-[#6a48eb] transition-all shadow-sm shadow-[#7b57fc]/20",
            isAr ? "left-2" : "right-2",
          )}
        >
          {isAr ? "بحث" : "Search"}
        </button>
      </div>
    </motion.form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick category chips
// ─────────────────────────────────────────────────────────────────────────────

function QuickCategories({
  categories,
  isAr,
  onSelect,
}: {
  categories: { value: string; labelAr: string | null }[];
  isAr: boolean;
  onSelect?: (cat: string) => void;
}) {
  if (!categories.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="flex flex-wrap justify-center gap-2"
      dir={isAr ? "rtl" : "ltr"}
    >
      <span className="text-xs text-muted-foreground self-center">
        {isAr ? "تصفح حسب الفئة:" : "Browse by:"}
      </span>
      {categories.slice(0, 5).map((cat, i) => (
        <motion.button
          key={cat.value}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.06 }}
          onClick={() => onSelect?.(cat.value)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-border/60 bg-white/60 dark:bg-card/60 backdrop-blur-sm text-xs font-medium text-muted-foreground hover:text-[#7b57fc] hover:border-[#7b57fc]/40 hover:bg-white dark:hover:bg-card transition-all"
        >
          {isAr && cat.labelAr ? cat.labelAr : cat.value}
          <ChevronRight className={cn("w-3 h-3", isAr && "rotate-180")} />
        </motion.button>
      ))}
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

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-14 md:py-20">
        <div className="flex flex-col items-center gap-8">
          {/* ── Top badge ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7b57fc]/25 bg-[#7b57fc]/8"
          >
            <Flame className="w-3.5 h-3.5 text-[#7b57fc]" />
            <span className="text-xs font-semibold text-[#7b57fc]">
              {isAr
                ? "مُحدَّث يومياً من الأسواق العالمية"
                : "Updated daily from global markets"}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#7b57fc]" />
          </motion.div>

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

          {/* ── Search bar ── */}
          <div className="w-full max-w-lg">
            <HeroSearch isAr={isAr} onSearch={onSearch} />
          </div>

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

          {/* ── Category quick links ── */}
          <QuickCategories
            categories={categories}
            isAr={isAr}
            onSelect={onCategoryChange}
          />

          {/* ── Operating countries ── */}
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
              { flag: "🇨🇳", name: isAr ? "الصين" : "China" },
              { flag: "🇺🇸", name: isAr ? "أمريكا" : "USA" },
              { flag: "🇸🇦", name: isAr ? "السعودية" : "Saudi Arabia" },
              { flag: "🇦🇪", name: isAr ? "الإمارات" : "UAE" },
              { flag: "🇾🇪", name: isAr ? "اليمن" : "Yemen" },
            ].map(({ flag, name }, i) => {
              const code = flagToCode[flag];
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.75 + i * 0.05 }}
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <span className={`fi fi-${code} text-base`} />
                  <span className="hidden md:inline">{name}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
