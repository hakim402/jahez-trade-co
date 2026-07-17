"use client";

// app/[locale]/_components/footer.tsx

import { motion } from "motion/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  TrendingUp,
  Mail,
  MapPin,
  ArrowUpRight,
  Shield,
  Zap,
  ChevronRight,
  ExternalLink,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { AiFillTikTok } from "react-icons/ai";

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp SVG (inline — no external dep)
// ─────────────────────────────────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Link column
// ─────────────────────────────────────────────────────────────────────────────
interface FooterLink {
  labelEn: string;
  labelAr: string;
  href: string;
  external?: boolean;
  badge?: { en: string; ar: string };
}

interface FooterColumn {
  titleEn: string;
  titleAr: string;
  icon: React.ElementType;
  links: FooterLink[];
}

function LinkColumn({
  column,
  locale,
  isAr,
}: {
  column: FooterColumn;
  locale: string;
  isAr: boolean;
}) {
  const Icon = column.icon;
  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      <div
        className={cn(
          "flex items-center gap-2 mb-4",
          isAr && "flex-row-reverse justify-end",
        )}
      >
        <div className="w-6 h-6 rounded-lg bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#7b57fc]" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">
          {isAr ? column.titleAr : column.titleEn}
        </h4>
      </div>
      <ul className="space-y-2.5">
        {column.links.map((link) => (
          <li key={link.labelEn}>
            <Link
              href={link.external ? link.href : `/${locale}${link.href}`}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className={cn(
                "group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#7b57fc] transition-colors",
                isAr && "flex-row-reverse justify-end",
              )}
            >
              <ChevronRight
                className={cn(
                  "w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-all",
                  isAr ? "rotate-180" : "group-hover:translate-x-0.5",
                )}
              />
              <span>{isAr ? link.labelAr : link.labelEn}</span>
              {link.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#7b57fc]/15 text-[#7b57fc] ml-1">
                  {isAr ? link.badge.ar : link.badge.en}
                </span>
              )}
              {link.external && (
                <ExternalLink className="w-2.5 h-2.5 opacity-50 shrink-0" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer link data — rooted in the schema services
// ─────────────────────────────────────────────────────────────────────────────
const COLUMNS: FooterColumn[] = [
  {
    titleEn: "Services",
    titleAr: "الخدمات",
    icon: Zap,
    links: [
      {
        labelEn: "Product Requests",
        labelAr: "طلبات المنتجات",
        href: "/dashboard/requests",
        badge: { en: "Popular", ar: "الأكثر طلباً" },
      },
      {
        labelEn: "Video Bookings",
        labelAr: "حجز الجلسات",
        href: "/dashboard/bookings",
      },
      {
        labelEn: "Market Tours",
        labelAr: "جولات السوق",
        href: "/dashboard/bookings",
      },
      {
        labelEn: "Factory Visits",
        labelAr: "زيارات المصانع",
        href: "/dashboard/bookings",
      },
      {
        labelEn: "Business Consulting",
        labelAr: "استشارات تجارية",
        href: "/dashboard/consulting",
      },
      {
        labelEn: "Shipping Calculator",
        labelAr: "حاسبة الشحن",
        href: "/dashboard/requests",
      },
    ],
  },
  {
    titleEn: "Discover",
    titleAr: "استكشف",
    icon: TrendingUp,
    links: [
      {
        labelEn: "Trending Products",
        labelAr: "المنتجات الرائجة",
        href: "/products",
        badge: { en: "New", ar: "جديد" },
      },
      {
        labelEn: "Featured Products",
        labelAr: "منتجات مميزة",
        href: "/products",
      },
      {
        labelEn: "Electronics",
        labelAr: "إلكترونيات",
        href: "/products?category=electronics",
      },
      {
        labelEn: "Home & Living",
        labelAr: "المنزل والمعيشة",
        href: "/products?category=home",
      },
      {
        labelEn: "Fashion & Apparel",
        labelAr: "الأزياء والملابس",
        href: "/products?category=fashion",
      },
    ],
  },
  {
    titleEn: "Company",
    titleAr: "الشركة",
    icon: Shield,
    links: [
      { labelEn: "About Us", labelAr: "من نحن", href: "/about" },
      {
        labelEn: "How It Works",
        labelAr: "كيف يعمل النظام",
        href: "/#how-it-works",
      },
      // { labelEn: "Pricing", labelAr: "الأسعار والباقات", href: "/pricing" },
      // {
      //   labelEn: "Privacy Policy",
      //   labelAr: "سياسة الخصوصية",
      //   href: "/privacy",
      // },
      {
        labelEn: "Service",
        labelAr: "الاستخدام",
        href: "/services",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Social / contact buttons
// ─────────────────────────────────────────────────────────────────────────────
function ContactRow({ isAr }: { isAr: boolean }) {
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT ?? "+86 152 6866 4202";
  const whatsappMsg = encodeURIComponent(
    isAr ? "مرحباً، أحتاج مساعدة" : "Hello, I need help",
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        isAr ? "flex-row-reverse" : "",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* WhatsApp */}
      <a
        href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${whatsappMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all hover:-translate-y-0.5 shadow-md shadow-emerald-500/20"
      >
        <WhatsAppIcon className="w-3.5 h-3.5" />
        {isAr ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
      </a>

      {/* Email */}
      <a
        href="mailto:info@jahez.online"
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-[#7b57fc]/40 transition-all hover:-translate-y-0.5"
      >
        <Mail className="w-3.5 h-3.5" />
        {isAr ? "راسلنا بالإيميل" : "Send an email"}
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Newsletter / CTA mini banner
// ─────────────────────────────────────────────────────────────────────────────
function CtaBanner({ isAr, locale }: { isAr: boolean; locale: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#7b57fc]/20 bg-[#7b57fc]/5 px-6 py-5"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Background orb */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full orb-brand opacity-30" />

      <div
        className={cn(
          "relative flex flex-col sm:flex-row items-start sm:items-center gap-4",
          isAr && "sm:flex-row-reverse",
        )}
      >
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground mb-0.5">
            {isAr ? "جاهز للاستيراد؟" : "Ready to start sourcing?"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "أرسل طلبك الأول وسيردّ فريقنا خلال 48 ساعة."
              : "Submit your first request and our team replies within 48 hours."}
          </p>
        </div>
        <Link
          href={`/${locale}/dashboard/requests`}
          className="group flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#7b57fc] text-white text-xs font-bold shadow-md shadow-[#7b57fc]/25 hover:bg-[#6a48eb] transition-all hover:-translate-y-0.5 whitespace-nowrap shrink-0"
        >
          {isAr ? "ابدأ الآن" : "Get started"}
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Footer
// ─────────────────────────────────────────────────────────────────────────────
export function FooterSection() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-background border-t border-border/50 overflow-hidden">
      {/* Very subtle bg texture */}
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.015] pointer-events-none" />

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8"
        >
          {/* ── Brand column ── */}
          <div
            className="lg:col-span-4 flex flex-col gap-5"
            dir={isAr ? "rtl" : "ltr"}
          >
            {/* Logo */}
            <div
              className={cn(
                "flex items-center gap-2.5",
                isAr && "flex-row-reverse justify-end",
              )}
            >
              <div className="w-10 h-10 rounded-2xl bg-background flex items-center justify-center shadow-lg shadow-[#7b57fc]/25">
                <div className="relative w-40 h-40">
                  <Image
                    src="/logo/icons.png"
                    alt="Platform logo"
                    fill
                    className="object-contain"
                    sizes="80px"
                    priority
                  />
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-none">
                  {isAr ? "جاهز" : "JAHEZ"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                  {isAr
                    ? "منصة الاستيراد والتجارة"
                    : "Sourcing & Trade Platform"}
                </p>
              </div>
            </div>

            {/* Tagline */}
            <p
              className={cn(
                "text-sm text-muted-foreground leading-relaxed max-w-xs",
                isAr && "text-right",
              )}
            >
              {isAr
                ? "نربطك بالموردين في الصين وأمريكا وغيرها. طلبات استيراد، جلسات فيديو، واستشارات تجارية كل شيء في منصة واحدة."
                : "Connecting you to suppliers in China, the USA, and beyond. Product requests, video sessions, and business consulting all in one platform."}
            </p>

            {/* Contact */}
            <ContactRow isAr={isAr} />

            {/* Address note */}
            <div
              className={cn(
                "flex items-start gap-2 text-xs text-muted-foreground/70",
                isAr && "flex-row-reverse text-right",
              )}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {isAr
                  ? "نعمل عن بُعد مع فريق في الصين، السعودية، الإمارات، اليمن، وأمريكا"
                  : "Remote team based in China, Saudi Arabia, UAE, Yemen & USA"}
              </span>
            </div>
          </div>

          {/* ── Link columns ── */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {COLUMNS.map((col) => (
              <LinkColumn
                key={col.titleEn}
                column={col}
                locale={locale}
                isAr={isAr}
              />
            ))}
          </div>
        </motion.div>

        {/* ── CTA banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-10"
        >
          <CtaBanner isAr={isAr} locale={locale} />
        </motion.div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-border/40">
        <div
          className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3"
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Copyright */}
          <p className="text-xs text-muted-foreground/70 text-center sm:text-left">
            {isAr
              ? `© ${year} منصة JAHEZ TRADE CO. الحقوق محفوظة.`
              : `© ${year} JAHEZ TRADE CO All rights reserved.`}
          </p>

          {/* Bottom links */}
          <div className="flex items-center gap-4">
            {[
              { en: "Privacy", ar: "الخصوصية", href: "/privacy" },
              { en: "Terms", ar: "الشروط", href: "/terms" },
              { en: "Sitemap", ar: "خريطة الموقع", href: "/sitemap" },
            ].map(({ en, ar, href }) => (
              <Link
                key={en}
                href={`/${locale}${href}`}
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                {isAr ? ar : en}
              </Link>
            ))}
          </div>

          {/* Social Media Icons */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/profile.php?id=61590643993991"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={isAr ? "فيسبوك" : "Facebook"}
              className="text-muted-foreground/60 hover:text-[#1877f2] transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://www.instagram.com/jahez_trade_co/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={isAr ? "إنستغرام" : "Instagram"}
              className="text-muted-foreground/60 hover:text-[#e4405f] transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.tiktok.com/@jahez.trade.co?is_from_webapp=1&sender_device=pc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={isAr ? "إكس" : "X"}
              className="text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <AiFillTikTok  className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
