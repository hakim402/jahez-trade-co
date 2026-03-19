"use client"

// app/[locale]/(pages)/products/_components/products-hero.tsx

import { motion } from "motion/react"
import { Flame, Sparkles } from "lucide-react"

interface ProductsHeroProps {
  isAr: boolean
  totalCount: number
}

export function ProductsHero({ isAr, totalCount }: ProductsHeroProps) {
  return (
    <div className="relative overflow-hidden border-b border-border/50 bg-background">
      {/* Orb decorations using your orb-brand utility */}
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full orb-brand pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full orb-brand pointer-events-none" />

      {/* Brand dot pattern */}
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.03] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`flex flex-col items-center text-center gap-4`}
        >
          {/* Icon pill */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#7b57fc]/10 border border-[#7b57fc]/20"
          >
            <Flame className="w-4 h-4 text-[#7b57fc]" />
            <span className="text-sm font-medium text-[#7b57fc]">
              {isAr ? "أحدث المنتجات الرائجة" : "Latest Trending Products"}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#7b57fc]" />
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight max-w-2xl"
            dir={isAr ? "rtl" : "ltr"}
          >
            {isAr ? (
              <>
                اكتشف المنتجات{" "}
                <span className="text-gradient">الرائجة</span>{" "}
                عالمياً
              </>
            ) : (
              <>
                Discover{" "}
                <span className="text-gradient">Trending</span>{" "}
                Products
              </>
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-base text-muted-foreground max-w-lg"
            dir={isAr ? "rtl" : "ltr"}
          >
            {isAr
              ? "منتجات مُختارة بعناية من الأسواق العالمية — الصين، أمريكا، والمزيد. اطلب الآن ودعنا نتكفل بالباقي."
              : "Carefully curated products from global markets — China, USA & more. Request now and let us handle the rest."}
          </motion.p>

          {/* Count badge */}
          {totalCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50"
            >
              <span className="text-2xl font-bold text-[#7b57fc] tabular-nums">
                {totalCount}
              </span>
              <span className="text-sm text-muted-foreground">
                {isAr ? "منتج متاح" : "products available"}
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}