"use client";

// app/[locale]/_components/how-it-works.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Package,
  Video,
  ArrowRight,
  Link2,
  FileText,
  CheckCircle,
  DollarSign,
  Truck,
  Star,
  Calendar,
  Clock,
  PlayCircle,
  Sparkles,
  Send,
  Search,
  ShieldCheck,
  Zap,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "product" | "booking";

interface Step {
  number: number;
  icon: React.ElementType;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  tag?: { en: string; ar: string; color: string };
  mockup: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini mockup cards for each step
// ─────────────────────────────────────────────────────────────────────────────

function MockupShell({
  children,
  gradient,
}: {
  children: React.ReactNode;
  gradient: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden p-5",
        "border border-border/40 shadow-sm",
        gradient,
      )}
    >
      {children}
    </div>
  );
}

// Product step mockups
const ProductMockups = {
  submit: (
    <MockupShell gradient="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-card">
      <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
        New Product Request
      </p>
      <div className="space-y-2">
        <div className="flex items-center gap-2 bg-white dark:bg-card rounded-xl px-3 py-2 border border-border/50 shadow-sm">
          <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[10px] text-muted-foreground truncate">
            https://1688.com/offer/product…
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl px-3 py-2 border border-border/50 shadow-sm">
            <p className="text-[8px] text-muted-foreground">Quantity</p>
            <p className="text-xs font-bold text-foreground">500 pcs</p>
          </div>
          <div className="bg-white dark:bg-card rounded-xl px-3 py-2 border border-border/50 shadow-sm">
            <p className="text-[8px] text-muted-foreground">Destination</p>
            <p className="text-xs font-bold text-foreground">🇸🇦 Saudi Arabia</p>
          </div>
        </div>
        <button className="w-full py-2 rounded-xl bg-[#7b57fc] text-white text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#7b57fc]/20">
          <Send className="w-3 h-3" /> Submit Request
        </button>
      </div>
    </MockupShell>
  ),

  review: (
    <MockupShell gradient="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Search className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-[10px] font-bold text-foreground">Under Review</p>
        <span className="ml-auto text-[8px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-semibold">
          IN_REVIEW
        </span>
      </div>
      <div className="space-y-1.5">
        {[
          "Verifying supplier details",
          "Checking product availability",
          "Estimating shipping cost",
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0",
                i < 2 ? "bg-emerald-500" : "bg-muted",
              )}
            >
              {i < 2 ? (
                <CheckCircle className="w-2.5 h-2.5 text-white" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">{item}</p>
          </div>
        ))}
      </div>
    </MockupShell>
  ),

  quote: (
    <MockupShell gradient="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[#7b57fc]" />
          <p className="text-[10px] font-bold text-foreground">Quote Ready</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 mb-2 shadow-sm">
        <p className="text-[8px] text-muted-foreground mb-1">
          Wireless Earbuds × 500
        </p>
        <p className="text-xl font-bold text-[#7b57fc] tabular-nums">
          $2,450{" "}
          <span className="text-xs text-muted-foreground font-normal">USD</span>
        </p>
        <p className="text-[8px] text-muted-foreground mt-1">
          Valid until Jun 30 · Shipping included
        </p>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-1.5 rounded-xl bg-[#7b57fc] text-white text-[10px] font-bold shadow-sm shadow-[#7b57fc]/20">
          Accept
        </button>
        <button className="flex-1 py-1.5 rounded-xl bg-muted text-muted-foreground text-[10px] font-semibold">
          Decline
        </button>
      </div>
    </MockupShell>
  ),

  production: (
    <MockupShell gradient="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-[10px] font-bold text-foreground">In Production</p>
        <span className="ml-auto text-[8px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-semibold">
          IN_PRODUCTION
        </span>
      </div>
      <div className="w-full bg-muted/40 rounded-full h-1.5 mb-1.5">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "65%" }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 1 }}
          className="h-full rounded-full bg-linear-to-r from-[#7b57fc] to-emerald-500"
        />
      </div>
      <p className="text-[8px] text-muted-foreground mb-3">
        Production 65% complete
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {["🏭 Factory", "📦 Packaged", "🚢 Shipping"].map((s, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg py-1.5 text-center text-[8px] font-semibold",
              i < 2
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {s}
          </div>
        ))}
      </div>
    </MockupShell>
  ),

  delivered: (
    <MockupShell gradient="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-card">
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-2xl bg-[#7b57fc]/10 flex items-center justify-center mx-auto mb-3">
          <Truck className="w-6 h-6 text-[#7b57fc]" />
        </div>
        <p className="text-xs font-bold text-foreground mb-0.5">
          Order Delivered!
        </p>
        <p className="text-[10px] text-muted-foreground mb-3">
          Wireless Earbuds × 500
        </p>
        <div className="flex justify-center gap-0.5 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
            />
          ))}
        </div>
        <span className="text-[9px] px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-semibold">
          COMPLETED ✓
        </span>
      </div>
    </MockupShell>
  ),
};

