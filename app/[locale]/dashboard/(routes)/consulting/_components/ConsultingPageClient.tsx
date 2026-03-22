"use client";

// app/[locale]/dashboard/(routes)/consulting/_components/ConsultingPageClient.tsx
// One file — all sub-components private. Only ConsultingPageClient exported.

import { useState, useTransition, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
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
  Edit3,
  Briefcase,
  Globe,
  Ship,
  Truck,
  ShoppingCart,
  Factory,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Hash,
  DollarSign,
  Phone,
  Building2,
  Mail,
  Calendar,
  StickyNote,
  Eye,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ConsultingStatus,
  SerializedConsultingRequest,
  ConsultingDashboardSummary,
} from "../actions";
import {
  submitConsultingRequest,
  requestConsultingService,
  cancelConsultingRequest,
  updateMyConsultingRequest,
  getConsultingDashboardSummary,
} from "../actions";
import { ConsultingServiceTopic } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Bilingual strings
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  en: {
    // Tabs
    myRequests: "My Requests",
    serviceRequests: "Service Requests",
    // Actions
    newRequest: "New Request",
    submit: "Submit",
    submitting: "Submitting…",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    cancelRequest: "Cancel Request",
    cancelling: "Cancelling…",
    edit: "Edit",
    close: "Close",
    back: "Back",
    next: "Next",
    // Status
    all: "All",
    new: "New",
    inReview: "In Review",
    scheduled: "Scheduled",
    closed: "Closed",
    // Form
    step1Title: "Tell us about your need",
    step2Title: "Contact details",
    topic: "Topic",
    description: "Description",
    descPlaceholder: "Describe what you need help with in detail…",
    budget: "Budget (optional)",
    budgetPh: "e.g. $5,000–$10,000",
    fullName: "Full name",
    email: "Email",
    phone: "Phone (optional)",
    company: "Company (optional)",
    companyPh: "Your company name",
    // Topics
    sourcing: "Product Sourcing",
    import: "Import & Customs",
    logistics: "Logistics",
    market_entry: "Market Entry",
    supplier: "Supplier Sourcing",
    other: "General Consulting",
    // Card
    requestedService: "Service Request",
    openLimit: "Open requests",
    of: "of",
    adminNotes: "Notes from our team",
    cannotSubmit: "You have reached the maximum of 5 open requests.",
    noRequests: "No consulting requests yet",
    noRequestsSub: "Submit a new request to get started",
    noServiceReqs: "No service requests yet",
    noServiceReqsSub: "Browse our services and request one",
    confirmCancel: "Cancel this request?",
    yes: "Yes, cancel",
    keepIt: "Keep it",
    linkedService: "via service",
    editRequest: "Edit request",
    editNote: "You can only edit requests with NEW status.",
    viewService: "View service",
    createdAt: "Submitted",
    updatedAt: "Updated",
    refresh: "Refresh",
    scheduledNote:
      "A session has been scheduled. Check notes from our team below.",
  },
  ar: {
    myRequests: "طلباتي",
    serviceRequests: "طلبات الخدمات",
    newRequest: "طلب جديد",
    submit: "إرسال",
    submitting: "جارٍ الإرسال…",
    save: "حفظ",
    saving: "جارٍ الحفظ…",
    cancel: "إلغاء",
    cancelRequest: "إلغاء الطلب",
    cancelling: "جارٍ الإلغاء…",
    edit: "تعديل",
    close: "إغلاق",
    back: "رجوع",
    next: "التالي",
    all: "الكل",
    new: "جديد",
    inReview: "قيد المراجعة",
    scheduled: "مجدول",
    closed: "مغلق",
    step1Title: "أخبرنا باحتياجك",
    step2Title: "بيانات التواصل",
    topic: "الموضوع",
    description: "الوصف",
    descPlaceholder: "صف ما تحتاج المساعدة فيه بالتفصيل…",
    budget: "الميزانية (اختياري)",
    budgetPh: "مثال: 5,000–10,000 دولار",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "الهاتف (اختياري)",
    company: "الشركة (اختياري)",
    companyPh: "اسم شركتك",
    sourcing: "مصادر المنتجات",
    import: "الاستيراد والجمارك",
    logistics: "اللوجستيات",
    market_entry: "دخول الأسواق",
    supplier: "مصادر الموردين",
    other: "استشارة عامة",
    requestedService: "طلب خدمة",
    openLimit: "الطلبات المفتوحة",
    of: "من",
    adminNotes: "ملاحظات من فريقنا",
    cannotSubmit: "وصلت إلى الحد الأقصى وهو 5 طلبات مفتوحة.",
    noRequests: "لا توجد طلبات استشارة بعد",
    noRequestsSub: "أرسل طلبًا جديدًا للبدء",
    noServiceReqs: "لا توجد طلبات خدمات بعد",
    noServiceReqsSub: "تصفح خدماتنا وقدّم طلبًا",
    confirmCancel: "إلغاء هذا الطلب؟",
    yes: "نعم، إلغاء",
    keepIt: "الإبقاء عليه",
    linkedService: "عبر خدمة",
    editRequest: "تعديل الطلب",
    editNote: "يمكنك تعديل الطلبات ذات الحالة الجديدة فقط.",
    viewService: "عرض الخدمة",
    createdAt: "تاريخ الإرسال",
    updatedAt: "تاريخ التحديث",
    refresh: "تحديث",
    scheduledNote: "تم جدولة جلسة. راجع ملاحظات فريقنا أدناه.",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  ConsultingStatus,
  {
    dot: string;
    ring: string;
    icon: React.ElementType;
    glow: string;
  }
> = {
  NEW: {
    dot: "bg-blue-500",
    ring: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
    icon: Clock,
    glow: "shadow-blue-500/20",
  },
  IN_REVIEW: {
    dot: "bg-amber-500",
    ring: "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400",
    icon: Eye,
    glow: "shadow-amber-500/20",
  },
  SCHEDULED: {
    dot: "bg-emerald-500",
    ring: "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
    icon: Calendar,
    glow: "shadow-emerald-500/20",
  },
  CLOSED: {
    dot: "bg-muted-foreground",
    ring: "bg-muted/40 border-border/50 text-muted-foreground",
    icon: CheckCircle,
    glow: "",
  },
};

const TOPIC_ICONS: Record<ConsultingServiceTopic, React.ElementType> = {
  sourcing: ShoppingCart,
  import: Ship,
  logistics: Truck,
  market_entry: Globe,
  supplier: Factory,
  other: Briefcase,
};

const ALL_TOPICS = Object.values(ConsultingServiceTopic);
const ALL_STATUSES: ConsultingStatus[] = [
  "NEW",
  "IN_REVIEW",
  "SCHEDULED",
  "CLOSED",
];

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

function StatusBadge({
  status,
  t,
}: {
  status: ConsultingStatus;
  t: typeof T.en;
}) {
  const c = STATUS_CFG[status];
  const Icon = c.icon;
  const labelMap: Record<ConsultingStatus, string> = {
    NEW: t.new,
    IN_REVIEW: t.inReview,
    SCHEDULED: t.scheduled,
    CLOSED: t.closed,
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

function TopicChip({
  topic,
  t,
  isAr,
}: {
  topic: string;
  t: typeof T.en;
  isAr: boolean;
}) {
  const Icon = TOPIC_ICONS[topic as ConsultingServiceTopic] ?? Briefcase;
  const topicLabel: Record<string, string> = {
    sourcing: t.sourcing,
    import: t.import,
    logistics: t.logistics,
    market_entry: t.market_entry,
    supplier: t.supplier,
    other: t.other,
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full border border-border/40">
      <Icon className="w-3 h-3 shrink-0" />
      {topicLabel[topic] ?? topic}
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
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2))
      pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  const Prev = isAr ? ChevronRight : ChevronLeft;
  const Next = isAr ? ChevronLeft : ChevronRight;
  return (
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/40">
      <p className="text-xs text-muted-foreground">
        {isAr
          ? `${from}–${to} من ${totalCount}`
          : `${from}–${to} of ${totalCount}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl border-border/60"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <Prev className="w-3.5 h-3.5" />
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="text-xs px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              size="icon"
              variant={p === page ? "default" : "outline"}
              className={cn(
                "h-8 w-8 rounded-xl text-xs",
                p === page
                  ? "bg-[#7b57fc] text-white border-[#7b57fc] hover:bg-[#6a48eb]"
                  : "border-border/60",
              )}
              onClick={() => onPage(p as number)}
            >
              {p}
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
// Open-requests bar
// ─────────────────────────────────────────────────────────────────────────────

function OpenBar({
  totalOpen,
  canSubmitMore,
  t,
  isAr,
}: {
  totalOpen: number;
  canSubmitMore: boolean;
  t: typeof T.en;
  isAr: boolean;
}) {
  const MAX = 5;
  const pct = Math.min(100, Math.round((totalOpen / MAX) * 100));
  const isFull = !canSubmitMore;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border bg-card",
        isFull ? "border-amber-500/30 bg-amber-500/5" : "border-border/50",
      )}
    >
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-foreground">{t.openLimit}</p>
          <p className="text-xs text-muted-foreground shrink-0">
            {isAr
              ? `${totalOpen} ${t.of} ${MAX}`
              : `${totalOpen} ${t.of} ${MAX}`}
          </p>
        </div>
        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              isFull
                ? "bg-amber-500"
                : pct >= 60
                  ? "bg-amber-400"
                  : "bg-[#7b57fc]",
            )}
          />
        </div>
      </div>
      {isFull && (
        <div className="flex items-center gap-1.5 shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <p className="text-xs text-amber-600 dark:text-amber-400 hidden sm:block">
            {t.cannotSubmit}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Dialog
// ─────────────────────────────────────────────────────────────────────────────

function EditDialog({
  open,
  onClose,
  onDone,
  request,
  t,
  isAr,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  request: SerializedConsultingRequest;
  t: typeof T.en;
  isAr: boolean;
}) {
  const [isPending, start] = useTransition();
  const [form, setForm] = useState({
    description: request.description,
    phone: request.phone ?? "",
    company: request.company ?? "",
    budget: request.budget ?? "",
  });

  useEffect(() => {
    if (open)
      setForm({
        description: request.description,
        phone: request.phone ?? "",
        company: request.company ?? "",
        budget: request.budget ?? "",
      });
  }, [open, request.id]);

  const handleSave = () => {
    if (!form.description.trim()) return;
    start(async () => {
      const r = await updateMyConsultingRequest(request.id, {
        description: form.description.trim(),
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        budget: form.budget.trim() || undefined,
      });
      if (r.success) {
        toast.success(isAr ? "تم حفظ التعديلات" : "Changes saved");
        onClose();
        onDone();
      } else toast.error(r.error);
    });
  };

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
        className="p-0 gap-0 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden [&>button:last-child]:hidden"
        dir={isAr ? "rtl" : "ltr"}
      >
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4 text-[#7b57fc]" />
            </div>
            <DialogTitle className="text-sm font-bold text-foreground">
              {t.editRequest}
            </DialogTitle>
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

        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4",
            "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60",
          )}
        >
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#7b57fc]/6 border border-[#7b57fc]/15">
            <AlertCircle className="w-4 h-4 text-[#7b57fc] shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{t.editNote}</p>
          </div>

          <div className="space-y-1.5">
            <Label className={labelCls}>
              {t.description} <span className="text-[#7b57fc]">*</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={5}
              placeholder={t.descPlaceholder}
              className="rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>{t.phone}</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                dir="ltr"
                placeholder="+1 234 567 8900"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{t.company}</Label>
              <Input
                value={form.company}
                onChange={(e) =>
                  setForm((p) => ({ ...p, company: e.target.value }))
                }
                placeholder={t.companyPh}
                className={inputCls}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={labelCls}>{t.budget}</Label>
            <Input
              value={form.budget}
              onChange={(e) =>
                setForm((p) => ({ ...p, budget: e.target.value }))
              }
              placeholder={t.budgetPh}
              className={inputCls}
            />
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50 bg-background">
          <Button
            variant="outline"
            className="h-9 rounded-xl text-sm"
            onClick={onClose}
          >
            {t.cancel}
          </Button>
          <Button
            disabled={isPending || !form.description.trim()}
            className="h-9 px-5 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-sm gap-2"
            onClick={handleSave}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {t.save}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Request Dialog (2-step)
// ─────────────────────────────────────────────────────────────────────────────

function NewRequestDialog({
  open,
  onClose,
  onSuccess,
  t,
  isAr,
  userEmail,
  userName,
  userPhone,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: typeof T.en;
  isAr: boolean;
  userEmail: string;
  userName: string | null;
  userPhone?: string | null;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, start] = useTransition();
  const [form, setForm] = useState({
    topic: "" as ConsultingServiceTopic | "",
    description: "",
    budget: "",
    fullName: userName ?? "",
    email: userEmail,
    phone: userPhone ?? "",
    company: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setStep(1);
      setErrors({});
      setForm({
        topic: "",
        description: "",
        budget: "",
        fullName: userName ?? "",
        email: userEmail,
        phone: userPhone ?? "",
        company: "",
      });
    }
  }, [open]);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.topic) e.topic = isAr ? "الموضوع مطلوب" : "Topic is required";
    if (form.description.trim().length < 10)
      e.description = isAr
        ? "الوصف مطلوب (10 أحرف على الأقل)"
        : "At least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim())
      e.fullName = isAr ? "الاسم مطلوب" : "Name required";
    if (!form.email.includes("@"))
      e.email = isAr ? "بريد إلكتروني صالح" : "Valid email required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validateStep2()) return;
    start(async () => {
      const r = await submitConsultingRequest({
        topic: form.topic as ConsultingServiceTopic,
        description: form.description.trim(),
        budget: form.budget.trim() || undefined,
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
      });
      if (r.success) {
        toast.success(isAr ? "تم إرسال طلبك" : "Request submitted");
        onClose();
        onSuccess();
      } else toast.error(r.error);
    });
  };

  const inputCls =
    "h-9 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";
  const labelCls =
    "text-[10px] font-bold text-muted-foreground uppercase tracking-wide";

  const topicOptions = ALL_TOPICS.map((v) => {
    const labels: Record<ConsultingServiceTopic, string> = {
      sourcing: t.sourcing,
      import: t.import,
      logistics: t.logistics,
      market_entry: t.market_entry,
      supplier: t.supplier,
      other: t.other,
    };
    return { value: v, label: labels[v], Icon: TOPIC_ICONS[v] };
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="p-0 gap-0 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden [&>button:last-child]:hidden"
        dir={isAr ? "rtl" : "ltr"}
      >
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-[#7b57fc]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {t.newRequest}
              </DialogTitle>
              <p className="text-[10px] text-muted-foreground">
                {step === 1 ? t.step1Title : t.step2Title}
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

        {/* Progress bar */}
        <div className="shrink-0 flex gap-1.5 px-6 pt-4 pb-0">
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
          )}
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: isAr ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Topic grid */}
                <div className="space-y-1.5">
                  <Label className={labelCls}>
                    {t.topic} <span className="text-[#7b57fc]">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {topicOptions.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, topic: value }))}
                        className={cn(
                          "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-sm",
                          form.topic === value
                            ? "border-[#7b57fc] bg-[#7b57fc]/8 text-[#7b57fc]"
                            : "border-border/50 hover:border-border/80 text-foreground hover:bg-muted/20",
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.topic && (
                    <p className="text-xs text-red-500">{errors.topic}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>
                    {t.description} <span className="text-[#7b57fc]">*</span>
                  </Label>
                  <Textarea
                    value={form.description}
                    onChange={set("description")}
                    rows={5}
                    placeholder={t.descPlaceholder}
                    className={cn(
                      "rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50",
                      errors.description && "border-red-400",
                    )}
                  />
                  <div className="flex items-center justify-between">
                    {errors.description && (
                      <p className="text-xs text-red-500">
                        {errors.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 ml-auto">
                      {form.description.length}/2000
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>{t.budget}</Label>
                  <Input
                    value={form.budget}
                    onChange={set("budget")}
                    placeholder={t.budgetPh}
                    className={inputCls}
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: isAr ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Summary */}
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
                  <div className="flex items-center gap-2">
                    {form.topic &&
                      (() => {
                        const Icon =
                          TOPIC_ICONS[form.topic as ConsultingServiceTopic];
                        return (
                          <Icon className="w-4 h-4 text-[#7b57fc] shrink-0" />
                        );
                      })()}
                    <span className="text-sm font-semibold text-foreground">
                      {topicOptions.find((t) => t.value === form.topic)?.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {form.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>
                      {t.fullName} <span className="text-[#7b57fc]">*</span>
                    </Label>
                    <Input
                      value={form.fullName}
                      onChange={set("fullName")}
                      className={cn(
                        inputCls,
                        errors.fullName && "border-red-400",
                      )}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-500">{errors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>
                      {t.email} <span className="text-[#7b57fc]">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      dir="ltr"
                      className={cn(inputCls, errors.email && "border-red-400")}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>{t.phone}</Label>
                    <Input
                      value={form.phone}
                      onChange={set("phone")}
                      dir="ltr"
                      placeholder="+1 234 567 8900"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>{t.company}</Label>
                    <Input
                      value={form.company}
                      onChange={set("company")}
                      placeholder={t.companyPh}
                      className={inputCls}
                    />
                  </div>
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
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {t.submit}
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
// Request Card
// ─────────────────────────────────────────────────────────────────────────────

function RequestCard({
  request,
  t,
  isAr,
  onDone,
  isServiceType,
}: {
  request: SerializedConsultingRequest;
  t: typeof T.en;
  isAr: boolean;
  onDone: () => void;
  isServiceType: boolean;
}) {
  const [isPending, start] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const canEdit = request.status === "NEW" && !isServiceType;
  const canCancel = request.status === "NEW";
  const showNotes =
    (request.status === "SCHEDULED" || request.status === "CLOSED") &&
    !!request.adminNotes;
  const shortId = `#${request.id.slice(-6).toUpperCase()}`;

  const handleCancel = () => {
    start(async () => {
      const r = await cancelConsultingRequest(request.id);
      if (r.success) {
        toast.success(isAr ? "تم إلغاء الطلب" : "Request cancelled");
        onDone();
      } else toast.error(r.error);
    });
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className={cn(
          "rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200",
          request.status === "SCHEDULED"
            ? "border-emerald-500/30 hover:border-emerald-500/50"
            : "border-border/50 hover:border-border/80",
        )}
      >
        {/* Card header */}
        <div
          className={cn(
            "flex items-center justify-between gap-3 px-5 py-4 border-b border-border/40 bg-muted/10",
            request.status === "SCHEDULED" && "bg-emerald-500/5",
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <StatusBadge status={request.status} t={t} />
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              {shortId}
            </span>
            {isServiceType && request.linkedService && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[#7b57fc] bg-[#7b57fc]/8 px-2 py-0.5 rounded-full border border-[#7b57fc]/20 shrink-0">
                <Sparkles className="w-2.5 h-2.5" />
                {t.linkedService}: {request.linkedService.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RelativeTime
              date={request.createdAt}
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

        {/* Card body */}
        <div className="p-5 space-y-4">
          {/* Scheduled banner */}
          {request.status === "SCHEDULED" && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {t.scheduledNote}
              </p>
            </div>
          )}

          {/* Topic + description */}
          <div className="space-y-2">
            <TopicChip topic={request.topic} t={t} isAr={isAr} />
            <p
              className={cn(
                "text-sm text-foreground leading-relaxed",
                !expanded && "line-clamp-2",
              )}
            >
              {request.description}
            </p>
            {request.description.length > 120 && (
              <button
                onClick={() => setExpanded((p) => !p)}
                className="text-xs text-[#7b57fc] hover:underline underline-offset-2"
              >
                {expanded
                  ? isAr
                    ? "أقل"
                    : "Show less"
                  : isAr
                    ? "المزيد"
                    : "Show more"}
              </button>
            )}
          </div>

          {/* Admin notes (SCHEDULED/CLOSED only) */}
          {showNotes && (
            <div className="rounded-xl bg-[#7b57fc]/5 border border-[#7b57fc]/15 p-4">
              <p className="text-[10px] font-bold text-[#7b57fc] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <StickyNote className="w-3 h-3" /> {t.adminNotes}
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {request.adminNotes}
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
                  {/* Contact info grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Mail, label: t.email, val: request.email },
                      { icon: Phone, label: t.phone, val: request.phone },
                      {
                        icon: Building2,
                        label: t.company,
                        val: request.company,
                      },
                      {
                        icon: DollarSign,
                        label: t.budget,
                        val: request.budget,
                      },
                    ]
                      .filter((r) => r.val)
                      .map(({ icon: Icon, label, val }) => (
                        <div
                          key={label}
                          className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/40"
                        >
                          <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                              {label}
                            </p>
                            <p className="text-xs text-foreground truncate">
                              {val}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Linked service info */}
                  {isServiceType && request.linkedService && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                      {request.linkedService.primaryImage ? (
                        <img
                          src={request.linkedService.primaryImage}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
                          <Briefcase className="w-5 h-5 text-[#7b57fc]/50" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {request.linkedService.title}
                        </p>
                        {request.linkedService.shortDesc && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {request.linkedService.shortDesc}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {t.createdAt}:{" "}
                      {format(new Date(request.createdAt), "MMM d, yyyy", {
                        locale: isAr ? arSA : enUS,
                      })}
                    </span>
                    {request.updatedAt !== request.createdAt && (
                      <span className="flex items-center gap-1">
                        {t.updatedAt}:{" "}
                        {format(new Date(request.updatedAt), "MMM d, yyyy", {
                          locale: isAr ? arSA : enUS,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card footer */}
        {(canEdit || canCancel) && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border/30 bg-muted/5">
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-[#7b57fc] hover:text-[#6a48eb] hover:bg-[#7b57fc]/8"
                  onClick={() => setEditOpen(true)}
                >
                  <Edit3 className="w-3.5 h-3.5" /> {t.edit}
                </Button>
              )}
            </div>
            <div>
              {!showCancel ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/8 gap-1.5"
                  onClick={() => setShowCancel(true)}
                >
                  <XCircle className="w-3.5 h-3.5" /> {t.cancelRequest}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {t.confirmCancel}
                  </p>
                  <Button
                    size="sm"
                    className="h-7 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white border-0 text-xs"
                    disabled={isPending}
                    onClick={handleCancel}
                  >
                    {isPending ? (
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
          </div>
        )}
      </motion.div>

      {canEdit && (
        <EditDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onDone={onDone}
          request={request}
          t={t}
          isAr={isAr}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  isAr: boolean;
  initialData: ConsultingDashboardSummary | null;
  page: number;
  filterStatus: ConsultingStatus | undefined;
  initialTab: "freeform" | "services";
}

export function ConsultingPageClient({
  isAr,
  initialData,
  page,
  filterStatus,
  initialTab,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, start] = useTransition();
  const [activeTab, setActiveTab] = useState<"freeform" | "services">(
    initialTab,
  );
  const [formOpen, setFormOpen] = useState(false);
  const t = (isAr ? T.ar : T.en) as typeof T.en;

  const applyFilter = useCallback(
    (patch: Record<string, string | undefined>) => {
      start(() => {
        const base = new URLSearchParams();
        const merged: Record<string, string | undefined> = {
          page: String(page),
          status: filterStatus,
          tab: activeTab,
          ...patch,
        };
        Object.entries(merged).forEach(([k, v]) => {
          if (
            v !== undefined &&
            !(k === "page" && v === "1") &&
            !(k === "tab" && v === "freeform")
          )
            base.set(k, v);
        });
        router.push(`${pathname}?${base.toString()}`);
      });
    },
    [page, filterStatus, activeTab, router, pathname],
  );

  const switchTab = (tab: "freeform" | "services") => {
    setActiveTab(tab);
    start(() => {
      const base = new URLSearchParams();
      if (tab !== "freeform") base.set("tab", tab);
      router.push(`${pathname}?${base.toString()}`);
    });
  };

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

  const { freeForm, serviceRequests, totalOpen, canSubmitMore, user } =
    initialData;

  // Status filter pills
  const statusPills: { status: ConsultingStatus | undefined; label: string }[] =
    [
      { status: undefined, label: t.all },
      { status: "NEW", label: t.new },
      { status: "IN_REVIEW", label: t.inReview },
      { status: "SCHEDULED", label: t.scheduled },
      { status: "CLOSED", label: t.closed },
    ];

  const activeItems =
    activeTab === "freeform" ? freeForm.items : serviceRequests.items;

  return (
    <div className="flex flex-col gap-5" dir={isAr ? "rtl" : "ltr"}>
      {/* Open requests bar */}
      <OpenBar
        totalOpen={totalOpen}
        canSubmitMore={canSubmitMore}
        t={t}
        isAr={isAr}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/30 border border-border/50 w-fit">
        {(
          [
            {
              id: "freeform" as const,
              label: t.myRequests,
              count: freeForm.total,
            },
            {
              id: "services" as const,
              label: t.serviceRequests,
              count: serviceRequests.total,
            },
          ] as const
        ).map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              activeTab === id
                ? "bg-card text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            <span
              className={cn(
                "text-[11px] px-1.5 py-0.5 rounded-full font-bold",
                activeTab === id
                  ? "bg-[#7b57fc]/10 text-[#7b57fc]"
                  : "bg-muted/60 text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Status filter + New request */}
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
                  "flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-all",
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
          {activeTab === "freeform" && (
            <Button
              size="sm"
              disabled={!canSubmitMore}
              className="h-8 px-4 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" /> {t.newRequest}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeItems.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-5 py-24 rounded-2xl border border-dashed border-border/60 bg-card/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#7b57fc]/8 border border-[#7b57fc]/15 flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-[#7b57fc]/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground/70">
                {activeTab === "freeform" ? t.noRequests : t.noServiceReqs}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === "freeform"
                  ? t.noRequestsSub
                  : t.noServiceReqsSub}
              </p>
            </div>
            {activeTab === "freeform" && (
              <Button
                size="sm"
                disabled={!canSubmitMore}
                className="h-9 px-5 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" /> {t.newRequest}
              </Button>
            )}
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
              {activeItems.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  t={t}
                  isAr={isAr}
                  onDone={refresh}
                  isServiceType={activeTab === "services"}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination — free-form only */}
      {activeTab === "freeform" && (
        <Pagination
          pagination={freeForm.pagination}
          onPage={(p) => applyFilter({ page: String(p) })}
          isAr={isAr}
        />
      )}

      {/* New request dialog */}
      <NewRequestDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={refresh}
        t={t}
        isAr={isAr}
        userEmail={user.email}
        userName={user.fullName}
      />
    </div>
  );
}
