"use client";

// app/[locale]/dashboard/(routes)/requests/_components/RequestsPageClient.tsx

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
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
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Loader2,
  Upload,
  Download,
  Trash2,
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Link2,
  Hash,
  Globe,
  AlertCircle,
  Sparkles,
  History,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  TrendingUp,
  ShoppingCart,
  Truck,
  Star,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RequestStatus, QuoteStatus } from "@prisma/client";
import type {
  SerializedRequest,
  SerializedQuote,
  SerializedFile,
  UserPlanInfo,
  DashboardSummary,
} from "../actions";
import {
  createProductRequest,
  acceptQuote,
  rejectQuote,
  deleteMyRequest,
  uploadClientFile,
  deleteClientFile,
  getDashboardSummary,
} from "../actions";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Bilingual config
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  en: {
    newRequest: "New Request",
    myRequests: "My Requests",
    noRequests: "No requests yet",
    noRequestsSub: "Submit your first product sourcing request",
    submitted: "Submitted",
    inReview: "In Review",
    quoted: "Quoted",
    approved: "Approved",
    rejected: "Rejected",
    inProduction: "In Production",
    shipped: "Shipped",
    completed: "Completed",
    all: "All",
    quotesReceived: "Quote Received",
    acceptQuote: "Accept",
    rejectQuote: "Decline",
    accepting: "Accepting…",
    rejecting: "Declining…",
    files: "Files",
    history: "History",
    showHistory: "Show history",
    hideHistory: "Hide history",
    withdraw: "Withdraw",
    withdrawConfirm: "Confirm withdrawal?",
    cancel: "Cancel",
    delete: "Delete",
    planUsage: "Plan usage",
    requestsUsed: "requests used",
    unlimited: "Unlimited",
    upgrade: "Upgrade Plan",
    upgradeNeeded: "Upgrade required to submit more requests",
    description: "Description",
    descPlaceholder: "Describe the product you want to source…",
    productLink: "Product link (optional)",
    linkPlaceholder: "https://alibaba.com/product/…",
    quantity: "Quantity",
    country: "Shipping country",
    countryPh: "e.g. SA, AE, US",
    notes: "Additional notes (optional)",
    notesPlaceholder: "Specifications, colour, size…",
    attachFiles: "Attach files (optional)",
    dropHere: "Drop files here or",
    browse: "browse",
    maxSize: "Max 20 MB · PDF, images, Office, ZIP",
    submit: "Submit Request",
    submitting: "Submitting…",
    next: "Next",
    back: "Back",
    step1: "Product details",
    step2: "Files & notes",
    quoteFrom: "Quote from",
    validUntil: "Valid until",
    revision: "Rev.",
    quoteNotes: "Notes from our team",
    accepted: "Accepted",
    priceEst: "AI estimate",
    removeFile: "Remove",
    uploadFile: "Upload file",
    uploading: "Uploading…",
    quantity2: "qty",
    noQuotes: "No quotes yet",
    noQuotesSub: "Our team will send you a quote soon",
    refresh: "Refresh",
  },
  ar: {
    newRequest: "طلب جديد",
    myRequests: "طلباتي",
    noRequests: "لا توجد طلبات بعد",
    noRequestsSub: "قدّم طلب مصادر المنتجات الأول",
    submitted: "مُرسَل",
    inReview: "قيد المراجعة",
    quoted: "تم تسعيره",
    approved: "مقبول",
    rejected: "مرفوض",
    inProduction: "قيد الإنتاج",
    shipped: "تم الشحن",
    completed: "مكتمل",
    all: "الكل",
    quotesReceived: "عرض سعر وصل",
    acceptQuote: "قبول",
    rejectQuote: "رفض",
    accepting: "جارٍ القبول…",
    rejecting: "جارٍ الرفض…",
    files: "الملفات",
    history: "السجل",
    showHistory: "عرض السجل",
    hideHistory: "إخفاء السجل",
    withdraw: "سحب الطلب",
    withdrawConfirm: "تأكيد السحب؟",
    cancel: "إلغاء",
    delete: "حذف",
    planUsage: "استخدام الخطة",
    requestsUsed: "طلب مستخدم",
    unlimited: "غير محدود",
    upgrade: "ترقية الخطة",
    upgradeNeeded: "يلزم الترقية لإرسال المزيد من الطلبات",
    description: "الوصف",
    descPlaceholder: "صف المنتج الذي تريد الحصول عليه…",
    productLink: "رابط المنتج (اختياري)",
    linkPlaceholder: "https://alibaba.com/product/…",
    quantity: "الكمية",
    country: "دولة الشحن",
    countryPh: "مثال: SA, AE, US",
    notes: "ملاحظات إضافية (اختياري)",
    notesPlaceholder: "المواصفات، اللون، الحجم…",
    attachFiles: "إرفاق ملفات (اختياري)",
    dropHere: "أسقط الملفات هنا أو",
    browse: "تصفح",
    maxSize: "20 ميجابايت كحد أقصى · PDF وصور وOffice وZIP",
    submit: "إرسال الطلب",
    submitting: "جارٍ الإرسال…",
    next: "التالي",
    back: "رجوع",
    step1: "تفاصيل المنتج",
    step2: "الملفات والملاحظات",
    quoteFrom: "عرض سعر من",
    validUntil: "صالح حتى",
    revision: "مراجعة",
    quoteNotes: "ملاحظات من فريقنا",
    accepted: "مقبول",
    priceEst: "تقدير الذكاء الاصطناعي",
    removeFile: "إزالة",
    uploadFile: "رفع ملف",
    uploading: "جارٍ الرفع…",
    quantity2: "قطعة",
    noQuotes: "لا توجد عروض أسعار بعد",
    noQuotesSub: "سيرسل فريقنا عرض سعر قريبًا",
    refresh: "تحديث",
  },
} as const;

