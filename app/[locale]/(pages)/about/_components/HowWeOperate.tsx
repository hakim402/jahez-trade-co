'use client'

// ═══════════════════════════════════════════════════════════════════════
// app/[locale]/(pages)/about/_components/how-we-operate.tsx
// ═══════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react"
import { motion, useInView, animate } from "motion/react"
import Link from "next/link"
import {
  Package, Clock, Users, Star, Globe, Video,
  MessageSquare, ShieldCheck, Zap, TrendingUp,
  CheckCircle, ArrowRight, Factory, Store, Heart,
  Eye, Target, Handshake, MapPin, Truck,
} from "lucide-react"
import { cn } from "@/lib/utils"
const SERVICES = [
  {
    icon: Package,
    gradient: "from-violet-500 to-[#7b57fc]",
    titleEn: "Product Sourcing",
    titleAr: "استيراد المنتجات",
    descEn: "Submit a product link or description. We find the best supplier, negotiate the price, and manage shipping door-to-door.",
    descAr: "أرسل رابط المنتج أو وصفه. نجد أفضل مورد، نتفاوض على السعر، ونتولى الشحن من الباب للباب.",
    tagEn: "Most popular",
    tagAr: "الأكثر طلباً",
  },
  {
    icon: Store,
    gradient: "from-orange-400 to-amber-500",
    titleEn: "Market Tours",
    titleAr: "جولات السوق",
    descEn: "Book a live video session with our team on the ground in Chinese or American markets. See products before you commit.",
    descAr: "احجز جلسة فيديو مباشرة مع فريقنا في الأسواق الصينية أو الأمريكية. شاهد المنتجات قبل أن تلتزم.",
    tagEn: "",
    tagAr: "",
  },
  {
    icon: Factory,
    gradient: "from-blue-500 to-cyan-500",
    titleEn: "Factory Visits",
    titleAr: "زيارات المصانع",
    descEn: "Inspect the production line, verify quality standards, and meet the manufacturer all via live video.",
    descAr: "تفقّد خط الإنتاج، تحقق من معايير الجودة، والتقِ بالمصنّع كل ذلك عبر فيديو مباشر.",
    tagEn: "",
    tagAr: "",
  },
  {
    icon: MessageSquare,
    gradient: "from-emerald-400 to-teal-500",
    titleEn: "Business Consulting",
    titleAr: "الاستشارات التجارية",
    descEn: "Expert guidance on sourcing strategy, import regulations, logistics, market entry, and supplier selection.",
    descAr: "إرشاد متخصص في استراتيجية الاستيراد، لوائح الجمارك، اللوجستيك، دخول السوق، واختيار المورد.",
    tagEn: "",
    tagAr: "",
  },
  {
    icon: TrendingUp,
    gradient: "from-rose-500 to-pink-500",
    titleEn: "Trending Products",
    titleAr: "المنتجات الرائجة",
    descEn: "Browse our curated list of hand-picked trending products sourced from global markets and request any of them instantly.",
    descAr: "تصفح قائمتنا المنتقاة من أفضل المنتجات الرائجة من الأسواق العالمية واطلب أياً منها فوراً.",
    tagEn: "New",
    tagAr: "جديد",
  },
  {
    icon: Truck,
    gradient: "from-indigo-400 to-violet-500",
    titleEn: "Shipping & Logistics",
    titleAr: "الشحن واللوجستيك",
    descEn: "Air and sea freight calculations, customs handling, and real-time tracking from factory to your door.",
    descAr: "حسابات الشحن الجوي والبحري، معالجة الجمارك، والتتبع اللحظي من المصنع حتى بابك.",
    tagEn: "",
    tagAr: "",
  },
]

export function HowWeOperate({ isAr, locale }: { isAr: boolean; locale: string }) {
  return (
    <section className="py-16 md:py-24 bg-background" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7b57fc]/10 border border-[#7b57fc]/20 mb-4">
            <Zap className="w-4 h-4 text-[#7b57fc]" />
            <span className="text-sm font-semibold text-[#7b57fc]">{isAr ? "ما نقدمه" : "What we offer"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-3">
            {isAr
              ? <><span className="text-gradient">خدمات متكاملة</span> تحت سقف واحد</>
              : <>Complete services <span className="text-gradient">under one roof</span></>
            }
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isAr
              ? "من الطلب إلى التوصيل، من الاستشارة إلى الجلسة المرئية كل ما تحتاجه للاستيراد موجود هنا."
              : "From request to delivery, from consulting to live video sessions everything you need to import is here."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map(({ icon: Icon, gradient, titleEn, titleAr, descEn, descAr, tagEn, tagAr }, i) => (
            <motion.div
              key={titleEn}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="group relative rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-[#7b57fc]/25 hover:shadow-md transition-all"
            >
              {(tagEn || tagAr) && (
                <span className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc]">
                  {isAr ? tagAr : tagEn}
                </span>
              )}
              <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center shadow-sm shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{isAr ? titleAr : titleEn}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{isAr ? descAr : descEn}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