// Booking step mockups
const BookingMockups = {
  choose: (
    <MockupShell gradient="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-card">
      <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
        Choose Session Type
      </p>
      <div className="space-y-1.5">
        {[
          {
            icon: "🏪",
            label: "Market Tour",
            desc: "Browse live markets",
            active: true,
          },
          {
            icon: "🏭",
            label: "Factory Visit",
            desc: "Inspect production",
            active: false,
          },
          {
            icon: "💼",
            label: "Consultation",
            desc: "Expert advice session",
            active: false,
          },
        ].map(({ icon, label, desc, active }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 border transition-all",
              active
                ? "border-[#7b57fc]/50 bg-[#7b57fc]/5"
                : "border-border/50 bg-white dark:bg-card",
            )}
          >
            <span className="text-base">{icon}</span>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-foreground">
                {label}
              </p>
              <p className="text-[8px] text-muted-foreground">{desc}</p>
            </div>
            {active && <ChevronRight className="w-3 h-3 text-[#7b57fc]" />}
          </div>
        ))}
      </div>
    </MockupShell>
  ),

  schedule: (
    <MockupShell gradient="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-[#7b57fc]" />
        <p className="text-[10px] font-bold text-foreground">
          Pick a Time Slot
        </p>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
          <div
            key={d}
            className={cn(
              "rounded-lg py-1 text-center text-[9px] font-semibold border",
              i === 3
                ? "bg-[#7b57fc] text-white border-[#7b57fc]"
                : "bg-white dark:bg-card border-border/50 text-muted-foreground",
            )}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {["9:00 AM", "10:00 AM", "2:00 PM", "3:00 PM"].map((t, i) => (
          <div
            key={t}
            className={cn(
              "rounded-lg py-1.5 text-center text-[9px] font-semibold border",
              i === 1
                ? "bg-[#7b57fc] text-white border-[#7b57fc]"
                : "bg-white dark:bg-card border-border/50 text-muted-foreground",
            )}
          >
            {t}
          </div>
        ))}
      </div>
    </MockupShell>
  ),

  confirmed: (
    <MockupShell gradient="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-[10px] font-bold text-foreground">
          Session Confirmed!
        </p>
        <span className="ml-auto text-[8px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-semibold">
          CONFIRMED
        </span>
      </div>
      <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 space-y-1.5 shadow-sm">
        <div className="flex justify-between text-[9px]">
          <span className="text-muted-foreground">Type</span>
          <span className="font-semibold text-foreground">🏪 Market Tour</span>
        </div>
        <div className="flex justify-between text-[9px]">
          <span className="text-muted-foreground">Date</span>
          <span className="font-semibold text-foreground">
            Thu, Jun 27 · 10:00 AM
          </span>
        </div>
        <div className="flex justify-between text-[9px]">
          <span className="text-muted-foreground">Platform</span>
          <span className="font-semibold text-foreground">🎥 Google Meet</span>
        </div>
        <div className="flex justify-between text-[9px]">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-semibold text-foreground">30 minutes</span>
        </div>
      </div>
    </MockupShell>
  ),

  live: (
    <MockupShell gradient="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1 text-[9px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
        <span className="text-[9px] text-slate-400 ml-auto flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> 12:43
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <div className="rounded-xl aspect-video bg-linear-to-br from-[#7b57fc] to-[#2b1cff] flex items-center justify-center">
          <p className="text-[8px] text-white font-bold">Admin 🇨🇳</p>
        </div>
        <div className="rounded-xl aspect-video bg-slate-700 flex items-center justify-center">
          <p className="text-[8px] text-slate-300 font-bold">You</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        {[PlayCircle, Video, Sparkles].map((Icon, i) => (
          <div
            key={i}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center",
              i === 2 ? "bg-[#7b57fc]" : "bg-slate-700",
            )}
          >
            <Icon className="w-3 h-3 text-white" />
          </div>
        ))}
      </div>
    </MockupShell>
  ),

  summary: (
    <MockupShell gradient="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-[#7b57fc]/10 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-[#7b57fc]" />
        </div>
        <p className="text-[10px] font-bold text-foreground">
          AI Summary Ready
        </p>
      </div>
      <div className="space-y-1.5">
        {[
          "Supplier: $4.20/unit · MOQ 500",
          "Delivery: 18–22 days to Riyadh",
          "Grade A quality · ISO certified",
          "WhatsApp group created ✓",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-snug">
              {item}
            </p>
          </div>
        ))}
      </div>
    </MockupShell>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Step data
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCT_STEPS: Step[] = [
  {
    number: 1,
    icon: Send,
    titleEn: "Submit your request",
    titleAr: "أرسل طلبك",
    descEn:
      "Share a product link or description. Tell us the quantity and your destination country and we handle the rest.",
    descAr:
      "شارك رابط المنتج أو وصفاً له. حدد الكمية وبلد الوجهة وسنتولى كل شيء من هناك.",
    tag: {
      en: "Step 1",
      ar: "الخطوة ١",
      color:
        "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
    },
    mockup: ProductMockups.submit,
  },
  {
    number: 2,
    icon: Search,
    titleEn: "Our team reviews & sources",
    titleAr: "فريقنا يراجع ويبحث",
    descEn:
      "Our specialists in China and the USA verify the supplier, check quality and availability, then prepare an accurate quote.",
    descAr:
      "يتحقق متخصصونا في الصين وأمريكا من المورد والجودة والتوفر، ثم يُعدّون عرض سعر دقيقاً.",
    tag: {
      en: "Step 2",
      ar: "الخطوة ٢",
      color:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    },
    mockup: ProductMockups.review,
  },
  {
    number: 3,
    icon: DollarSign,
    titleEn: "Receive & approve your quote",
    titleAr: "استلم عرض السعر ووافق عليه",
    descEn:
      "You get a full quote with unit price, shipping, and timeline. One click to accept and production begins.",
    descAr:
      "تستلم عرضاً شاملاً بسعر الوحدة والشحن والجدول الزمني. نقرة واحدة للموافقة وتبدأ عملية التنفيذ.",
    tag: {
      en: "Step 3",
      ar: "الخطوة ٣",
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    },
    mockup: ProductMockups.quote,
  },
  {
    number: 4,
    icon: Zap,
    titleEn: "Production & real-time tracking",
    titleAr: "الإنتاج والتتبع اللحظي",
    descEn:
      "Track your order through every stage — production, packing, and shipping — directly from your dashboard.",
    descAr:
      "تابع طلبك في كل مرحلة — الإنتاج، التعبئة، والشحن — مباشرةً من لوحة التحكم.",
    tag: {
      en: "Step 4",
      ar: "الخطوة ٤",
      color:
        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    },
    mockup: ProductMockups.production,
  },
  {
    number: 5,
    icon: Truck,
    titleEn: "Delivered to your door",
    titleAr: "التوصيل حتى بابك",
    descEn:
      "Your order arrives at your destination. Rate the experience and request again with one click.",
    descAr: "يصل طلبك إلى وجهتك. قيّم التجربة وأعد الطلب بنقرة واحدة.",
    tag: {
      en: "Step 5",
      ar: "الخطوة ٥",
      color:
        "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
    },
    mockup: ProductMockups.delivered,
  },
];

