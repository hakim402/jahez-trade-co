"use client";

// app/[locale]/(pages)/about/_components/about-hero.tsx

import { motion } from "motion/react";
import Link from "next/link";
import {
  ArrowRight,
  Package,
  Video,
  Globe,
  Sparkles,
  MapPin,
  CheckCircle,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import SA from "country-flag-icons/react/3x2/SA";
import AE from "country-flag-icons/react/3x2/AE";
import YE from "country-flag-icons/react/3x2/YE";

interface AboutHeroProps {
  isAr: boolean;
  locale: string;
}

// ─── Floating credential card ─────────────────────────────────────────────────
function CredentialCard({
  icon: Icon,
  title,
  sub,
  color,
  delay,
  className,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
  color: string;
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.55, ease: "easeOut" }}
      className={cn(
        "bg-white dark:bg-card rounded-2xl shadow-lg shadow-black/8 border border-border/50 p-3.5 flex items-center gap-3 w-52",
        className,
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          color,
        )}
      >
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground leading-tight truncate">
          {title}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {sub}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Country presence badge (SVG flag version) ───────────────────────────────
function CountryBadge({
  flag: FlagComponent,
  name,
  role,
  delay,
}: {
  flag: React.ElementType;
  name: string;
  role: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center gap-1.5"
    >
      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-card shadow-md shadow-black/8 border border-border/50 flex items-center justify-center">
        <FlagComponent className="w-7 h-7" />
      </div>
      <p className="text-[10px] font-semibold text-foreground text-center">
        {name}
      </p>
      <p className="text-[9px] text-muted-foreground text-center leading-tight">
        {role}
      </p>
    </motion.div>
  );
}

// ─── Main Hero ────────────────────────────────────────────────────────────────
export function AboutHero({ isAr, locale }: AboutHeroProps) {
  const countries = isAr
    ? [
        { flag: CN, name: "الصين", role: "مصدر المنتجات", delay: 0.7 },
        { flag: US, name: "أمريكا", role: "فريق ميداني", delay: 0.78 },
        { flag: SA, name: "السعودية", role: "مركز العملاء", delay: 0.86 },
        { flag: AE, name: "الإمارات", role: "شركاء اللوجستيك", delay: 0.94 },
        { flag: YE, name: "اليمن", role: "شركاء المناطق", delay: 1.02 },
      ]
    : [
        { flag: CN, name: "China", role: "Product sourcing", delay: 0.7 },
        { flag: US, name: "USA", role: "Field team", delay: 0.78 },
        { flag: SA, name: "Saudi Arabia", role: "Client hub", delay: 0.86 },
        { flag: AE, name: "UAE", role: "Logistics partners", delay: 0.94 },
        { flag: YE, name: "Yemen", role: "Regional partners", delay: 1.02 },
      ];

  return (
    <section className="relative min-h-[88vh] flex flex-col items-center justify-center overflow-hidden bg-background pb-10 pt-24">
      {/* ── Background ── */}
      <div className="absolute inset-0 bg-[oklch(0.97_0.01_280)] dark:bg-[oklch(0.14_0.02_270)]" />
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.03] pointer-events-none" />

      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" />

      {/* Orbs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-175 h-100 rounded-full orb-brand pointer-events-none" />
      <div className="absolute bottom-0 -right-24 w-64 h-64 rounded-full orb-brand pointer-events-none" />
      <div className="absolute bottom-0 -left-24 w-48 h-48 rounded-full orb-brand pointer-events-none" />

      <div
        className="relative max-w-5xl mt-16 mx-auto px-4 md:px-6 lg:px-8 w-full flex flex-col items-center gap-10"
        dir={isAr ? "rtl" : "ltr"}
      >
        

        {/* ── Headline ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center space-y-4 max-w-3xl"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
            {isAr ? (
              <span className="leading-normal">
                نبني جسوراً <span className="text-color">تجارية</span> بين
                العالم وأسواقكم
              </span>
            ) : (
              <>
                Building <span className="text-color">trade <br /> bridges</span>{" "}
                between global markets & you
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "بدأنا بفكرة بسيطة: لماذا يصعب على صاحب العمل في السعودية أو اليمن أن يستورد منتجاً من الصين؟ اليوم نحن الوسيط الذي يجعل ذلك سهلاً وشفافاً."
              : "We started with a simple question: why is it so hard for a business in Saudi Arabia or Yemen to import from China? Today we are the bridge that makes it effortless and transparent."}
          </p>
        </motion.div>

        {/* ── CTA buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href={`/${locale}/dashboard/requests/`}
            className="group flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#7b57fc] text-white text-sm font-semibold shadow-lg shadow-[#7b57fc]/30 hover:bg-[#6a48eb] hover:-translate-y-0.5 transition-all"
          >
            <Package className="w-4 h-4" />
            {isAr ? "ابدأ طلبك الأول" : "Start your first request"}
            <ArrowRight
              className={cn(
                "w-4 h-4 transition-transform group-hover:translate-x-1",
                isAr && "rotate-180",
              )}
            />
          </Link>
          <Link
            href={`/${locale}/dashboard/video-bookings/`}
            className="group flex items-center gap-2 px-7 py-3.5 rounded-full border border-border/60 bg-background/60 backdrop-blur-sm text-sm font-semibold text-foreground hover:border-[#7b57fc]/50 hover:text-[#7b57fc] hover:-translate-y-0.5 transition-all"
          >
            <Video className="w-4 h-4" />
            {isAr ? "احجز جلسة تعريفية" : "Book an intro call"}
          </Link>
        </motion.div>

        {/* ── Floating credential cards ── */}
        <div className="relative w-full max-w-2xl h-24 hidden md:block pointer-events-none select-none">
          <CredentialCard
            icon={CheckCircle}
            title={isAr ? "موردون موثّقون" : "Verified suppliers"}
            sub={isAr ? "٥٠٠+ مورد في الصين وأمريكا" : "500+ in China & USA"}
            color="bg-emerald-500"
            delay={0.55}
            className="absolute top-0 left-0"
          />
          <CredentialCard
            icon={TrendingUp}
            title={isAr ? "عروض خلال ٤٨ ساعة" : "Quotes in 48 hours"}
            sub={isAr ? "ضمان الشفافية الكاملة" : "Full pricing transparency"}
            color="bg-[#7b57fc]"
            delay={0.65}
            className="absolute top-0 left-1/2 -translate-x-1/2"
          />
          <CredentialCard
            icon={MapPin}
            title={isAr ? "فريق في الميدان" : "On-the-ground team"}
            sub={
              isAr ? "الصين · أمريكا · السعودية" : "China · USA · Saudi Arabia"
            }
            color="bg-blue-500"
            delay={0.75}
            className="absolute top-0 right-0"
          />
        </div>

        {/* ── Country presence ring ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <p className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium mb-5">
            {isAr ? "حضورنا حول العالم" : "Our global presence"}
          </p>

          {/* Connecting line */}
          <div className="relative flex items-start justify-between">
            {/* Line behind flags */}
            <div className="absolute top-6 left-6 right-6 h-px bg-linear-to-r from-transparent via-[#7b57fc]/30 to-transparent" />

            {countries.map(({ flag, name, role, delay }) => (
              <CountryBadge
                key={name}
                flag={flag}
                name={name}
                role={role}
                delay={delay}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Scroll hint ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col items-center gap-1.5 text-muted-foreground/40"
        >
          <span className="text-[10px] uppercase tracking-widest">
            {isAr ? "اكتشف المزيد" : "Discover more"}
          </span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}