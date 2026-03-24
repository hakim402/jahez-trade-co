"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Search,
  Star,
  TrendingUp,
  Zap,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsultingServiceTopic } from "@prisma/client";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import SA from "country-flag-icons/react/3x2/SA";
import AE from "country-flag-icons/react/3x2/AE";
import YE from "country-flag-icons/react/3x2/YE";

interface ServicesHero {
  isAr: boolean;
  totalCount: number;
  featuredCount: number;
  topics: { topic: ConsultingServiceTopic; count: number }[];
  categories: { category: string; categoryAr: string | null; count: number }[];
}

export function ServicesHero({
  isAr,
  totalCount,
  featuredCount,
  topics,
  categories,
}: ServicesHero) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || "",
  );

  const updateUrl = (params: Record<string, string | undefined>) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value && value.trim()) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    });
    // Reset to page 1 when filters change
    current.set("page", "1");
    router.push(`${pathname}?${current.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search: searchValue.trim() });
  };

  const handleTopicClick = (topic: ConsultingServiceTopic) => {
    const currentTopic = searchParams.get("topic");
    updateUrl({ topic: currentTopic === topic ? undefined : topic });
  };

  const handleCategoryClick = (category: string) => {
    const currentCategory = searchParams.get("category");
    updateUrl({
      category: currentCategory === category ? undefined : category,
    });
  };

  return (
    <div className="relative overflow-hidden border-b border-border/50 bg-background">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[oklch(0.97_0.01_280)] dark:bg-[oklch(0.14_0.02_270)]" />
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.03] pointer-events-none" />

      {/* Orbs */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-150 h-75 rounded-full orb-brand pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full orb-brand pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full orb-brand pointer-events-none" />

      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" />

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-20">
        <div className="flex flex-col items-center gap-8">
          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7b57fc]/25 bg-[#7b57fc]/8"
          >
            <Briefcase className="w-3.5 h-3.5 text-[#7b57fc]" />
            <span className="text-xs font-semibold text-[#7b57fc]">
              {isAr
                ? "خدمات استشارية متخصصة من خبراء الصناعة"
                : "Expert consulting services from industry specialists"}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#7b57fc]" />
          </motion.div>

          {/* Headline */}
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
                  خدمات <span className="text-color">استشارية متخصصة</span>{" "}
                  لنجاح أعمالك
                </>
              ) : (
                <>
                  Expert <span className="text-color">consulting services</span>{" "}
                  for your business success
                </>
              )}
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {isAr
                ? "من مصادر المنتجات إلى دخول الأسواق فريقنا يساعدك في كل خطوة من رحلة الاستيراد والتوريد"
                : "From product sourcing to market entry our team guides you through every step of your import and supply journey"}
            </p>
          </motion.div>



          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {totalCount > 0 && (
              <StatPill
                icon={Briefcase}
                value={`${totalCount}+`}
                label={isAr ? "خدمة متاحة" : "services"}
                color="bg-[#7b57fc]"
                delay={0.5}
              />
            )}
            {featuredCount > 0 && (
              <StatPill
                icon={Star}
                value={String(featuredCount)}
                label={isAr ? "خدمة مميزة" : "featured"}
                color="bg-amber-500"
                delay={0.55}
              />
            )}
            <StatPill
              icon={TrendingUp}
              value={String(topics.length)}
              label={isAr ? "مجالات" : "topics"}
              color="bg-emerald-500"
              delay={0.6}
            />
            <StatPill
              icon={Zap}
              value="24h"
              label={isAr ? "وقت الرد" : "response"}
              color="bg-blue-500"
              delay={0.65}
            />
          </motion.div>


          {/* Global presence (using SVG flags) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
              {isAr ? "خبراء في" : "Experts in"}
            </span>
            {[
              { country: "China", nameAr: "الصين", flag: CN },
              { country: "USA", nameAr: "أمريكا", flag: US },
              { country: "Saudi Arabia", nameAr: "السعودية", flag: SA },
              { country: "UAE", nameAr: "الإمارات", flag: AE },
              { country: "Yemen", nameAr: "اليمن", flag: YE },
            ].map(({ country, nameAr, flag: FlagComponent }, i) => (
              <motion.div
                key={country}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.75 + i * 0.05 }}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <FlagComponent className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">
                  {isAr ? nameAr : country}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Helper components
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