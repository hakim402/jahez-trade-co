"use client";

// app/[locale]/_components/video-booking-sections.tsx
import { motion } from "motion/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  Video,
  CheckCircle,
  Calendar,
  Clock,
  Factory,
  Store,
  Sparkles,
  MapPin,
  Mic,
  MessageSquare,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingType = "MARKET" | "FACTORY" | "CUSTOM";
type BookingStatus = "REQUESTED" | "PROPOSED" | "CONFIRMED" | "COMPLETED";
type MeetingProvider = "ZOOM" | "GOOGLE_MEET" | "WHATSAPP";

// ─── Floating Mockup Sub-components ──────────────────────────────────────────

function BookingCard({
  type,
  status,
  scheduledAt,
  provider,
  duration,
  delay = 0,
  className,
  isAr = false,
}: {
  type: BookingType;
  status: BookingStatus;
  scheduledAt: string;
  provider: MeetingProvider;
  duration: number;
  delay?: number;
  className?: string;
  isAr?: boolean;
}) {
  const TYPE_META = {
    MARKET: {
      label: "Market Tour",
      labelAr: "جولة في السوق",
      icon: Store,
      image: "",
      color:
        "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
    },
    FACTORY: {
      label: "Factory Visit",
      labelAr: "زيارة المصنع",
      icon: Factory,
      image: "",
      color:
        "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
    },
    CUSTOM: {
      label: "Consultation",
      labelAr: "استشارة",
      icon: Video,
      image: "",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    },
  };

  const STATUS_META = {
    REQUESTED: {
      label: "Pending",
      labelAr: "قيد الانتظار",
      color:
        "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    },
    PROPOSED: {
      label: "Proposed",
      labelAr: "مقترح",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    },
    CONFIRMED: {
      label: "Confirmed",
      labelAr: "مؤكد",
      color:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    },
    COMPLETED: {
      label: "Completed",
      labelAr: "مكتمل",
      color:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    },
  };

  const PROVIDER_ICON: Record<MeetingProvider, string> = {
    ZOOM: "🎥",
    GOOGLE_MEET: "🟢",
    WHATSAPP: "💬",
  };

  const t = TYPE_META[type];
  const s = STATUS_META[status];
  const Icon = t.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={cn(
        "bg-white dark:bg-card rounded-2xl shadow-lg shadow-black/8 border border-border/40 p-3.5 w-64",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-2.5">
        {/* Image / Icon container */}
        <div className="relative w-8 h-8 rounded-xl overflow-hidden shrink-0">
          {t.image ? (
            <Image
              src={t.image}
              alt={t.label}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#7b57fc]/10">
              <Icon className="w-4 h-4 text-[#7b57fc]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">
            {isAr ? t.labelAr : t.label}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> {isAr ? "الصين" : "China"} ·{" "}
            {duration} {isAr ? "دقيقة" : "min"}
          </p>
        </div>
        <span
          className={cn(
            "text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0",
            s.color,
          )}
        >
          {isAr ? s.labelAr : s.label}
        </span>
      </div>

      {/* Details */}
      <div className="bg-muted/30 rounded-xl px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            {scheduledAt}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {PROVIDER_ICON[provider]}{" "}
            {provider === "GOOGLE_MEET" ? "Google Meet" : provider}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function MeetingLiveCard({
  delay = 0,
  className,
  isAr = false,
}: {
  delay?: number;
  className?: string;
  isAr?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={cn(
        "bg-slate-900 dark:bg-slate-950 rounded-2xl shadow-xl shadow-black/20 border border-white/10 p-4 w-64",
        className,
      )}
    >
      {/* Live badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {isAr ? "مباشر" : "LIVE"}
        </span>
        <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> 18:24
        </span>
      </div>

      {/* Avatar grid — 2 participants */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {/* Admin */}
        <div className="rounded-xl bg-linear-to-br from-[#7b57fc] to-[#2b1cff] aspect-video relative overflow-hidden">
          <Image
            src="/images/video-call-men.jpg"
            alt="video call"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute bottom-1 left-1.5 flex items-center gap-1">
            <Mic className="w-2.5 h-2.5 text-white" />
            <span className="text-[8px] text-white font-medium">
              {isAr ? "المشرف" : "Admin"}
            </span>
          </div>
        </div>
        {/* Client */}
        <div className="rounded-xl bg-slate-700 aspect-video relative overflow-hidden">
          <Image
            src="/images/video-call-woman.jpg"
            alt="video call"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute bottom-1 left-1.5 flex items-center gap-1">
            <Mic className="w-2.5 h-2.5 text-white" />
            <span className="text-[8px] text-white font-medium">
              {isAr ? "أنت" : "You"}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={"ghost"}
          className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center"
        >
          <Mic className="w-3 h-3 text-white" />
        </Button>
        <Button
          variant={"ghost"}
          className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center"
        >
          <Video className="w-3 h-3 text-white" />
        </Button>
        <Button
          variant={"ghost"}
          className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center"
        >
          <PlayCircle className="w-3 h-3 text-white" />
        </Button>
        <Button
          variant={"ghost"}
          className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center"
        >
          <MessageSquare className="w-3 h-3 text-white" />
        </Button>
      </div>
    </motion.div>
  );
}

function NotificationPill({
  icon: Icon,
  text,
  color,
  delay = 0,
  className,
}: {
  icon: React.ElementType;
  text: string;
  color: string;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "flex items-center gap-2 bg-white dark:bg-card rounded-full pl-2 pr-3 py-1.5 shadow-md shadow-black/8 border border-border/40 w-fit",
        className,
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center",
          color,
        )}
      >
        <Icon className="w-3 h-3 text-white" />
      </div>
      <span className="text-[10px] font-semibold text-foreground whitespace-nowrap">
        {text}
      </span>
    </motion.div>
  );
}

function StatsChip({
  value,
  label,
  delay = 0,
  className,
}: {
  value: string;
  label: string;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "bg-white dark:bg-card rounded-2xl shadow-lg shadow-black/8 border border-border/40 px-4 py-3 text-center",
        className,
      )}
    >
      <p className="text-xl font-bold text-[#7b57fc] tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
        {label}
      </p>
    </motion.div>
  );
}

// ─── MOCKUP 1 — Book a Session ────────────────────────────────────────────────

function BookSessionMockup() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="relative w-full h-80">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full orb-brand" />
      </div>

      {/* Main booking card */}
      <BookingCard
        type="MARKET"
        status="CONFIRMED"
        scheduledAt={
          isAr ? "السبت، 28 يونيو · 10:00 ص" : "Sat, Jun 28 · 10:00 AM"
        }
        provider="GOOGLE_MEET"
        duration={30}
        delay={0.1}
        className="absolute top-2 left-1/2 -translate-x-1/2 z-20"
        isAr={isAr}
      />

      {/* Behind card */}
      <BookingCard
        type="FACTORY"
        status="PROPOSED"
        scheduledAt={
          isAr ? "الاثنين، 30 يونيو · 2:00 م" : "Mon, Jun 30 · 2:00 PM"
        }
        provider="ZOOM"
        duration={45}
        delay={0.2}
        className="absolute top-14 left-1/2 -translate-x-1/3 translate-y-10 z-10 opacity-75 scale-95"
        isAr={isAr}
      />

      {/* Notification pills */}
      <NotificationPill
        icon={CheckCircle}
        text={isAr ? "تم تأكيد الجلسة ✓" : "Session confirmed ✓"}
        color="bg-emerald-500"
        delay={0.4}
        className="absolute bottom-6 left-0 z-30"
      />
      <NotificationPill
        icon={Calendar}
        text={isAr ? "تمت الإضافة إلى تقويمك" : "Added to your calendar"}
        color="bg-[#7b57fc]"
        delay={0.5}
        className="absolute bottom-6 right-0 z-30"
      />

      {/* Stats */}
      <StatsChip
        value="3"
        label={isAr ? "أنواع الجلسات" : "Session types"}
        delay={0.3}
        className="absolute top-0 right-0 z-30"
      />
    </div>
  );
}

// ─── MOCKUP 2 — Live Session ──────────────────────────────────────────────────

function LiveSessionMockup() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="relative w-full h-80">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full orb-brand" />
      </div>

      {/* Live meeting card */}
      <MeetingLiveCard
        delay={0.1}
        className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
        isAr={isAr}
      />

      {/* Stats */}
      <StatsChip
        value="HD"
        label={isAr ? "جودة الفيديو" : "Video quality"}
        delay={0.3}
        className="absolute top-2 left-0 z-30"
      />
      <StatsChip
        value="5+"
        label={isAr ? "منصات متاحة" : "Providers"}
        delay={0.35}
        className="absolute top-2 right-0 z-30"
      />
    </div>
  );
}