const BOOKING_STEPS: Step[] = [
  {
    number: 1,
    icon: Video,
    titleEn: "Choose your session type",
    titleAr: "اختر نوع الجلسة",
    descEn:
      "Pick from a Market Tour, Factory Visit, or Custom Consultation — each designed for a different sourcing need.",
    descAr:
      "اختر بين جولة السوق، زيارة المصنع، أو استشارة مخصصة — كل نوع مصمم لاحتياج تجاري مختلف.",
    tag: {
      en: "Step 1",
      ar: "الخطوة ١",
      color:
        "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
    },
    mockup: BookingMockups.choose,
  },
  {
    number: 2,
    icon: Calendar,
    titleEn: "Pick a time slot",
    titleAr: "حدد موعدك",
    descEn:
      "Browse available slots set by our team on the ground. Pick a time that works for you — we adjust to your timezone.",
    descAr:
      "تصفح المواعيد المتاحة التي يضعها فريقنا في الميدان. اختر ما يناسبك — نتكيف مع منطقتك الزمنية.",
    tag: {
      en: "Step 2",
      ar: "الخطوة ٢",
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    },
    mockup: BookingMockups.schedule,
  },
  {
    number: 3,
    icon: ShieldCheck,
    titleEn: "Booking confirmed",
    titleAr: "تأكيد الحجز",
    descEn:
      "You receive a confirmation with the meeting link (Zoom, Google Meet, or WhatsApp), date, time, and duration.",
    descAr:
      "تستلم تأكيداً يتضمن رابط الاجتماع (Zoom أو Google Meet أو واتساب) والتاريخ والوقت والمدة.",
    tag: {
      en: "Step 3",
      ar: "الخطوة ٣",
      color:
        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    },
    mockup: BookingMockups.confirmed,
  },
  {
    number: 4,
    icon: PlayCircle,
    titleEn: "Join your live session",
    titleAr: "انضم إلى جلستك المباشرة",
    descEn:
      "Connect directly with our team in China. See products, talk to suppliers, and ask every question you need answered.",
    descAr:
      "تواصل مباشرةً مع فريقنا في الصين. شاهد المنتجات، تحدث مع الموردين، واطرح كل أسئلتك.",
    tag: {
      en: "Step 4",
      ar: "الخطوة ٤",
      color:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    },
    mockup: BookingMockups.live,
  },
  {
    number: 5,
    icon: Sparkles,
    titleEn: "Get your AI summary",
    titleAr: "استلم ملخصك الذكي",
    descEn:
      "Immediately after the session, an AI-generated summary with all key details — prices, timelines, contacts — lands in your dashboard.",
    descAr:
      "فور انتهاء الجلسة، يصلك ملخص ذكي يتضمن كل التفاصيل المهمة — الأسعار والمواعيد وجهات التواصل — في لوحة تحكمك.",
    tag: {
      en: "Step 5",
      ar: "الخطوة ٥",
      color:
        "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
    },
    mockup: BookingMockups.summary,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tab button
// ─────────────────────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon: Icon,
  labelEn,
  labelAr,
  isAr,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
  isAr: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200",
        active
          ? "bg-[#7b57fc] text-white shadow-lg shadow-[#7b57fc]/25"
          : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-[#7b57fc]/30",
      )}
    >
      <Icon className="w-4 h-4" />
      {isAr ? labelAr : labelEn}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Step card — horizontal layout
// ─────────────────────────────────────────────────────────────────────────────

function StepCard({
  step,
  isAr,
  index,
}: {
  step: Step;
  isAr: boolean;
  index: number;
}) {
  const Icon = step.icon;
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center",
        !isEven && "md:[&>*:first-child]:order-2",
      )}
    >
      {/* Text side */}
      <div
        className={cn("flex flex-col gap-4", isAr ? "text-right" : "text-left")}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Step number + tag */}
        <div
          className={cn(
            "flex items-center gap-3",
            isAr ? "flex-row-reverse justify-end" : "",
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#7b57fc]/10 border border-[#7b57fc]/20 shrink-0">
            <span className="text-sm font-bold text-[#7b57fc]">
              {step.number}
            </span>
          </div>
          {step.tag && (
            <span
              className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-full",
                step.tag.color,
              )}
            >
              {isAr ? step.tag.ar : step.tag.en}
            </span>
          )}
        </div>

        {/* Icon + Title */}
        <div
          className={cn(
            "flex items-center gap-3",
            isAr ? "flex-row-reverse" : "",
          )}
        >
          <div className="w-9 h-9 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 text-[#7b57fc]" />
          </div>
          <h3 className="text-lg font-bold text-foreground leading-snug">
            {isAr ? step.titleAr : step.titleEn}
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isAr ? step.descAr : step.descEn}
        </p>
      </div>

      {/* Mockup side */}
      <div>{step.mockup}</div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress connector between steps