type TKey = keyof typeof T.en;

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  RequestStatus,
  {
    dot: string;
    ring: string;
    icon: React.ElementType;
  }
> = {
  SUBMITTED: {
    dot: "bg-blue-500",
    ring: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
    icon: Package,
  },
  IN_REVIEW: {
    dot: "bg-amber-500",
    ring: "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400",
    icon: Eye,
  },
  QUOTED: {
    dot: "bg-violet-500",
    ring: "bg-violet-500/10 border-violet-500/25 text-violet-600 dark:text-violet-400",
    icon: DollarSign,
  },
  APPROVED: {
    dot: "bg-emerald-500",
    ring: "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle,
  },
  REJECTED: {
    dot: "bg-red-500",
    ring: "bg-red-500/10 border-red-500/25 text-red-500",
    icon: XCircle,
  },
  IN_PRODUCTION: {
    dot: "bg-orange-500",
    ring: "bg-orange-500/10 border-orange-500/25 text-orange-600 dark:text-orange-400",
    icon: Truck,
  },
  SHIPPED: {
    dot: "bg-sky-500",
    ring: "bg-sky-500/10 border-sky-500/25 text-sky-600 dark:text-sky-400",
    icon: Truck,
  },
  COMPLETED: {
    dot: "bg-green-500",
    ring: "bg-green-500/10 border-green-500/25 text-green-600 dark:text-green-400",
    icon: CheckCircle,
  },
};

const QUOTE_STATUS_CFG: Record<QuoteStatus, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-muted/50 text-muted-foreground" },
  SENT: {
    label: "Sent",
    cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  ACCEPTED: {
    label: "Accepted",
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  REJECTED: { label: "Rejected", cls: "bg-red-500/10 text-red-500" },
};

const ALL_STATUSES: RequestStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
  "QUOTED",
  "APPROVED",
  "REJECTED",
  "IN_PRODUCTION",
  "SHIPPED",
  "COMPLETED",
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
      const { formatDistanceToNow } =
        require("date-fns") as typeof import("date-fns");
      setText(
        formatDistanceToNow(new Date(date), {
          addSuffix: true,
          locale: isAr ? arSA : enUS,
        }),
      );
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [date, isAr]);
  if (!text) return <span className={className} suppressHydrationWarning />;
  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}