// ─── Feature Row ──────────────────────────────────────────────────────────────

interface FeatureRowProps {
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  mockup: React.ReactNode;
  reverse?: boolean;
  isAr?: boolean;
}

function FeatureRow({
  tag,
  title,
  subtitle,
  description,
  ctaLabel,
  ctaHref,
  mockup,
  reverse = false,
  isAr = false,
}: FeatureRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center",
        reverse && "md:[&>*:first-child]:order-2",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Text */}
      <motion.div
        initial={{ opacity: 0, x: reverse ? 24 : -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-5 text-center md:text-left"
      >
        <span className="inline-flex items-center justify-center md:justify-start gap-1.5 text-xs font-semibold text-[#7b57fc] uppercase tracking-wider">
          <span className="w-4 h-px bg-[#7b57fc]" />
          {tag}
        </span>

        <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          {title}
        </h2>

        <p className="text-sm font-semibold text-color">{subtitle}</p>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">
          {description}
        </p>

        <div className="flex justify-center md:justify-start">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#7b57fc] text-white text-sm font-semibold hover:bg-[#6a48eb] transition-all shadow-md shadow-[#7b57fc]/25 hover:shadow-lg hover:shadow-[#7b57fc]/30 hover:-translate-y-0.5"
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Mockup */}
      <motion.div
        initial={{ opacity: 0, x: reverse ? -24 : 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {mockup}
      </motion.div>
    </div>
  );
}

// ─── Session Type Pills ───────────────────────────────────────────────────────

function SessionTypePills({ isAr }: { isAr: boolean }) {
  const types = isAr
    ? [
        {
          icon: Store,
          image: "/images/market-tour.jpg",
          label: "جولة في السوق",
          desc: "تصفح السوق الصيني مباشرةً",
          color:
            "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
        },
        {
          icon: Factory,
          image: "/images/factory.jpg",
          label: "زيارة المصنع",
          desc: "تفقّد خط الإنتاج بنفسك",
          color:
            "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
        },
        {
          icon: Video,
          image: "/images/video-call.jpg",
          label: "استشارة حرة",
          desc: "ناقش طلبك مع أحد خبرائنا",
          color:
            "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
        },
      ]
    : [
        {
          icon: Store,
          image: "/images/market-tour.jpg",
          label: "Market Tour",
          desc: "Browse Chinese markets live",
          color:
            "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
        },
        {
          icon: Factory,
          image: "/images/factory.jpg",
          label: "Factory Visit",
          desc: "Inspect the production line",
          color:
            "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
        },
        {
          icon: Video,
          image: "/images/video-call.jpg",
          label: "Consultation",
          desc: "Discuss your request with an expert",
          color:
            "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
        },
      ];

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      dir={isAr ? "rtl" : "ltr"}
    >
      {types.map(({ icon: Icon, image, label, desc }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
        >
          {/* Image (Hero Section) */}
          <div className="relative w-full h-44 overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt={label}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-muted">
                <Icon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col gap-2 text-center">
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {desc}
            </p>
          </div>

          {/* Hover Accent */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-transparent group-hover:ring-[#7b57fc]/30 transition" />
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function VideoBookingSections() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const features = isAr
    ? [
        {
          tag: "حجز الجلسات",
          title: "شاهد منتجاتك قبل شرائها",
          subtitle: "جلسات فيديو مباشرة مع فريقنا في الصين",
          description:
            "احجز جلسة فيديو مع فريقنا المتواجد في الأسواق والمصانع الصينية. شاهد المنتجات، تفقّد جودتها، وتحدث مع المورد كل ذلك دون مغادرة منزلك.",
          ctaLabel: "احجز جلسة",
          ctaHref: `/${locale}/dashboard/video-bookings/`,
          mockup: <BookSessionMockup />,
          reverse: false,
        },
        {
          tag: "جلسة مباشرة",
          title: "تواصل مباشر عبر منصتك المفضلة",
          subtitle: "Zoom أو Google Meet أو واتساب اختر ما يناسبك",
          description:
            "يُرسل لك فريقنا رابط الاجتماع بعد تأكيد الموعد. الجلسة تُسجَّل بأمان وتصلك ملخصاً ذكياً فور انتهائها.",
          ctaLabel: "اعرف المزيد",
          ctaHref: `/${locale}/about`,
          mockup: <LiveSessionMockup />,
          reverse: true,
        },
      ]
    : [
        {
          tag: "Book a Session",
          title: "See your products before you buy",
          subtitle: "Live video sessions with our team on the ground in China",
          description:
            "Book a video call with our team stationed in markets and factories across China. Inspect products, check quality, and talk to the supplier all without leaving home.",
          ctaLabel: "Book a session",
          ctaHref: `/${locale}/dashboard/video-bookings/`,
          mockup: <BookSessionMockup />,
          reverse: false,
        },
        {
          tag: "Live Session",
          title: "Connect on your preferred platform",
          subtitle: "Zoom, Google Meet, WhatsApp you choose",
          description:
            "After your booking is confirmed, our team sends you a meeting link. Sessions are recorded securely and an AI summary is delivered to your dashboard the moment it ends.",
          ctaLabel: "Learn more",
          ctaHref: `/${locale}/about`,
          mockup: <LiveSessionMockup />,
          reverse: true,
        },
      ];

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Same lavender background as feature-sections */}
      <div className="absolute inset-0 bg-[oklch(0.97_0.01_280)] dark:bg-[oklch(0.14_0.02_270)]" />
      <div className="absolute inset-0 bg-brand-pattern opacity-[0.025]" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full orb-brand" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full orb-brand" />

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col gap-20 md:gap-28">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7b57fc]/10 border border-[#7b57fc]/20 mb-5">
            <Video className="w-4 h-4 text-[#7b57fc]" />
            <span className="text-sm font-semibold text-[#7b57fc]">
              {isAr ? "حجز الجلسات المرئية" : "Video Booking"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
            {isAr ? (
              <>
                <span className="text-gradient">شاهد، تفقّد</span> واشترِ بثقة
              </>
            ) : (
              <>
                See it, inspect it,{" "}
                <span className="text-gradient">buy with confidence</span>
              </>
            )}
          </h2>
          <p className="text-muted-foreground text-base">
            {isAr
              ? "فريقنا في الصين وأمريكا وغيرها جاهز لمرافقتك في جولات السوق وزيارات المصانع والاستشارات التجارية."
              : "Our team in China, the USA, and more is ready to guide you through market tours, factory visits, and business consultations."}
          </p>
        </motion.div>

        {/* Session type pills */}
        <SessionTypePills isAr={isAr} />

        {/* Feature rows */}
        {features.map((feature, i) => (
          <FeatureRow key={i} {...feature} isAr={isAr} />
        ))}
      </div>
    </section>
  );
}
