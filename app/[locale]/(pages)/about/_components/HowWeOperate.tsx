"use client";

// ═══════════════════════════════════════════════════════════════════════
// app/[locale]/(pages)/about/_components/how-we-operate.tsx
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
import Image from "next/image";
const SERVICES = [
  {
    icon: MessageSquare,
    image: "/images/consulations-illustration-2.jpg",
    gradient: "from-emerald-400 to-teal-500",
    titleEn: "Business Consulting",
    titleAr: "الاستشارات التجارية",
    descEn:
      "Expert guidance on sourcing strategy, import regulations, logistics, market entry, and supplier selection.",
    descAr:
      "إرشاد متخصص في استراتيجية الاستيراد، لوائح الجمارك، اللوجستيك، دخول السوق، واختيار المورد.",
    tagEn: "",
    tagAr: "",
  },
  {
    icon: TrendingUp,
    image: "/images/trending-products-illustration-2.jpg",
    gradient: "from-rose-500 to-pink-500",
    titleEn: "Trending Products",
    titleAr: "المنتجات الرائجة",
    descEn:
      "Browse our curated list of hand-picked trending products sourced from global markets and request any of them instantly.",
    descAr:
      "تصفح قائمتنا المنتقاة من أفضل المنتجات الرائجة من الأسواق العالمية واطلب أياً منها فوراً.",
    tagEn: "New",
    tagAr: "جديد",
  },
  {
    icon: Truck,
    image: "/images/shipping-illustration-2.jpg",
    gradient: "from-indigo-400 to-violet-500",
    titleEn: "Shipping & Logistics",
    titleAr: "الشحن واللوجستيك",
    descEn:
      "Air and sea freight calculations, customs handling, and real-time tracking from factory to your door.",
    descAr:
      "حسابات الشحن الجوي والبحري، معالجة الجمارك، والتتبع اللحظي من المصنع حتى بابك.",
    tagEn: "",
    tagAr: "",
  },
];

export function HowWeOperate({
  isAr,
  locale,
}: {
  isAr: boolean;
  locale: string;
}) {
  return (
    <section
      className="py-16 md:py-24 bg-background"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7b57fc]/10 border border-[#7b57fc]/20 mb-4">
            <Zap className="w-4 h-4 text-[#7b57fc]" />
            <span className="text-sm font-semibold text-[#7b57fc]">
              {isAr ? "ما نقدمه" : "What we offer"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-3">
            {isAr ? (
              <>
                خدمات متكاملة{" "}
                <span className="text-gradient">تحت سقف واحد</span>
              </>
            ) : (
              <>
                Complete services{" "}
                <span className="text-gradient">under one roof</span>
              </>
            )}
          </h2>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {isAr
              ? "من الطلب إلى التوصيل، كل ما تحتاجه للاستيراد في مكان واحد."
              : "From request to delivery, everything you need to import in one place."}
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(
            (
              {
                icon: Icon,
                image,
                titleEn,
                titleAr,
                descEn,
                descAr,
                tagEn,
                tagAr,
              },
              i,
            ) => (
              <motion.div
                key={titleEn}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                {/* Image Hero */}
                <div className="relative w-full h-48">
                  {image ? (
                    <Image
                      src={image}
                      alt={titleEn}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-muted">
                      <Icon className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Icon floating */}
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/60 backdrop-blur p-2 rounded-xl shadow">
                    <Icon className="w-4 h-4 text-[#7b57fc]" />
                  </div>

                  {/* Tag */}
                  {(tagEn || tagAr) && (
                    <div className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-1 rounded-full bg-[#7b57fc]/90 text-white shadow">
                      {isAr ? tagAr : tagEn}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {isAr ? titleAr : titleEn}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isAr ? descAr : descEn}
                  </p>
                </div>

                {/* Hover border glow */}
                <div className="absolute inset-0 rounded-3xl ring-1 ring-transparent group-hover:ring-[#7b57fc]/30 transition" />
              </motion.div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
