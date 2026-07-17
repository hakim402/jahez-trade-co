"use client";

import { motion } from "motion/react";
import {
  Mail,
  Clock,
  MessageSquare,
  MapPin,
  Package,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SA from "country-flag-icons/react/3x2/SA";
import YE from "country-flag-icons/react/3x2/YE";
import AE from "country-flag-icons/react/3x2/AE";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ContactInfo({
  isAr,
  locale,
}: {
  isAr: boolean;
  locale: string;
}) {
  const whatsapp = (
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT ?? "966500000000"
  ).replace(/\D/g, "");
  const msg = encodeURIComponent(
    isAr ? "مرحباً، أحتاج مساعدة" : "Hello, I need help",
  );

  const channels = [
    {
      icon: Mail,
      color: "bg-[#7b57fc]/10 text-[#7b57fc]",
      labelEn: "Email",
      labelAr: "البريد الإلكتروني",
      value: "info@jahez.online",
      href: "mailto:info@jahez.online",
    },
    {
      icon: WhatsAppIcon,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      labelEn: "WhatsApp",
      labelAr: "واتساب",
      value: isAr ? "دردشة مباشرة" : "Start a chat",
      href: `https://wa.me/${whatsapp}?text=${msg}`,
    },
    {
      icon: Clock,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      labelEn: "Response time",
      labelAr: "وقت الرد",
      value: isAr ? "أقل من ٢٤ ساعة" : "Under 24 hours",
      href: null,
    },
    {
      icon: MapPin,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      labelEn: "Operating in",
      labelAr: "نعمل في",
      // Instead of a string of emojis, store an array of flag components
      flags: [SA, YE, AE, CN, US],
      href: null,
    },
  ];

  const quickLinks = [
    {
      icon: Package,
      labelEn: "Submit a request",
      labelAr: "إرسال طلب استيراد",
      href: `/${locale}/dashboard/requests/`,
    },
    {
      icon: Video,
      labelEn: "Book a session",
      labelAr: "حجز جلسة فيديو",
      href: `/${locale}/dashboard/video-bookings/`,
    },
    {
      icon: MessageSquare,
      labelEn: "Consulting",
      labelAr: "طلب استشارة",
      href: `/${locale}/consulting`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: isAr ? 20 : -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-5"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {isAr ? "معلومات التواصل" : "Contact information"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr
            ? "اختر أي قناة تواصل تفضّلها"
            : "Reach us through any channel you prefer"}
        </p>
      </div>

      {/* Channels */}
      <div className="space-y-2.5">
        {channels.map(
          ({ icon: Icon, color, labelEn, labelAr, value, href, flags }) => {
            const inner = (
              <div
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-2xl border border-border/50 bg-card transition-all",
                  href && "hover:border-[#7b57fc]/30 cursor-pointer mb-3",
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    color.split(" ").slice(0, 2).join(" "),
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4.5 h-4.5",
                      color.split(" ").slice(2).join(" "),
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {isAr ? labelAr : labelEn}
                  </p>
                  {/* Special case for Operating in: render flags as SVG */}
                  {labelEn === "Operating in" && flags ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      {flags.map((FlagComponent, i) => (
                        <FlagComponent key={i} className="w-4 h-4" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
                      {value}
                    </p>
                  )}
                </div>
              </div>
            );
            return href ? (
              <a
                key={labelEn}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            ) : (
              <div key={labelEn}>{inner}</div>
            );
          },
        )}
      </div>

      {/* Quick links */}
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {isAr ? "روابط سريعة" : "Quick links"}
        </p>
        <div className="space-y-2">
          {quickLinks.map(({ icon: Icon, labelEn, labelAr, href }) => (
            <a
              key={labelEn}
              href={href}
              className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-[#7b57fc] transition-colors group"
            >
              <div className="w-6 h-6 rounded-lg bg-[#7b57fc]/8 flex items-center justify-center shrink-0 group-hover:bg-[#7b57fc]/15 transition-colors">
                <Icon className="w-3.5 h-3.5 text-[#7b57fc]" />
              </div>
              {isAr ? labelAr : labelEn}
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
