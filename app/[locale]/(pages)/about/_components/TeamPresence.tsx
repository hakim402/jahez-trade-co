"use client";

// ═══════════════════════════════════════════════════════════════════════
// app/[locale]/(pages)/about/_components/team-presence.tsx
// ═══════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "motion/react";
import Link from "next/link";
import {
  Package,
  Clock,
  Users,
  Star,
  Globe,
  Video,
  MessageSquare,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Factory,
  Store,
  Heart,
  Eye,
  Target,
  Handshake,
  MapPin,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import SA from "country-flag-icons/react/3x2/SA";
import AE from "country-flag-icons/react/3x2/AE";
import YE from "country-flag-icons/react/3x2/YE";

const LOCATIONS = [
  {
    flag: CN,
    cityEn: "Yiwu, China",
    cityAr: "يي وو، الصين",
    roleEn: "Product sourcing hub",
    roleAr: "مركز استيراد المنتجات",
    descEn:
      "Our largest team. We source from 500+ suppliers, visit factories, and run live market tours across southern China.",
    descAr:
      "أكبر فرقنا. نستورد من أكثر من ٥٠٠ مورد، نزور المصانع، ونجري جولات سوق مباشرة في جنوب الصين.",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    flag: US,
    cityEn: "New York, USA",
    cityAr: "نيويورك، أمريكا",
    roleEn: "Western market operations",
    roleAr: "عمليات السوق الغربية",
    descEn:
      "Managing American supplier relationships, product quality verification, and US-to-MENA shipping coordination.",
    descAr:
      "إدارة علاقات الموردين الأمريكيين، التحقق من جودة المنتجات، وتنسيق الشحن من أمريكا إلى المنطقة العربية.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    flag: SA,
    cityEn: "Riyadh, Saudi Arabia",
    cityAr: "الرياض، المملكة العربية السعودية",
    roleEn: "Primary client hub",
    roleAr: "المركز الرئيسي للعملاء",
    descEn:
      "Our client-facing team handling requests, consultations, and relationships across the GCC.",
    descAr:
      "فريقنا الموجه للعملاء يتولى الطلبات والاستشارات والعلاقات في منطقة الخليج.",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    flag: AE,
    cityEn: "Dubai, UAE",
    cityAr: "دبي، الإمارات",
    roleEn: "Logistics & trade bridge",
    roleAr: "اللوجستيك وجسر التجارة",
    descEn:
      "Logistics coordination, customs facilitation, and a regional hub for re-export and distribution.",
    descAr:
      "تنسيق اللوجستيك، تسهيل الجمارك، ومركز إقليمي لإعادة التصدير والتوزيع.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    flag: YE,
    cityEn: "Hadhramaut, Aden, Yemen",
    cityAr: "حضرموت، عدن، اليمن",
    roleEn: "Regional outreach",
    roleAr: "الوصول للأسواق الإقليمية",
    descEn:
      "Supporting Yemeni entrepreneurs with sourcing, imports, and trade consulting tailored to local market needs.",
    descAr:
      "دعم رواد الأعمال اليمنيين في الاستيراد والاستشارات التجارية المُكيَّفة مع احتياجات السوق المحلية.",
    color: "bg-[#7b57fc]/10 text-[#7b57fc]",
  },
];

export function TeamPresence({ isAr }: { isAr: boolean }) {
  return (
    <section
      className="relative py-16 md:py-24 overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="absolute inset-0 bg-[oklch(0.97_0.01_280)] dark:bg-[oklch(0.14_0.02_270)]" />
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.025] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-125 h-50 rounded-full orb-brand pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7b57fc]/10 border border-[#7b57fc]/20 mb-4">
            <MapPin className="w-4 h-4 text-[#7b57fc]" />
            <span className="text-sm font-semibold text-[#7b57fc]">
              {isAr ? "فريقنا حول العالم" : "Our team worldwide"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-3">
            {isAr ? (
              <>
                <span className="text-gradient">حاضرون في الميدان</span> لا خلف
                الشاشات فقط
              </>
            ) : (
              <>
                We're <span className="text-gradient">on the ground</span>, not
                just behind screens
              </>
            )}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isAr
              ? "ما يميزنا حقاً هو أن فريقنا موجود فعلياً في كل سوق نخدمه — يرى المنتجات ويلمسها ويتفاوض عليها بالنيابة عنك."
              : "What truly sets us apart is that our team physically exists in every market we serve — seeing, touching, and negotiating on your behalf."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LOCATIONS.map(
            (
              {
                flag: FlagComponent,
                cityEn,
                cityAr,
                roleEn,
                roleAr,
                descEn,
                descAr,
                color,
              },
              i,
            ) => {
              return (
                <motion.div
                  key={cityEn}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-[#7b57fc]/25 transition-all",
                    i === 0 && "sm:col-span-2 lg:col-span-1 lg:row-span-1",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FlagComponent className="w-8 h-8 shrink-0 shadow-sm" />
                    <div>
                      <p className="text-sm font-bold text-foreground leading-snug">
                        {isAr ? cityAr : cityEn}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          color,
                        )}
                      >
                        <span>{isAr ? roleAr : roleEn}</span>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isAr ? descAr : descEn}
                  </p>
                </motion.div>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}
