"use client";

// ═══════════════════════════════════════════════════════════════════════
// app/[locale]/(pages)/about/_components/MissionValues.tsx
// ═══════════════════════════════════════════════════════════════════════
import { motion, useInView, animate } from "motion/react";
import {
  Globe,
  ShieldCheck,
  Zap,
  Heart,
  Eye,
  Target,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const VALUES = [
  {
    icon: ShieldCheck,
    image: "/images/transparency.jpg",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    titleEn: "Transparency first",
    titleAr: "الشفافية أولاً",
    descEn:
      "Every quote includes a full breakdown unit price, shipping, duties, and timeline. No hidden fees, ever.",
    descAr:
      "كل عرض سعر يتضمن تفصيلاً كاملاً سعر الوحدة، الشحن، الرسوم، والجدول الزمني. لا رسوم مخفية أبداً.",
  },
  {
    icon: Handshake,
    image: "/images/partnership.jpg",
    color: "bg-[#7b57fc]/10 text-[#7b57fc]",
    titleEn: "Partnership, not just service",
    titleAr: "شراكة لا مجرد خدمة",
    descEn:
      "We treat every client request as if it were our own business. Your success is our success.",
    descAr: "نتعامل مع كل طلب عميل كأنه مشروعنا الخاص. نجاحك هو نجاحنا.",
  },
  {
    icon: Zap,
    image: "/images/percision.jpg",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    titleEn: "Speed with precision",
    titleAr: "السرعة مع الدقة",
    descEn:
      "We move fast without cutting corners. Quote in 48 hours, accurate every time.",
    descAr:
      "نتحرك بسرعة دون التهاون بالجودة. عرض سعر خلال ٤٨ ساعة، دقيق في كل مرة.",
  },
  {
    icon: Globe,
    image: "/images/global-reach.jpg",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    titleEn: "Truly global reach",
    titleAr: "وصول عالمي حقيقي",
    descEn:
      "With teams physically present in China, the USA, Saudi Arabia, UAE, and Yemen, we're where you need us.",
    descAr:
      "بفرق موجودة فعلياً في الصين وأمريكا والسعودية والإمارات واليمن، نحن حيث تحتاجونا.",
  },
  {
    icon: Eye,
    image: "/images/see-and-buy.jpg",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    titleEn: "See before you buy",
    titleAr: "شاهد قبل أن تشتري",
    descEn:
      "Our video booking service lets you inspect factories, markets, and products live from anywhere in the world.",
    descAr:
      "خدمة الجلسات المرئية تتيح لك تفقّد المصانع والأسواق والمنتجات مباشرةً من أي مكان في العالم.",
  },
  {
    icon: Heart,
    image: "/images/community.jpg",
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    titleEn: "Community-driven",
    titleAr: "مجتمع يدفعنا",
    descEn:
      "Built for Arab entrepreneurs and businesses looking to compete globally. Every feature is designed with your context in mind.",
    descAr:
      "بُنيت لرواد الأعمال العرب والشركات الراغبة في المنافسة عالمياً. كل ميزة صُممت مع مراعاة سياقكم.",
  },
];

export function MissionValues({ isAr }: { isAr: boolean }) {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div
        className="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7b57fc]/10 border border-[#7b57fc]/20 mb-4">
            <Target className="w-4 h-4 text-[#7b57fc]" />
            <span className="text-sm font-semibold text-[#7b57fc]">
              {isAr ? "مهمتنا وقيمنا" : "Mission & values"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-3">
            {isAr ? (
              <>
                لماذا وُجدنا <span className="text-gradient">وكيف نعمل</span>
              </>
            ) : (
              <>
                Why we exist and{" "}
                <span className="text-gradient">how we operate</span>
              </>
            )}
          </h2>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {isAr
              ? "مهمتنا جعل التجارة الدولية في متناول كل رائد أعمال عربي بغض النظر عن حجم عمله أو موقعه."
              : "Our mission is to make international trade accessible to every Arab entrepreneur regardless of business size or location."}
          </p>
        </motion.div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map(
            ({
              icon: Icon,
              image,
              titleEn,
              titleAr,
              descEn,
              descAr,
            }, i) => (
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

                  {/* Floating Icon */}
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/60 backdrop-blur p-2 rounded-xl shadow">
                    <Icon className="w-4 h-4 text-[#7b57fc]" />
                  </div>
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

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-3xl ring-1 ring-transparent group-hover:ring-[#7b57fc]/30 transition" />
              </motion.div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