// ─────────────────────────────────────────────────────────────────────────────

function StepConnector({ index, total }: { index: number; total: number }) {
  if (index >= total - 1) return null;
  return (
    <motion.div
      initial={{ scaleY: 0 }}
      whileInView={{ scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="flex justify-center py-2 origin-top"
    >
      <div className="w-px h-8 bg-linear-to-b from-[#7b57fc]/40 to-[#7b57fc]/10" />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function HowItWorks() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [tab, setTab] = useState<Tab>("product");

  const steps = tab === "product" ? PRODUCT_STEPS : BOOKING_STEPS;

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Subtle background */}
      {/* Same lavender background as feature-sections */}
      <div className="absolute inset-0 bg-[oklch(0.97_0.01_280)] dark:bg-[oklch(0.14_0.02_270)]" />
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.025]" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full orb-brand" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full orb-brand" />

      <div className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7b57fc]/10 border border-[#7b57fc]/20 mb-5">
            <Zap className="w-4 h-4 text-[#7b57fc]" />
            <span className="text-sm font-semibold text-[#7b57fc]">
              {isAr ? "كيف يعمل النظام" : "How it works"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
            {isAr ? (
              <>
                <span className="text-color">بسيط وشفاف</span> من البداية حتى
                النهاية
              </>
            ) : (
              <>
                Simple and transparent{" "}
                <span className="text-color">from start to finish</span>
              </>
            )}
          </h2>
          <p className="text-muted-foreground text-base">
            {isAr
              ? "سواء كنت تستورد منتجاً أو تحجز جلسة فيديو، إليك كيف تسير العملية خطوة بخطوة."
              : "Whether you're sourcing a product or booking a video session, here's exactly how the process works."}
          </p>
        </motion.div>

        {/* ── Tab switcher ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-14"
        >
          <TabButton
            active={tab === "product"}
            onClick={() => setTab("product")}
            icon={Package}
            labelEn="Product Requests"
            labelAr="طلبات المنتجات"
            isAr={isAr}
          />
          <TabButton
            active={tab === "booking"}
            onClick={() => setTab("booking")}
            icon={Video}
            labelEn="Video Bookings"
            labelAr="حجز الجلسات"
            isAr={isAr}
          />
        </motion.div>

        {/* ── Steps ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-0"
          >
            {steps.map((step, i) => (
              <div key={step.number}>
                <StepCard step={step} isAr={isAr} index={i} />
                <StepConnector index={i} total={steps.length} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center mt-16 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href={
              tab === "product"
                ? `/${locale}/dashboard/requests/new`
                : `/${locale}/dashboard/bookings/new`
            }
            className="group flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#7b57fc] text-white text-sm font-semibold shadow-lg shadow-[#7b57fc]/25 hover:bg-[#6a48eb] hover:-translate-y-0.5 transition-all"
          >
            {tab === "product" ? (
              <>
                <Package className="w-4 h-4" />
                {isAr ? "ابدأ طلبك الآن" : "Start your request"}
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                {isAr ? "احجز جلسة فيديو" : "Book a video session"}
              </>
            )}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={`/${locale}/products`}
            className="flex items-center gap-2 px-7 py-3.5 rounded-full border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-[#7b57fc]/40 hover:-translate-y-0.5 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            {isAr ? "تصفح المنتجات الرائجة" : "Browse trending products"}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
