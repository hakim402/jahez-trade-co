"use client";

// app/[locale]/(pages)/contact/_components/contact-hero.tsx

import { motion } from "motion/react";
import Link from "next/link";
import { MessageSquare, Phone, Mail, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface ContactHeroProps {
  isAr: boolean;
  locale: string;
}

export function ContactHero({ isAr, locale }: ContactHeroProps) {
  const whatsapp = (
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT ?? "+86 152 6866 4202"
  ).replace(/\D/g, "");
  const msg = encodeURIComponent(
    isAr ? "مرحباً، أحتاج مساعدة" : "Hello, I need help",
  );

  return (
    <section className="relative overflow-hidden py-20 md:py-28 bg-background">
      {/* Background */}
      <div className="absolute inset-0 bg-[oklch(0.97_0.01_280)] dark:bg-[oklch(0.14_0.02_270)]" />
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.03] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: "52px 52px",
        }}
      />
      <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-150 h-75 rounded-full orb-brand pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full orb-brand pointer-events-none" />

      <div
        className="relative max-w-4xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col items-center gap-8 text-center"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7b57fc]/25 bg-[#7b57fc]/8"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#7b57fc]" />
          <span className="text-xs font-semibold text-[#7b57fc]">
            {isAr ? "نحن هنا للمساعدة" : "We're here to help"}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 max-w-2xl"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
            {isAr ? (
              <>
                <span className="text-color">تواصل معنا</span> نحن نستمع
              </>
            ) : (
              <>
                Get in <span className="text-color">touch</span> we listen
              </>
            )}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {isAr
              ? "سواء كان لديك سؤال عن الاستيراد أو تريد حجز جلسة أو تحتاج استشارة فريقنا يرد خلال ٢٤ ساعة."
              : "Whether you have a sourcing question, want to book a session, or need consulting advice  our team replies within 24 hours."}
          </p>
        </motion.div>

        {/* Quick contact options */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg"
        >
          {/* WhatsApp */}
          <a
            href={`https://wa.me/${whatsapp}?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all w-full sm:w-auto justify-center"
          >
            <WhatsAppIcon className="w-4 h-4" />
            {isAr ? "واتساب مباشر" : "Chat on WhatsApp"}
            <ArrowRight
              className={cn(
                "w-4 h-4 transition-transform group-hover:translate-x-1",
                isAr && "rotate-180",
              )}
            />
          </a>

          {/* Email */}
          <a
            href="mailto:mewansourcing@gmail.com"
            className="group flex items-center gap-2 px-6 py-3.5 rounded-full border border-border/60 bg-background/60 backdrop-blur-sm text-sm font-semibold text-foreground hover:border-[#7b57fc]/50 hover:text-[#7b57fc] hover:-translate-y-0.5 transition-all w-full sm:w-auto justify-center"
          >
            <Mail className="w-4 h-4" />
            mewansourcing@gmail.com
          </a>
        </motion.div>

        {/* Response time indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {isAr
            ? "متوسط وقت الرد: أقل من ٢٤ ساعة"
            : "Average response time: under 24 hours"}
        </motion.div>
      </div>
    </section>
  );
}