function StatusBadge({ status, t }: { status: RequestStatus; t: typeof T.en }) {
  const cfg = STATUS_CFG[status];
  const StatusIcon = cfg.icon;
  const labelKey = status.toLowerCase().replace("_", "") as any;
  const labelMap: Record<RequestStatus, string> = {
    SUBMITTED: t.submitted,
    IN_REVIEW: t.inReview,
    QUOTED: t.quoted,
    APPROVED: t.approved,
    REJECTED: t.rejected,
    IN_PRODUCTION: t.inProduction,
    SHIPPED: t.shipped,
    COMPLETED: t.completed,
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
        cfg.ring,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {labelMap[status]}
    </span>
  );
}

function QuoteBadge({ status }: { status: QuoteStatus }) {
  const c = QUOTE_STATUS_CFG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
        c.cls,
      )}
    >
      {c.label}
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40">
      <p className="text-xs text-muted-foreground order-2 sm:order-1">
        {isAr
          ? `عرض ${from}–${to} من ${totalCount.toLocaleString("ar")}`
          : `Showing ${from}–${to} of ${totalCount.toLocaleString()}`}
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
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="text-xs text-muted-foreground px-1">
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
  const isCritical = !isUnlimited && pct >= 90;
  const isFull = !isUnlimited && !plan.hasAccess;

  if (isFull)
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
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
              {isAr
                ? `${plan.planName} · ${plan.usedCount} ${t.requestsUsed}`
                : `${plan.planName} · ${plan.usedCount} of ${plan.limit} ${t.requestsUsed}`}
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
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card"
    >
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-foreground">
            {t.planUsage} ·{" "}
            <span className="text-muted-foreground font-normal">
              {plan.planName}
            </span>
          </p>
          <p className="text-xs text-muted-foreground shrink-0">
            {isUnlimited
              ? t.unlimited
              : isAr
                ? `${plan.usedCount} / ${plan.limit} ${t.requestsUsed}`
                : `${plan.usedCount} / ${plan.limit} ${t.requestsUsed}`}
          </p>
        </div>
        {!isUnlimited && (
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                isCritical ? "bg-amber-500" : "bg-[#7b57fc]",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        )}
        {isUnlimited && (
          <div className="h-1.5 bg-[#7b57fc]/20 rounded-full overflow-hidden">
            <div className="h-full w-full bg-linear-to-r from-[#7b57fc]/40 to-[#7b57fc] rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Request Dialog
// ─────────────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  "SA",
  "AE",
  "US",
  "GB",
  "DE",
  "FR",
  "CN",
  "JP",
  "KR",
  "IN",
  "EG",
  "JO",
  "KW",
  "QA",
  "BH",
  "OM",
  "IQ",
  "SY",
  "LB",
  "TR",
];
const flagIconMap: Record<string, string> = {
  SA: "sa",
  AE: "ae",
  US: "us",
  GB: "gb",
  DE: "de",
  FR: "fr",
  CN: "cn",
  JP: "jp",
  KR: "kr",
  IN: "in",
  EG: "eg",
  JO: "jo",
  KW: "kw",
  QA: "qa",
  BH: "bh",
  OM: "om",
  IQ: "iq",
  SY: "sy",
  LB: "lb",
  TR: "tr",
};

function NewRequestDialog({
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
  const [form, setForm] = useState({
    description: "",
    productLink: "",
    quantity: "",
    shippingCountry: "",
    customNotes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep(1);
    setForm({
      description: "",
      productLink: "",
      quantity: "",
      shippingCountry: "",
      customNotes: "",
    });
    setErrors({});
    setPendingFiles([]);
    setCreatedId(null);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.description.trim())
      e.description = isAr ? "الوصف مطلوب" : "Description is required";
    const qty = Number(form.quantity);
    if (!form.quantity || isNaN(qty) || qty < 1 || !Number.isInteger(qty))
      e.quantity = isAr ? "كمية صحيحة مطلوبة" : "Valid whole number required";
    if (!form.shippingCountry.trim())
      e.shippingCountry = isAr ? "الدولة مطلوبة" : "Country required";
    if (form.productLink && !form.productLink.startsWith("http"))
      e.productLink = isAr ? "رابط غير صالح" : "Must be a valid URL";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleSubmit = () => {
    start(async () => {
      const r = await createProductRequest({
        description: form.description.trim(),
        productLink: form.productLink.trim() || undefined,
        quantity: Number(form.quantity),
        shippingCountry: form.shippingCountry.trim().toUpperCase(),
        customNotes: form.customNotes.trim() || undefined,
      });

      if (!r.success) {
        if (r.error === "UPGRADE_REQUIRED") {
          toast.error(isAr ? "يلزم ترقية الخطة" : "Upgrade required");
        } else {
          toast.error(r.error);
        }
        return;
      }

      const id = r.data.id;
      setCreatedId(id);

      // Upload any pending files
      if (pendingFiles.length > 0) {
        setUploadingFile(true);
        for (const file of pendingFiles) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("requestId", id);
          await uploadClientFile(fd);
        }
        setUploadingFile(false);
      }

      toast.success(
        isAr ? "تم إرسال الطلب بنجاح" : "Request submitted successfully",
      );
      onClose();
      onSuccess();
    });
  };

  const addFile = (f: File) => {
    if (f.size > 20 * 1024 * 1024) {
      toast.error(isAr ? "الملف أكبر من 20 ميجابايت" : "File exceeds 20 MB");
      return;
    }
    setPendingFiles((p) => [...p, f]);
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
              <ShoppingCart className="w-4 h-4 text-[#7b57fc]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {t.newRequest}
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

        {/* Step indicator */}
        <div className="shrink-0 flex items-center gap-2 px-6 pt-4 pb-0">
          {([1, 2] as const).map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                s <= step ? "bg-[#7b57fc]" : "bg-muted/50",
              )}
            />
          ))}
        </div>

        {/* Body */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4",
            "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60",
          )}
        >
          <AnimatePresence mode="wait">
            {/* Step 1 */}
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: isAr ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label className={labelCls}>
                    {t.description} <span className="text-[#7b57fc]">*</span>
                  </Label>
                  <Textarea
                    value={form.description}
                    onChange={set("description")}
                    rows={4}
                    placeholder={t.descPlaceholder}
                    className={cn(
                      "rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50",
                      errors.description && "border-red-400",
                    )}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>{t.productLink}</Label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={form.productLink}
                      onChange={set("productLink")}
                      dir="ltr"
                      placeholder={t.linkPlaceholder}
                      className={cn(
                        inputCls,
                        "pl-9",
                        errors.productLink && "border-red-400",
                      )}
                    />
                  </div>
                  {errors.productLink && (
                    <p className="text-xs text-red-500">{errors.productLink}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>
                      {t.quantity} <span className="text-[#7b57fc]">*</span>
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={form.quantity}
                        onChange={set("quantity")}
                        dir="ltr"
                        placeholder="100"
                        className={cn(
                          inputCls,
                          "pl-9",
                          errors.quantity && "border-red-400",
                        )}
                      />
                    </div>
                    {errors.quantity && (
                      <p className="text-xs text-red-500">{errors.quantity}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>
                      {t.country} <span className="text-[#7b57fc]">*</span>
                    </Label>
                    <Select
                      value={form.shippingCountry}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, shippingCountry: v }))
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          inputCls,
                          "w-full",
                          errors.shippingCountry && "border-red-400",
                        )}
                      >
                        <SelectValue placeholder={t.countryPh} />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem
                            key={c}
                            value={c}
                            className="text-xs font-mono"
                          >
                            <span className="inline-flex items-center gap-2">
                              <span
                                className={`fi fi-${flagIconMap[c]}`}
                              ></span>
                              <span>{c}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.shippingCountry && (
                      <p className="text-xs text-red-500">
                        {errors.shippingCountry}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: isAr ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label className={labelCls}>{t.notes}</Label>
                  <Textarea
                    value={form.customNotes}
                    onChange={set("customNotes")}
                    rows={4}
                    placeholder={t.notesPlaceholder}
                    className="rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className={labelCls}>{t.attachFiles}</Label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) addFile(f);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-border/40 rounded-xl p-5 text-center cursor-pointer hover:border-[#7b57fc]/40 hover:bg-muted/10 transition-all"
                  >
                    <Input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) addFile(f);
                        e.target.value = "";
                      }}
                    />
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t.dropHere}{" "}
                      <span className="text-[#7b57fc] underline underline-offset-2">
                        {t.browse}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      {t.maxSize}
                    </p>
                  </div>

                  {pendingFiles.length > 0 && (
                    <div className="space-y-1.5">
                      {pendingFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/20 border border-border/40"
                        >
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-xs text-foreground flex-1 truncate">
                            {f.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {(f.size / 1024).toFixed(0)} KB
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-lg shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingFiles((p) =>
                                p.filter((_, j) => j !== i),
                              );
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Summary
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">
                        {t.quantity}:
                      </span>{" "}
                      <span className="font-semibold">{form.quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {t.country}:
                      </span>{" "}
                      <span className="font-semibold font-mono">
                        {form.shippingCountry}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">
                    {form.description}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-t border-border/50 bg-background">
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
              onClick={handleNext}
            >
              {t.next} <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              className="h-10 px-5 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-sm gap-2"
              disabled={isPending || uploadingFile}
              onClick={handleSubmit}
            >
              {isPending || uploadingFile ? (
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
// Quote Card
// ─────────────────────────────────────────────────────────────────────────────

function QuoteCard({
  quote,
  isAccepted,
  requestId,
  t,
  isAr,
  onDone,
}: {
  quote: SerializedQuote;
  isAccepted: boolean;
  requestId: string;
  t: typeof T.en;
  isAr: boolean;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  const [action, setAction] = useState<"accept" | "reject" | null>(null);

  const isSent = quote.status === "SENT";
  const priceNum = Number(quote.price);

  const handleAccept = () => {
    setAction("accept");
    start(async () => {
      const r = await acceptQuote(quote.id);
      if (r.success) {
        toast.success(isAr ? "تم قبول عرض السعر" : "Quote accepted");
        onDone();
      } else toast.error(r.error);
      setAction(null);
    });
  };

  const handleReject = () => {
    setAction("reject");
    start(async () => {
      const r = await rejectQuote(quote.id);
      if (r.success) {
        toast.success(isAr ? "تم رفض عرض السعر" : "Quote declined");
        onDone();
      } else toast.error(r.error);
      setAction(null);
    });
  };

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border p-4 space-y-3 transition-colors",
        isAccepted || quote.status === "ACCEPTED"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : quote.status === "REJECTED"
            ? "border-border/30 bg-muted/10 opacity-60"
            : "border-border/50 bg-card",
      )}
    >
      {/* Quote header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-foreground">
              ${priceNum.toLocaleString()}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {quote.currency}
              </span>
            </span>
            <QuoteBadge status={quote.status} />
            <span className="text-[10px] text-muted-foreground">
              {t.revision} {quote.revision}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t.quoteFrom} {quote.createdBy.fullName ?? quote.createdBy.email}
            {quote.validUntil && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                · {t.validUntil}{" "}
                {format(new Date(quote.validUntil), "MMM d, yyyy", {
                  locale: isAr ? arSA : enUS,
                })}
              </span>
            )}
          </p>
        </div>
        {(isAccepted || quote.status === "ACCEPTED") && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shrink-0">
            <CheckCircle className="w-2.5 h-2.5" /> {t.accepted}
          </span>
        )}
      </div>

      {/* Admin notes */}
      {quote.adminNotes && (
        <div className="bg-muted/20 rounded-lg border border-border/40 p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
            {t.quoteNotes}
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {quote.adminNotes}
          </p>
        </div>
      )}

      {/* Quote files */}
      {quote.files.length > 0 && (
        <div className="space-y-1.5">
          {quote.files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7b57fc] hover:underline underline-offset-2 truncate flex-1"
              >
                {f.fileName ?? "file"}
              </a>
              <Download className="w-3.5 h-3.5 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Accept / Reject */}
      {isSent && !isAccepted && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isPending}
            className="h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-0 gap-1.5 text-xs"
          >
            {action === "accept" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t.accepting}
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" /> {t.acceptQuote}
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={isPending}
            className="h-8 rounded-xl border-red-300 text-red-500 hover:bg-red-500/8 hover:text-red-600 gap-1.5 text-xs"
          >
            {action === "reject" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t.rejecting}
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" /> {t.rejectQuote}
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File Row
// ─────────────────────────────────────────────────────────────────────────────

function FileRow({
  file,
  canDelete,
  t,
  onDeleted,
}: {
  file: SerializedFile;
  canDelete: boolean;
  t: typeof T.en;
  onDeleted: () => void;
}) {
  const [isPending, start] = useTransition();
  const handleDelete = () => {
    start(async () => {
      const r = await deleteClientFile(file.id);
      if (r.success) onDeleted();
      else toast.error(r.error);
    });
  };
  return (
    <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-muted/20 border border-border/40">
      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#7b57fc] hover:underline underline-offset-2 truncate block"
        >
          {file.fileName ?? "file"}
        </a>
        {file.fileSize && (
          <p className="text-[10px] text-muted-foreground">
            {(file.fileSize / 1024).toFixed(0)} KB · {file.fileType}
          </p>
        )}
      </div>
      <Link href={file.url} target="_blank" rel="noopener noreferrer">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-lg shrink-0"
        >
          <Download className="w-3 h-3" />
        </Button>
      </Link>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-lg shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/8"
          disabled={isPending}
          onClick={handleDelete}
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
        </Button>
      )}
    </div>
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
}: {
  request: SerializedRequest;
  t: typeof T.en;
  isAr: boolean;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const statusCfg = STATUS_CFG[request.status];
  const StatusIcon = statusCfg.icon;
  const sentQuotes = request.quotes.filter((q) => q.status === "SENT");
  const hasQuoteAction = sentQuotes.length > 0 && !request.acceptedQuoteId;

  const canDelete = request.status === "SUBMITTED";
  const canUpload = ["SUBMITTED", "IN_REVIEW", "QUOTED"].includes(
    request.status,
  );

  const handleUpload = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Max 20 MB");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("requestId", request.id);
    const r = await uploadClientFile(fd);
    setUploading(false);
    if (r.success) {
      toast.success(isAr ? "تم رفع الملف" : "File uploaded");
      onDone();
    } else toast.error(r.error);
  };

  const handleDelete = () => {
    start(async () => {
      const r = await deleteMyRequest(request.id);
      if (r.success) {
        toast.success(isAr ? "تم سحب الطلب" : "Request withdrawn");
        onDone();
      } else toast.error(r.error);
    });
  };

  const shortId = `#${request.id.slice(-6).toUpperCase()}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200"
    >
      {/* Card header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/40 bg-muted/10">
        <div className="flex items-center gap-3 min-w-0">
          <StatusBadge status={request.status} t={t} />
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            {shortId}
          </span>
          {hasQuoteAction && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500 text-white animate-pulse">
              <DollarSign className="w-2.5 h-2.5" /> {t.quotesReceived}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {request.aiEstimatedPrice && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
              <Zap className="w-3 h-3 text-[#7b57fc]" /> $
              {Number(request.aiEstimatedPrice).toLocaleString()}
            </span>
          )}
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
        {/* Description */}
        <div>
          <p
            className={cn(
              "text-sm text-foreground leading-relaxed",
              !expanded && "line-clamp-2",
            )}
          >
            {request.description ?? (
              <span className="text-muted-foreground/50 italic">—</span>
            )}
          </p>
          {(request.description?.length ?? 0) > 120 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="text-xs text-[#7b57fc] hover:underline underline-offset-2 mt-1"
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full border border-border/40">
            <Hash className="w-3 h-3" /> {request.quantity.toLocaleString()}{" "}
            {t.quantity2}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full border border-border/40">
            <Globe className="w-3 h-3" />
            <span
              className={`fi fi-${flagIconMap[request.shippingCountry] ?? request.shippingCountry.toLowerCase()} text-sm`}
            ></span>
            {request.shippingCountry}
          </span>
          {/* rest of the chips */}
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-1">
                {/* Notes */}
                {request.customNotes && (
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      {t.notes}
                    </p>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {request.customNotes}
                    </p>
                  </div>
                )}

                {/* Quotes section */}
                {request.quotes.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3" />{" "}
                      {isAr ? "عروض الأسعار" : "Quotes"} (
                      {request.quotes.length})
                    </p>
                    {request.quotes.map((quote) => (
                      <QuoteCard
                        key={quote.id}
                        quote={quote}
                        isAccepted={quote.id === request.acceptedQuoteId}
                        requestId={request.id}
                        t={t}
                        isAr={isAr}
                        onDone={onDone}
                      />
                    ))}
                  </div>
                )}

                {/* Empty quotes state */}
                {request.quotes.length === 0 &&
                  ["SUBMITTED", "IN_REVIEW"].includes(request.status) && (
                    <div className="text-center py-4 rounded-xl border border-dashed border-border/40 bg-muted/10">
                      <DollarSign className="w-6 h-6 mx-auto text-muted-foreground/20 mb-1.5" />
                      <p className="text-xs font-medium text-muted-foreground">
                        {t.noQuotes}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                        {t.noQuotesSub}
                      </p>
                    </div>
                  )}

                {/* Files section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> {t.files} (
                      {request.files.length})
                    </p>
                    {canUpload && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs text-[#7b57fc] hover:text-[#6a48eb]"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />{" "}
                              {t.uploading}
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3" /> {t.uploadFile}
                            </>
                          )}
                        </Button>
                        <Input
                          ref={fileRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUpload(f);
                            e.target.value = "";
                          }}
                        />
                      </>
                    )}
                  </div>
                  {request.files.map((f) => (
                    <FileRow
                      key={f.id}
                      file={f}
                      canDelete={canUpload}
                      t={t}
                      onDeleted={onDone}
                    />
                  ))}
                  {request.files.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 italic px-3">
                      {isAr ? "لا توجد ملفات" : "No files attached"}
                    </p>
                  )}
                </div>

                {/* Status history */}
                <div>
                  <button
                    onClick={() => setShowHistory((p) => !p)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                  >
                    <History className="w-3 h-3" />
                    {showHistory ? t.hideHistory : t.showHistory}(
                    {request.statusHistory.length})
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
                        <div className="relative pl-4 space-y-3">
                          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border/50" />
                          {request.statusHistory.map((h) => {
                            const labelMap: Record<RequestStatus, string> = {
                              SUBMITTED: t.submitted,
                              IN_REVIEW: t.inReview,
                              QUOTED: t.quoted,
                              APPROVED: t.approved,
                              REJECTED: t.rejected,
                              IN_PRODUCTION: t.inProduction,
                              SHIPPED: t.shipped,
                              COMPLETED: t.completed,
                            };
                            return (
                              <div key={h.id} className="relative">
                                <div
                                  className={cn(
                                    "absolute -left-2.5 top-1.5 w-2 h-2 rounded-full border-2 border-background",
                                    STATUS_CFG[h.newStatus]?.dot ?? "bg-muted",
                                  )}
                                />
                                <div className="bg-muted/20 rounded-xl border border-border/40 px-3 py-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-foreground">
                                      {labelMap[h.newStatus]}
                                    </span>
                                    <RelativeTime
                                      date={h.changedAt}
                                      className="text-[10px] text-muted-foreground"
                                      isAr={isAr}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
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

        {/* Quoted → accept/reject shortcut (not expanded) */}
        {!expanded && hasQuoteAction && (
          <div className="space-y-2 pt-1">
            {sentQuotes.slice(0, 1).map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                isAccepted={false}
                requestId={request.id}
                t={t}
                isAr={isAr}
                onDone={onDone}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border/30 bg-muted/5">
        <div className="flex items-center gap-2">
          <RelativeTime
            date={request.createdAt}
            className="text-[11px] text-muted-foreground sm:hidden"
            isAr={isAr}
          />
          {!expanded && request.files.length > 0 && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <FileText className="w-3 h-3" /> {request.files.length}
            </span>
          )}
        </div>
        {canDelete && (
          <div>
            {!showDelete ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/8 gap-1.5"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5" /> {t.withdraw}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {t.withdrawConfirm}
                </p>
                <Button
                  size="sm"
                  className="h-7 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white border-0 text-xs"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    t.delete
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowDelete(false)}
                >
                  {t.cancel}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  isAr: boolean;
  initialData: DashboardSummary | null;
  page: number;
  pageSize: number;
  filterStatus: RequestStatus | undefined;
}

export function RequestsPageClient({
  isAr,
  initialData,
  page,
  pageSize,
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
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            {isAr ? "خطأ في التحميل" : "Failed to load"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 gap-1.5 text-xs"
            onClick={refresh}
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t.refresh}
          </Button>
        </div>
      </div>
    );

  const { plan, requests, pagination, counts, user } = initialData;

  const statusTabs: {
    status: RequestStatus | undefined;
    label: string;
    count: number;
  }[] = [
    {
      status: undefined,
      label: t.all,
      count: Object.values(counts).reduce((a, b) => a + b, 0),
    },
    {
      status: RequestStatus.SUBMITTED,
      label: t.submitted,
      count: counts.submitted,
    },
    {
      status: RequestStatus.IN_REVIEW,
      label: t.inReview,
      count: counts.inReview,
    },
    { status: RequestStatus.QUOTED, label: t.quoted, count: counts.quoted },
    {
      status: RequestStatus.APPROVED,
      label: t.approved,
      count: counts.approved,
    },
    {
      status: RequestStatus.IN_PRODUCTION,
      label: t.inProduction,
      count: counts.inProduction,
    },
    { status: RequestStatus.SHIPPED, label: t.shipped, count: counts.shipped },
    {
      status: RequestStatus.COMPLETED,
      label: t.completed,
      count: counts.completed,
    },
  ].filter(
    (tab) =>
      tab.status === undefined || tab.count > 0 || tab.status === filterStatus,
  );

  return (
    <div className="flex flex-col gap-5" dir={isAr ? "rtl" : "ltr"}>
      {/* Plan bar */}
      <PlanBar plan={plan} t={t} isAr={isAr} />

      {/* Status filter + New request button */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {statusTabs.map(({ status, label, count }) => {
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
                    ? "bg-[#7b57fc] text-white border-[#7b57fc] shadow-md shadow-[#7b57fc]/20"
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
                {count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-muted/60 text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Button
          size="sm"
          className="h-8 px-4 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 shrink-0"
          onClick={() => setFormOpen(true)}
          disabled={!plan.hasAccess}
        >
          <Plus className="w-3.5 h-3.5" /> {t.newRequest}
        </Button>
      </div>

      {/* Request list */}
      {requests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-5 py-24 rounded-2xl border border-dashed border-border/60 bg-card/50"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#7b57fc]/8 border border-[#7b57fc]/15 flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-[#7b57fc]/50" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground/70">
              {t.noRequests}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.noRequestsSub}
            </p>
          </div>
          <Button
            size="sm"
            className="h-9 px-5 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20"
            onClick={() => setFormOpen(true)}
            disabled={!plan.hasAccess}
          >
            <Plus className="w-3.5 h-3.5" /> {t.newRequest}
          </Button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence initial={false} mode="popLayout">
            {requests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                t={t}
                isAr={isAr}
                onDone={refresh}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPage={(p) => applyFilter({ page: String(p) })}
        isAr={isAr}
      />

      {/* New request dialog */}
      <NewRequestDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={refresh}
        t={t}
        isAr={isAr}
      />
    </div>
  );
}
