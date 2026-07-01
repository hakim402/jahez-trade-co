"use client";

// app/[locale]/(pages)/blogs/_components/BlogHero.tsx

import { motion } from "motion/react";
import { BookOpen, TrendingUp, Tag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogHeroProps {
  isAr: boolean;
  totalCount: number;
  categories: { slug: string; name: string; postCount: number }[];
  tags: { slug: string; name: string; postCount: number }[];
}

export function BlogHero({
  isAr,
  totalCount,
  categories,
  tags,
}: BlogHeroProps) {
  const featuredTopicsCount = categories.length;
  const tagsCount = tags.length;

  return (
    <div className="relative overflow-hidden border-b border-border/50 bg-background">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[oklch(0.97_0.01_280)] dark:bg-[oklch(0.14_0.02_270)]" />
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.03] pointer-events-none" />

      {/* Orbs */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-150 h-75 rounded-full orb-brand pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full orb-brand pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full orb-brand pointer-events-none" />

      <div className="relative max-w-6xl mt-16 mx-auto px-4 md:px-6 lg:px-8 py-24">
        <div className="flex flex-col items-center gap-8">

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center space-y-3 max-w-2xl"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight">
              {isAr ? (
                <>
                  مدونة <span className="text-color">جاهز</span>  المعرفة طريقك
                  للنجاح
                </>
              ) : (
                <>
                  JAHEZ <span className="text-color">Blog</span> Knowledge
                  fuels success
                </>
              )}
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {isAr
                ? "اكتشف مقالات متخصصة في الاستيراد، الخدمات اللوجستية، ودخول الأسواق. نشاركك الخبرات وأفضل الممارسات."
                : "Discover expert articles on import, logistics, and market entry. We share insights and best practices."}
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <StatPill
              icon={BookOpen}
              value={`${totalCount}+`}
              label={isAr ? "مقالة" : "articles"}
              color="bg-color"
              delay={0.5}
            />
            <StatPill
              icon={TrendingUp}
              value={String(featuredTopicsCount)}
              label={isAr ? "مواضيع" : "topics"}
              color="bg-emerald-500"
              delay={0.55}
            />
            <StatPill
              icon={Tag}
              value={String(tagsCount)}
              label={isAr ? "وسوم" : "tags"}
              color="bg-amber-500"
              delay={0.6}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

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
