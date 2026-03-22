"use client";

// app/[locale]/dashboard/(routes)/video-booking/_components/BookingPageClient.tsx

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Video,
  Calendar,
  MapPin,
  Link2,
  Eye,
  RefreshCw,
  History,
  Zap,
  ArrowRight,
  Monitor,
  ShoppingCart,
  Factory,
  ExternalLink,
  Lock,
  Unlock,
  Phone,
  Copy,
  StickyNote,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BookingStatus,
  BookingType,
  MeetingProvider,
} from "@prisma/client";
import type {
  SerializedBooking,
  SerializedSlot,
  UserPlanInfo,
  BookingKpi,
  BookingDashboardSummary,
} from "../actions";
import {
  createBooking,
  confirmScheduledBooking,
  cancelMyBooking,
  getAvailableSlots,
  getBookingDashboardSummary,
} from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// Bilingual strings
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  en: {
    // General
    newBooking: "New Booking",
    refresh: "Refresh",
    close: "Close",
    cancel: "Cancel",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    submit: "Submit Request",
    submitting: "Submitting…",
    confirming: "Confirming…",
    cancelling: "Cancelling…",
    // Plan
    planUsage: "Bookings used",
    of: "of",
    unlimited: "Unlimited",
    upgradeNeeded: "You have reached your booking limit.",
    upgrade: "Upgrade Plan",
    // KPIs
    total: "Total",
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    // Status
    all: "All",
    requested: "Requested",
    proposed: "Proposed",
    confirmedStatus: "Confirmed",
    rejected: "Rejected",
    rescheduled: "Rescheduled",
    completedStatus: "Completed",
    canceled: "Cancelled",
    noShow: "No-show",
    // Booking form
    step1: "Choose a type",
    step2: "Details & time",
    bookingType: "Booking type",
    market: "Market Visit",
    factory: "Factory Tour",
    custom: "General Consultation",
    marketDesc: "Guided sourcing market visit",
    factoryDesc: "Factory inspection tour",
    customDesc: "Video call for any topic",
    duration: "Preferred duration",
    min30: "30 minutes",
    min45: "45 minutes",
    min60: "60 minutes",
    min90: "90 minutes",
    pickSlot: "Pick an available slot",
    orPreferredTime: "Or enter a preferred date & time",
    noSlotsAvail:
      "No slots available right now. Enter a preferred time instead.",
    notes: "Notes (optional)",
    notesPlaceholder: "Tell us what you'd like to discuss…",
    // Card
    scheduledFor: "Scheduled for",
    meetingLink: "Join meeting",
    meetingPassword: "Password",
    copyLink: "Copy link",
    copied: "Copied!",
    provider: "Meeting via",
    confirmBooking: "Confirm this time",
    cancelBooking: "Cancel booking",
    cancelConfirm: "Cancel this booking?",
    yes: "Yes, cancel",
    keepIt: "Keep it",
    aiSummary: "AI Summary",
    history: "History",
    showHistory: "Show history",
    hideHistory: "Hide history",
    noBookings: "No bookings yet",
    noBookingsSub: "Schedule your first video consultation",
    requestedAt: "Requested",
    updatedAt: "Updated",
    durationLabel: "Duration",
    typeLabel: "Type",
    // Proposed action
    proposedBanner:
      "A time has been proposed for your session. Please confirm or cancel.",
    // Confirmed action
    confirmedBanner:
      "Your session is confirmed! Check the meeting details below.",
    // Completed
    completedBanner: "This session has been completed.",
    // Rejected
    rejectedBanner:
      "This booking was not accepted. Please submit a new request.",
  },
  ar: {
    newBooking: "حجز جديد",
    refresh: "تحديث",
    close: "إغلاق",
    cancel: "إلغاء",
    confirm: "تأكيد",
    back: "رجوع",
    next: "التالي",
    submit: "إرسال الطلب",
    submitting: "جارٍ الإرسال…",
    confirming: "جارٍ التأكيد…",
    cancelling: "جارٍ الإلغاء…",
    planUsage: "الحجوزات المستخدمة",
    of: "من",
    unlimited: "غير محدود",
    upgradeNeeded: "وصلت إلى حد الحجوزات المسموح به.",
    upgrade: "ترقية الخطة",
    total: "المجموع",
    pending: "قيد الانتظار",
    confirmed: "مؤكدة",
    completed: "مكتملة",
    all: "الكل",
    requested: "مطلوب",
    proposed: "مقترح",
    confirmedStatus: "مؤكد",
    rejected: "مرفوض",
    rescheduled: "معاد جدولته",
    completedStatus: "مكتمل",
    canceled: "ملغى",
    noShow: "لم يحضر",
    step1: "اختر النوع",
    step2: "التفاصيل والوقت",
    bookingType: "نوع الحجز",
    market: "زيارة السوق",
    factory: "جولة المصنع",
    custom: "استشارة عامة",
    marketDesc: "زيارة سوق المصادر بتوجيه",
    factoryDesc: "جولة تفتيش المصنع",
    customDesc: "مكالمة فيديو لأي موضوع",
    duration: "المدة المفضلة",
    min30: "٣٠ دقيقة",
    min45: "٤٥ دقيقة",
    min60: "٦٠ دقيقة",
    min90: "٩٠ دقيقة",
    pickSlot: "اختر موعدًا متاحًا",
    orPreferredTime: "أو أدخل تاريخًا ووقتًا مفضلاً",
    noSlotsAvail: "لا توجد مواعيد متاحة الآن. أدخل وقتًا مفضلاً.",
    notes: "ملاحظات (اختياري)",
    notesPlaceholder: "أخبرنا بما تود مناقشته…",
    scheduledFor: "مجدول لـ",
    meetingLink: "انضم إلى الاجتماع",
    meetingPassword: "كلمة المرور",
    copyLink: "نسخ الرابط",
    copied: "تم النسخ!",
    provider: "الاجتماع عبر",
    confirmBooking: "تأكيد هذا الوقت",
    cancelBooking: "إلغاء الحجز",
    cancelConfirm: "إلغاء هذا الحجز؟",
    yes: "نعم، إلغاء",
    keepIt: "الإبقاء عليه",
    aiSummary: "ملخص الذكاء الاصطناعي",
    history: "السجل",
    showHistory: "عرض السجل",
    hideHistory: "إخفاء السجل",
    noBookings: "لا توجد حجوزات بعد",
    noBookingsSub: "احجز أول استشارة فيديو لك",
    requestedAt: "تاريخ الطلب",
    updatedAt: "آخر تحديث",
    durationLabel: "المدة",
    typeLabel: "النوع",
    proposedBanner: "تم اقتراح موعد لجلستك. يرجى التأكيد أو الإلغاء.",
    confirmedBanner: "تم تأكيد جلستك! راجع تفاصيل الاجتماع أدناه.",
    completedBanner: "اكتملت هذه الجلسة.",
    rejectedBanner: "لم يتم قبول هذا الحجز. يرجى إرسال طلب جديد.",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  BookingStatus,
  { dot: string; ring: string; icon: React.ElementType }
> = {
  REQUESTED: {
    dot: "bg-blue-500",
    ring: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
    icon: Clock,
  },
  PROPOSED: {
    dot: "bg-violet-500",
    ring: "bg-violet-500/10 border-violet-500/25 text-violet-600 dark:text-violet-400",
    icon: Calendar,
  },
  CONFIRMED: {
    dot: "bg-emerald-500",
    ring: "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle,
  },
  REJECTED: {
    dot: "bg-red-500",
    ring: "bg-red-500/10 border-red-500/25 text-red-500",
    icon: XCircle,
  },
  RESCHEDULED: {
    dot: "bg-amber-500",
    ring: "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400",
    icon: RefreshCw,
  },
  COMPLETED: {
    dot: "bg-green-500",
    ring: "bg-green-500/10 border-green-500/25 text-green-600 dark:text-green-400",
    icon: CheckCircle,
  },
  CANCELED: {
    dot: "bg-muted-foreground",
    ring: "bg-muted/40 border-border/50 text-muted-foreground",
    icon: XCircle,
  },
  NO_SHOW: {
    dot: "bg-orange-500",
    ring: "bg-orange-500/10 border-orange-500/25 text-orange-600",
    icon: AlertCircle,
  },
};

const TYPE_ICONS: Record<BookingType, React.ElementType> = {
  MARKET: ShoppingCart,
  FACTORY: Factory,
  CUSTOM: Monitor,
};

const PROVIDER_ICONS: Record<MeetingProvider, string> = {
  ZOOM: "🟦 Zoom",
  GOOGLE_MEET: "🟢 Google Meet",
  WHATSAPP: "📱 WhatsApp",
  MICROSOFT_TEAMS: "🔵 Teams",
  CUSTOM: "🔗 Link",
};

const ALL_STATUSES = Object.keys(STATUS_CFG) as BookingStatus[];

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function RelativeTime({
  date,
  className,
  isAr,
}: {
  date: string;
  className?: string;
  isAr: boolean;
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    const update = () => {
      const { formatDistanceToNow: fdt } =
        require("date-fns") as typeof import("date-fns");
      setText(
        fdt(new Date(date), { addSuffix: true, locale: isAr ? arSA : enUS }),
      );
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [date, isAr]);
  return (
    <span className={className} suppressHydrationWarning>
      {text || ""}
    </span>
  );
}

function StatusBadge({ status, t }: { status: BookingStatus; t: typeof T.en }) {
  const c = STATUS_CFG[status];
  const labelMap: Record<BookingStatus, string> = {
    REQUESTED: t.requested,
    PROPOSED: t.proposed,
    CONFIRMED: t.confirmedStatus,
    REJECTED: t.rejected,
    RESCHEDULED: t.rescheduled,
    COMPLETED: t.completedStatus,
    CANCELED: t.canceled,
    NO_SHOW: t.noShow,
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap",
        c.ring,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
      {labelMap[status]}
    </span>
  );
}

function Pagination({
  pagination,
  onPage,
  isAr,
}: {
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPage: (p: number) => void;
  isAr: boolean;
}) {
  const { page, pageSize, totalCount, totalPages } = pagination;
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2))
      nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const Prev = isAr ? ChevronRight : ChevronLeft;
  const Next = isAr ? ChevronLeft : ChevronRight;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40">
      <p className="text-xs text-muted-foreground order-2 sm:order-1">
        {from}–{to} {isAr ? "من" : "of"} {totalCount}
      </p>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl border-border/60"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <Prev className="w-3.5 h-3.5" />
        </Button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="text-xs px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={n}
              size="icon"
              variant={n === page ? "default" : "outline"}
              className={cn(
                "h-8 w-8 rounded-xl text-xs",
                n === page
                  ? "bg-[#7b57fc] text-white border-[#7b57fc] hover:bg-[#6a48eb]"
                  : "border-border/60",
              )}
              onClick={() => onPage(n as number)}
            >
              {n}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl border-border/60"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          <Next className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan usage bar
// ─────────────────────────────────────────────────────────────────────────────

function PlanBar({
  plan,
  t,
  isAr,
}: {
  plan: UserPlanInfo;
  t: typeof T.en;
  isAr: boolean;
}) {
  const isUnlimited = plan.limit === Infinity;
  const pct = isUnlimited
    ? 0
    : Math.min(100, Math.round((plan.usedCount / plan.limit) * 100));
  const isFull = !plan.hasAccess;

  if (isFull)
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {t.upgradeNeeded}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {plan.planName} · {plan.usedCount} {isAr ? t.of : "of"}{" "}
              {plan.limit} {t.planUsage}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 px-4 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 shrink-0"
        >
          <Zap className="w-3.5 h-3.5" /> {t.upgrade}
        </Button>
      </motion.div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card"
    >
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-foreground">
            {t.planUsage} ·{" "}
            <span className="font-normal text-muted-foreground">
              {plan.planName}
            </span>
          </p>
          <p className="text-xs text-muted-foreground shrink-0">
            {isUnlimited
              ? t.unlimited
              : `${plan.usedCount} ${t.of} ${plan.limit}`}
          </p>
        </div>
        {!isUnlimited ? (
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                pct >= 80 ? "bg-amber-500" : "bg-[#7b57fc]",
              )}
            />
          </div>
        ) : (
          <div className="h-1.5 bg-[#7b57fc]/15 rounded-full overflow-hidden">
            <div className="h-full w-full bg-linear-to-r from-[#7b57fc]/30 to-[#7b57fc] rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI strip
// ─────────────────────────────────────────────────────────────────────────────

function KpiStrip({ kpi, t }: { kpi: BookingKpi; t: typeof T.en }) {
  const cards = [
    {
      label: t.total,
      value: kpi.total,
      icon: Video,
      grad: "from-[#7b57fc] to-[#2b1cff]",
      sh: "shadow-[#7b57fc]/20",
    },
    {
      label: t.pending,
      value: kpi.pending,
      icon: Clock,
      grad: "from-amber-400 to-orange-500",
      sh: "shadow-amber-500/20",
    },
    {
      label: t.confirmed,
      value: kpi.confirmed,
      icon: CheckCircle,
      grad: "from-emerald-400 to-teal-500",
      sh: "shadow-emerald-500/20",
    },
    {
      label: t.completed,
      value: kpi.completed,
      icon: TrendingUp,
      grad: "from-sky-400 to-blue-500",
      sh: "shadow-sky-500/20",
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, grad, sh }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3"
        >
          <div
            className={cn(
              "absolute -top-4 -right-4 h-14 w-14 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 bg-linear-to-br",
              grad,
            )}
          />
          <div
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-md",
              grad,
              sh,
            )}
          >
            <Icon size={15} className="text-white" />
          </div>
          <div className="relative">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
              {value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Booking Dialog
// ─────────────────────────────────────────────────────────────────────────────

function NewBookingDialog({
  open,
  onClose,
  onSuccess,
  t,
  isAr,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: typeof T.en;
  isAr: boolean;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, start] = useTransition();
  const [slots, setSlots] = useState<SerializedSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [form, setForm] = useState({
    type: "CUSTOM" as BookingType,
    durationMinutes: 30,
    notes: "",
    slotId: "",
    preferredTime: "",
  });

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setForm({
      type: "CUSTOM",
      durationMinutes: 30,
      notes: "",
      slotId: "",
      preferredTime: "",
    });
    setSlotsLoading(true);
    // Fetch available slots when dialog opens
    import("../actions").then(({ getAvailableSlots }) => {
      getAvailableSlots().then((r) => {
        if (r.success) setSlots(r.data);
        setSlotsLoading(false);
      });
    });
  }, [open]);

  const handleSubmit = () => {
    start(async () => {
      const r = await createBooking({
        type: form.type,
        durationMinutes: form.durationMinutes,
        requestNotes: form.notes.trim() || undefined,
        slotId: form.slotId || undefined,
        preferredTime: form.preferredTime
          ? new Date(form.preferredTime)
          : undefined,
      });
      if (r.success) {
        toast.success(
          isAr ? "تم إرسال طلب الحجز" : "Booking request submitted",
        );
        onClose();
        onSuccess();
      } else {
        const msg = r.error;
        if (msg.startsWith("UPGRADE_REQUIRED")) {
          toast.error(
            isAr
              ? "يلزم ترقية الخطة"
              : "Upgrade required to book more sessions",
          );
        } else {
          toast.error(msg);
        }
      }
    });
  };

  const typeOptions: {
    type: BookingType;
    label: string;
    desc: string;
    Icon: React.ElementType;
  }[] = [
    { type: "MARKET", label: t.market, desc: t.marketDesc, Icon: ShoppingCart },
    { type: "FACTORY", label: t.factory, desc: t.factoryDesc, Icon: Factory },
    { type: "CUSTOM", label: t.custom, desc: t.customDesc, Icon: Monitor },
  ];

  const durOptions = [
    { val: 30, label: t.min30 },
    { val: 45, label: t.min45 },
    { val: 60, label: t.min60 },
    { val: 90, label: t.min90 },
  ];

  const inputCls =
    "h-9 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";
  const labelCls =
    "text-[10px] font-bold text-muted-foreground uppercase tracking-wide";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0",
          "[&>button:last-child]:hidden",
        )}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-[#7b57fc]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {t.newBooking}
              </DialogTitle>
              <p className="text-[10px] text-muted-foreground">
                {step === 1 ? t.step1 : t.step2}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg shrink-0"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </DialogHeader>

        {/* Progress */}
        <div className="shrink-0 flex gap-1.5 px-6 pt-4">
          {([1, 2] as const).map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                s <= step ? "bg-[#7b57fc]" : "bg-muted/50",
              )}
            />
          ))}
        </div>

        {/* Body */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto px-6 py-5",
            "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60",
            "[&::-webkit-scrollbar-thumb:hover]:bg-border",
          )}
        >
          <AnimatePresence mode="wait">
            {/* Step 1 — type */}
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: isAr ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  {typeOptions.map(({ type, label, desc, Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, type }))}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all",
                        form.type === type
                          ? "border-[#7b57fc] bg-[#7b57fc]/8 text-[#7b57fc]"
                          : "border-border/50 hover:border-border/80 hover:bg-muted/10",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          form.type === type
                            ? "bg-[#7b57fc]/15"
                            : "bg-muted/50",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{label}</p>
                        <p
                          className={cn(
                            "text-xs",
                            form.type === type
                              ? "text-[#7b57fc]/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {desc}
                        </p>
                      </div>
                      {form.type === type && (
                        <CheckCircle className="w-4 h-4 ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>{t.duration}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {durOptions.map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, durationMinutes: val }))
                        }
                        className={cn(
                          "h-9 rounded-xl border text-xs font-semibold transition-all",
                          form.durationMinutes === val
                            ? "border-[#7b57fc] bg-[#7b57fc] text-white"
                            : "border-border/60 hover:border-border/80 text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2 — time & notes */}
            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: isAr ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Summary chip */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40">
                  {(() => {
                    const Icon = TYPE_ICONS[form.type];
                    return <Icon className="w-4 h-4 text-[#7b57fc] shrink-0" />;
                  })()}
                  <span className="text-sm font-semibold text-foreground">
                    {typeOptions.find((o) => o.type === form.type)?.label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {form.durationMinutes} {isAr ? "دقيقة" : "min"}
                  </span>
                </div>

                {/* Slot picker */}
                <div className="space-y-1.5">
                  <Label className={labelCls}>{t.pickSlot}</Label>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 h-9 px-3 rounded-xl border border-border/40 bg-muted/20">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {isAr ? "جارٍ التحميل…" : "Loading slots…"}
                      </span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-border/40 bg-muted/20 text-xs text-muted-foreground">
                      <AlertCircle className="w-4 h-4 shrink-0" />{" "}
                      {t.noSlotsAvail}
                    </div>
                  ) : (
                    <Select
                      value={form.slotId}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, slotId: v, preferredTime: "" }))
                      }
                    >
                      <SelectTrigger className={cn(inputCls, "w-full")}>
                        <SelectValue
                          placeholder={
                            isAr ? "اختر موعدًا" : "Choose a time slot…"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value=""
                          className="text-xs text-muted-foreground"
                        >
                          {isAr ? "بدون اختيار" : "No preference"}
                        </SelectItem>
                        {slots.map((slot) => (
                          <SelectItem
                            key={slot.id}
                            value={slot.id}
                            className="text-xs"
                          >
                            {format(
                              new Date(slot.startTime),
                              "EEE, MMM d · h:mm a",
                              { locale: isAr ? arSA : enUS },
                            )}
                            {" · "}
                            {slot.durationMinutes}min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Manual preferred time (shown when no slot selected) */}
                {!form.slotId && (
                  <div className="space-y-1.5">
                    <Label className={labelCls}>{t.orPreferredTime}</Label>
                    <Input
                      type="datetime-local"
                      value={form.preferredTime}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          preferredTime: e.target.value,
                        }))
                      }
                      dir="ltr"
                      className={inputCls}
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className={labelCls}>{t.notes}</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={4}
                    placeholder={t.notesPlaceholder}
                    className="rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center gap-2 px-6 py-4 border-t border-border/50 bg-background">
          {step === 2 && (
            <Button
              variant="outline"
              className="h-10 rounded-xl text-sm"
              onClick={() => setStep(1)}
            >
              {t.back}
            </Button>
          )}
          <div className="flex-1" />
          {step === 1 ? (
            <Button
              className="h-10 px-5 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-sm gap-2"
              onClick={() => setStep(2)}
            >
              {t.next} <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              disabled={isPending}
              className="h-10 px-5 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-sm gap-2"
              onClick={handleSubmit}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t.submitting}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> {t.submit}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking Card
// ─────────────────────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  t,
  isAr,
  onDone,
}: {
  booking: SerializedBooking;
  t: typeof T.en;
  isAr: boolean;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionType, setActionType] = useState<"confirm" | "cancel" | null>(
    null,
  );

  const cfg = STATUS_CFG[booking.status];
  const TypeIcon = TYPE_ICONS[booking.type];
  const shortId = `#${booking.id.slice(-6).toUpperCase()}`;

  const canConfirm = booking.status === "PROPOSED";
  const canCancel = ["REQUESTED", "PROPOSED", "RESCHEDULED"].includes(
    booking.status,
  );
  const hasMeeting = booking.meetingLink && booking.status === "CONFIRMED";
  const isActive = [
    "REQUESTED",
    "PROPOSED",
    "RESCHEDULED",
    "CONFIRMED",
  ].includes(booking.status);

  const typeLabel: Record<BookingType, string> = {
    MARKET: t.market,
    FACTORY: t.factory,
    CUSTOM: t.custom,
  };

  const handleConfirm = () => {
    setActionType("confirm");
    start(async () => {
      const r = await confirmScheduledBooking(booking.id);
      if (r.success) {
        toast.success(isAr ? "تم تأكيد الحجز" : "Booking confirmed");
        onDone();
      } else toast.error(r.error);
      setActionType(null);
    });
  };

  const handleCancel = () => {
    setActionType("cancel");
    start(async () => {
      const r = await cancelMyBooking(booking.id);
      if (r.success) {
        toast.success(isAr ? "تم إلغاء الحجز" : "Booking cancelled");
        onDone();
      } else toast.error(r.error);
      setShowCancel(false);
      setActionType(null);
    });
  };

  const handleCopyLink = () => {
    if (booking.meetingLink) {
      navigator.clipboard.writeText(booking.meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200",
        booking.status === "PROPOSED"
          ? "border-violet-500/30 hover:border-violet-500/50"
          : booking.status === "CONFIRMED"
            ? "border-emerald-500/30 hover:border-emerald-500/50"
            : "border-border/50 hover:border-border/80",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-5 py-4 border-b border-border/40 bg-muted/10",
          booking.status === "PROPOSED" && "bg-violet-500/5",
          booking.status === "CONFIRMED" && "bg-emerald-500/5",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <StatusBadge status={booking.status} t={t} />
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            {shortId}
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 hidden sm:inline-flex items-center gap-1",
              "bg-muted/30 border-border/40 text-muted-foreground",
            )}
          >
            <TypeIcon className="w-3 h-3" /> {typeLabel[booking.type]}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RelativeTime
            date={booking.createdAt}
            className="text-xs text-muted-foreground hidden sm:block"
            isAr={isAr}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Status banners */}
        {booking.status === "PROPOSED" && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-violet-500/8 border border-violet-500/20">
            <Calendar className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
            <p className="text-xs text-violet-600 dark:text-violet-400 leading-relaxed">
              {t.proposedBanner}
            </p>
          </div>
        )}
        {booking.status === "CONFIRMED" && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
              {t.confirmedBanner}
            </p>
          </div>
        )}
        {booking.status === "COMPLETED" && booking.aiSummary && (
          <div className="rounded-xl bg-[#7b57fc]/5 border border-[#7b57fc]/15 p-4">
            <p className="text-[10px] font-bold text-[#7b57fc] uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> {t.aiSummary}
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {booking.aiSummary}
            </p>
          </div>
        )}
        {booking.status === "REJECTED" && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400">
              {t.rejectedBanner}
            </p>
          </div>
        )}

        {/* Schedule info */}
        {booking.scheduledAt && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40">
            <Calendar className="w-4 h-4 text-[#7b57fc] shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                {t.scheduledFor}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {format(
                  new Date(booking.scheduledAt),
                  "EEEE, MMMM d, yyyy · h:mm a",
                  { locale: isAr ? arSA : enUS },
                )}
              </p>
            </div>
          </div>
        )}

        {/* Meeting link (CONFIRMED only) */}
        {hasMeeting && (
          <div className="space-y-2">
            {booking.meetingProvider && (
              <p className="text-xs text-muted-foreground">
                {t.provider}:{" "}
                <span className="font-semibold text-foreground">
                  {PROVIDER_ICONS[booking.meetingProvider]}
                </span>
              </p>
            )}
            <div className="flex items-center gap-2">
              <a
                href={booking.meetingLink!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0"
              >
                <Button
                  size="sm"
                  className="w-full h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-0 gap-2 text-xs"
                >
                  <Video className="w-3.5 h-3.5" /> {t.meetingLink}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </Button>
              </a>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0"
                onClick={handleCopyLink}
                title={t.copyLink}
              >
                {copied ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
            {booking.meetingPassword && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="w-3 h-3" /> {t.meetingPassword}:{" "}
                <span className="font-mono text-foreground">
                  {booking.meetingPassword}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {booking.requestNotes && (
          <div className="rounded-xl bg-muted/20 border border-border/40 p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <StickyNote className="w-3 h-3" /> {t.notes}
            </p>
            <p
              className={cn(
                "text-xs text-foreground/80 leading-relaxed",
                !expanded && "line-clamp-2",
              )}
            >
              {booking.requestNotes}
            </p>
          </div>
        )}

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-1">
                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      icon: TypeIcon,
                      label: t.typeLabel,
                      val: typeLabel[booking.type],
                    },
                    {
                      icon: Clock,
                      label: t.durationLabel,
                      val: `${booking.durationMinutes} ${isAr ? "دقيقة" : "min"}`,
                    },
                    {
                      icon: Calendar,
                      label: t.requestedAt,
                      val: format(new Date(booking.createdAt), "MMM d, yyyy", {
                        locale: isAr ? arSA : enUS,
                      }),
                    },
                  ].map(({ icon: Icon, label, val }) => (
                    <div
                      key={label}
                      className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/40"
                    >
                      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                          {label}
                        </p>
                        <p className="text-xs text-foreground mt-0.5">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Transcript link */}
                {booking.transcriptUrl && (
                  <a
                    href={booking.transcriptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#7b57fc] hover:underline underline-offset-2"
                  >
                    <ExternalLink className="w-3 h-3" /> View transcript
                  </a>
                )}

                {/* Status history */}
                <div>
                  <button
                    onClick={() => setShowHistory((p) => !p)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                  >
                    <History className="w-3 h-3" />
                    {showHistory ? t.hideHistory : t.showHistory} (
                    {booking.statusHistory.length})
                    {showHistory ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-3"
                      >
                        <div className="relative pl-4 space-y-2.5">
                          <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border/50" />
                          {booking.statusHistory.map((h) => {
                            const oldCfg = STATUS_CFG[h.oldStatus];
                            const newCfg = STATUS_CFG[h.newStatus];
                            return (
                              <div key={h.id} className="relative">
                                <div
                                  className={cn(
                                    "absolute -left-3.5 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background",
                                    newCfg.dot,
                                  )}
                                />
                                <div className="bg-muted/20 rounded-xl border border-border/40 px-3 py-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        className={cn(
                                          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                          oldCfg.ring,
                                        )}
                                      >
                                        {h.oldStatus}
                                      </span>
                                      <ChevronDown className="w-2.5 h-2.5 text-muted-foreground -rotate-90 shrink-0" />
                                      <span
                                        className={cn(
                                          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                          newCfg.ring,
                                        )}
                                      >
                                        {h.newStatus}
                                      </span>
                                    </div>
                                    <RelativeTime
                                      date={h.changedAt}
                                      className="text-[10px] text-muted-foreground shrink-0"
                                      isAr={isAr}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    {h.changedBy.fullName ?? h.changedBy.email}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PROPOSED actions */}
        {canConfirm && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isPending}
              className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-0 gap-1.5 text-xs"
            >
              {actionType === "confirm" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                  {t.confirming}
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" /> {t.confirmBooking}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Footer — cancel */}
      {canCancel && (
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/30 bg-muted/5">
          {!showCancel ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/8 gap-1.5"
              onClick={() => setShowCancel(true)}
            >
              <XCircle className="w-3.5 h-3.5" /> {t.cancelBooking}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{t.cancelConfirm}</p>
              <Button
                size="sm"
                className="h-7 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white border-0 text-xs"
                disabled={isPending}
                onClick={handleCancel}
              >
                {actionType === "cancel" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  t.yes
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowCancel(false)}
              >
                {t.keepIt}
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  isAr: boolean;
  initialData: BookingDashboardSummary | null;
  page: number;
  filterStatus: BookingStatus | undefined;
}

export function BookingPageClient({
  isAr,
  initialData,
  page,
  filterStatus,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, start] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const t = (isAr ? T.ar : T.en) as typeof T.en;

  const applyFilter = useCallback(
    (patch: Record<string, string | undefined>) => {
      start(() => {
        const base = new URLSearchParams();
        const merged: Record<string, string | undefined> = {
          page: String(page),
          status: filterStatus,
          ...patch,
        };
        Object.entries(merged).forEach(([k, v]) => {
          if (v !== undefined && !(k === "page" && v === "1")) base.set(k, v);
        });
        router.push(`${pathname}?${base.toString()}`);
      });
    },
    [page, filterStatus, router, pathname],
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  if (!initialData)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          {isAr ? "فشل التحميل" : "Failed to load"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={refresh}
        >
          <RefreshCw className="w-3.5 h-3.5" /> {t.refresh}
        </Button>
      </div>
    );

  const { planInfo, kpi, bookings, pagination } = initialData;

  // Status pill list — show all statuses so filter is always accessible
  const statusPills: { status: BookingStatus | undefined; label: string }[] = [
    { status: undefined, label: t.all },
    { status: "REQUESTED", label: t.requested },
    { status: "PROPOSED", label: t.proposed },
    { status: "CONFIRMED", label: t.confirmedStatus },
    { status: "RESCHEDULED", label: t.rescheduled },
    { status: "COMPLETED", label: t.completedStatus },
    { status: "CANCELED", label: t.canceled },
  ];

  return (
    <div className="flex flex-col gap-5" dir={isAr ? "rtl" : "ltr"}>
      {/* Plan bar */}
      <PlanBar plan={planInfo} t={t} isAr={isAr} />

      {/* KPI strip */}
      <KpiStrip kpi={kpi} t={t} />

      {/* Status filter + New booking button */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {statusPills.map(({ status, label }) => {
            const isActive = filterStatus === status;
            return (
              <button
                key={status ?? "all"}
                onClick={() =>
                  applyFilter({ status: status ?? undefined, page: "1" })
                }
                className={cn(
                  "flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-all whitespace-nowrap",
                  isActive
                    ? "bg-[#7b57fc] text-white border-[#7b57fc] shadow-sm"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border/80 bg-card",
                )}
              >
                {status && (
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      STATUS_CFG[status].dot,
                    )}
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-xl gap-1.5 text-xs text-muted-foreground"
            onClick={refresh}
            disabled={isPending}
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", isPending && "animate-spin")}
            />
            <span className="hidden sm:inline">{t.refresh}</span>
          </Button>
          <Button
            size="sm"
            disabled={!planInfo.hasAccess}
            className="h-8 px-4 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" /> {t.newBooking}
          </Button>
        </div>
      </div>

      {/* Booking list */}
      <AnimatePresence mode="wait">
        {bookings.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-5 py-24 rounded-2xl border border-dashed border-border/60 bg-card/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#7b57fc]/8 border border-[#7b57fc]/15 flex items-center justify-center">
              <Video className="w-7 h-7 text-[#7b57fc]/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground/70">
                {t.noBookings}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.noBookingsSub}
              </p>
            </div>
            <Button
              size="sm"
              disabled={!planInfo.hasAccess}
              className="h-9 px-5 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" /> {t.newBooking}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {bookings.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  t={t}
                  isAr={isAr}
                  onDone={refresh}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPage={(p) => applyFilter({ page: String(p) })}
        isAr={isAr}
      />

      {/* New booking dialog */}
      <NewBookingDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={refresh}
        t={t}
        isAr={isAr}
      />
    </div>
  );
}
