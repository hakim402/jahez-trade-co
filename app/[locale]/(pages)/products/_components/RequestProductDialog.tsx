"use client";

// app/[locale]/(pages)/products/_components/RequestProductDialog.tsx

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Link2,
  Hash,
  Globe,
  FileText,
  Edit3,
  Send,
  ArrowRight,
  CheckCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createProductRequest } from "@/app/[locale]/dashboard/(routes)/requests/actions";
import { linkProductRequest } from "@/app/[locale]/(pages)/products/actions";
import { Button } from "@/components/ui/button";
import SA from "country-flag-icons/react/3x2/SA";
import AE from "country-flag-icons/react/3x2/AE";
import YE from "country-flag-icons/react/3x2/YE";
import US from "country-flag-icons/react/3x2/US";
import CN from "country-flag-icons/react/3x2/CN";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ProductInfo = {
  id: string;
  name: string;
  nameAr?: string | null;
  shortDesc?: string | null;
  shortDescAr?: string | null;
  description?: string | null;
  sourceUrl?: string | null;
  supplier?: string | null;
  estimatedPrice?: number | null;
  currency?: string;
  imageUrl?: string | null;
};

export type Step = "fill" | "review" | "done";

interface FormState {
  description: string;
  productLink: string;
  quantity: number;
  shippingCountry: string;
  customNotes: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static data (now with SVG flag components)
// ─────────────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: "SA", en: "Saudi Arabia", ar: "المملكة", flag: SA },
  { code: "AE", en: "UAE", ar: "الإمارات", flag: AE },
  { code: "YE", en: "Yemen", ar: "اليمن", flag: YE },
  { code: "US", en: "United States", ar: "الولايات المتحدة", flag: US },
  { code: "CN", en: "China", ar: "الصين", flag: CN },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildDescription(product: ProductInfo, isAr: boolean): string {
  return [
    isAr && product.nameAr
      ? `المنتج: ${product.nameAr}`
      : `Product: ${product.name}`,
    isAr && product.shortDescAr
      ? `الوصف: ${product.shortDescAr}`
      : product.shortDesc
        ? `Summary: ${product.shortDesc}`
        : null,
    !isAr && product.description ? `Details: ${product.description}` : null,
    product.supplier
      ? isAr
        ? `المورد: ${product.supplier}`
        : `Supplier: ${product.supplier}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator — receives step as prop
// ─────────────────────────────────────────────────────────────────────────────

function StepBar({ step, isAr }: { step: Step; isAr: boolean }) {
  const STEPS = [
    { key: "fill", en: "Details", ar: "التفاصيل" },
    { key: "review", en: "Review", ar: "المراجعة" },
    { key: "done", en: "Sent", ar: "تم" },
  ];
  const active = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      {STEPS.map(({ key, en, ar }, i) => (
        <div key={key} className="flex items-center gap-1.5">
          {i > 0 && (
            <div
              className={cn(
                "w-5 h-px",
                i <= active ? "bg-[#7b57fc]" : "bg-border/50",
              )}
            />
          )}
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all",
                i < active
                  ? "bg-emerald-500 text-white"
                  : i === active
                    ? "bg-[#7b57fc] text-white"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i < active ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold hidden sm:inline",
                i === active ? "text-[#7b57fc]" : "text-muted-foreground/40",
              )}
            >
              {isAr ? ar : en}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product banner
// ─────────────────────────────────────────────────────────────────────────────

function ProductBanner({
  product,
  isAr,
  locale,
}: {
  product: ProductInfo;
  isAr: boolean;
  locale: string;
}) {
  const name = isAr && product.nameAr ? product.nameAr : product.name;
  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-xl border border-[#7b57fc]/20 bg-[#7b57fc]/5"
      dir={isAr ? "rtl" : "ltr"}
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={name}
          className="w-12 h-12 rounded-xl object-cover border border-border/50 shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-[#7b57fc]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <Sparkles className="w-2.5 h-2.5 text-[#7b57fc]" />
          <span className="text-[9px] font-bold text-[#7b57fc] uppercase tracking-wider">
            {isAr ? "مملوء مسبقاً" : "Pre-filled"}
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        {product.estimatedPrice != null && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isAr ? "السعر التقديري: " : "Est. price: "}
            <span className="font-bold text-[#7b57fc]">
              {product.estimatedPrice.toLocaleString()}{" "}
              {product.currency ?? "USD"}
            </span>
          </p>
        )}
      </div>
      <a
        href={`/${locale}/products/${product.id}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-[10px] text-[#7b57fc] hover:underline underline-offset-2 whitespace-nowrap shrink-0"
      >
        {isAr ? "عرض" : "View"} ↗
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Country picker (SVG flags)
// ─────────────────────────────────────────────────────────────────────────────

function CountryPicker({
  value,
  onChange,
  isAr,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  isAr: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
        {COUNTRIES.map(({ code, en, ar, flag: FlagComponent }) => (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-2.5 rounded-xl border text-left transition-all",
              value === code
                ? "border-[#7b57fc] bg-[#7b57fc]/8 text-[#7b57fc] ring-1 ring-[#7b57fc]/20"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:border-[#7b57fc]/40 hover:text-foreground",
            )}
          >
            <FlagComponent className="w-5 h-5 shrink-0 rounded-full shadow-sm" />
            <span className="text-[10px] font-medium truncate">
              {isAr ? ar : en}
            </span>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Field wrapper
// ─────────────────────────────────────────────────────────────────────────────

function Field({
  icon: Icon,
  label,
  required,
  hint,
  error,
  children,
}: {
  icon: React.ElementType;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-[#7b57fc] shrink-0" />
        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
          {label}
          {required && <span className="text-[#7b57fc] ml-0.5">*</span>}
        </Label>
      </div>
      {children}
      {hint && !error && (
        <p className="text-[10px] text-muted-foreground/50 ml-5">{hint}</p>
      )}
      {error && <p className="text-xs text-red-500 ml-5">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Review summary
// ─────────────────────────────────────────────────────────────────────────────

function ReviewSummary({
  form,
  isAr,
  onEdit,
}: {
  form: FormState;
  isAr: boolean;
  onEdit: () => void;
}) {
  const country = COUNTRIES.find((c) => c.code === form.shippingCountry);
  return (
    <div className="space-y-3" dir={isAr ? "rtl" : "ltr"}>
      <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden divide-y divide-border/40">
        {[
          {
            icon: FileText,
            label: isAr ? "الوصف" : "Description",
            value: form.description,
            multi: true,
          },
          {
            icon: Link2,
            label: isAr ? "الرابط" : "Product link",
            value: form.productLink || "—",
          },
          {
            icon: Hash,
            label: isAr ? "الكمية" : "Quantity",
            value: `${form.quantity.toLocaleString()} ${isAr ? "قطعة" : "pcs"}`,
          },
          {
            icon: Globe,
            label: isAr ? "دولة الشحن" : "Ships to",
            value: country ? (
              <span className="flex items-center gap-1">
                <country.flag className="w-4 h-4 rounded-full" />
                {isAr ? country.ar : country.en}
              </span>
            ) : (
              form.shippingCountry
            ),
          },
          ...(form.customNotes
            ? [
                {
                  icon: Edit3,
                  label: isAr ? "ملاحظات" : "Notes",
                  value: form.customNotes,
                  multi: true,
                },
              ]
            : []),
        ].map(({ icon: Icon, label, value, multi }) => (
          <div key={label} className="flex items-start gap-3 px-4 py-3">
            <Icon className="w-3.5 h-3.5 text-[#7b57fc] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide mb-0.5">
                {label}
              </p>
              <div
                className={cn(
                  "text-sm text-foreground leading-relaxed",
                  !multi && "truncate",
                  multi && "whitespace-pre-wrap",
                )}
              >
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onEdit}
        className="flex items-center gap-1.5 text-xs text-[#7b57fc] hover:underline underline-offset-2"
      >
        <Edit3 className="w-3 h-3" />
        {isAr ? "تعديل التفاصيل" : "Edit details"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RequestForm — the actual multi-step form body
// ─────────────────────────────────────────────────────────────────────────────

interface RequestFormProps {
  product: ProductInfo | null;
  isAr: boolean;
  locale: string;
  step: Step;
  setStep: (s: Step) => void;
  onClose: () => void;
}

function RequestForm({
  product,
  isAr,
  locale,
  step,
  setStep,
  onClose,
}: RequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const [form, setForm] = useState<FormState>(() => ({
    description: product ? buildDescription(product, isAr) : "",
    productLink: product?.sourceUrl ?? "",
    quantity: 1,
    shippingCountry: "",
    customNotes: "",
  }));

  const patch =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
      setErrors((p) => ({ ...p, [k]: undefined }));
    };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.description.trim())
      e.description = isAr ? "الوصف مطلوب" : "Description is required";
    if (form.quantity < 1)
      e.quantity = isAr ? "الكمية مطلوبة" : "Quantity must be at least 1";
    if (!form.shippingCountry)
      e.shippingCountry = isAr
        ? "اختر دولة الشحن"
        : "Select a shipping destination";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createProductRequest({
        description: form.description.trim(),
        productLink: form.productLink.trim() || undefined,
        quantity: form.quantity,
        shippingCountry: form.shippingCountry,
        customNotes: form.customNotes.trim() || undefined,
      });
      if (!result.success) {
        if (result.error === "UPGRADE_REQUIRED") {
          toast.error(
            isAr
              ? "تحتاج خطة نشطة لإرسال الطلبات"
              : "You need an active plan to submit requests.",
            {
              action: {
                label: isAr ? "ترقية الخطة" : "Upgrade",
                onClick: () => router.push(`/${locale}/pricing`),
              },
              duration: 7000,
            },
          );
          return;
        }
        toast.error(result.error);
        return;
      }
      if (product?.id) {
        await linkProductRequest(product.id, result.data.id).catch((err) =>
          console.error("[linkProductRequest]", err),
        );
      }
      setStep("done");
    });
  };

  const inputCls =
    "h-10 rounded-xl border-border/60 focus-visible:ring-[#7b57fc]/25 focus-visible:border-[#7b57fc]/60 text-sm bg-muted/30";

  // ── STEP 1: Fill ────────────────────────────────────────────────────────────
  if (step === "fill")
    return (
      <>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {product && (
            <ProductBanner product={product} isAr={isAr} locale={locale} />
          )}

          <Field
            icon={FileText}
            label={isAr ? "وصف المنتج" : "Product description"}
            required
            hint={
              isAr
                ? "كُن دقيقاً — يساعدنا في الحصول على أفضل سعر"
                : "Be specific — helps us get you the best price"
            }
            error={errors.description}
          >
            <Textarea
              value={form.description}
              onChange={patch("description")}
              rows={4}
              placeholder={
                isAr
                  ? "المواصفات، المادة، اللون، الجودة…"
                  : "Specs, material, color, quality level…"
              }
              className={cn(
                "rounded-xl border-border/60 focus-visible:ring-[#7b57fc]/25 text-sm resize-none bg-muted/30",
                errors.description && "border-red-400",
              )}
            />
          </Field>

          <Field
            icon={Link2}
            label={isAr ? "رابط المنتج" : "Product link"}
            hint={
              isAr
                ? "1688 أو Alibaba أو Amazon (اختياري)"
                : "1688, Alibaba, Amazon… (optional)"
            }
          >
            <Input
              type="url"
              value={form.productLink}
              onChange={patch("productLink")}
              placeholder="https://1688.com/offer/…"
              className={inputCls}
              dir="ltr"
            />
          </Field>

          <Field
            icon={Hash}
            label={isAr ? "الكمية" : "Quantity"}
            required
            error={errors.quantity}
          >
            <div className="flex items-center gap-2" dir="ltr">
              <Button
                variant={"ghost"}
                type="button"
                onClick={() => {
                  setForm((p) => ({
                    ...p,
                    quantity: Math.max(1, p.quantity - 1),
                  }));
                  setErrors((p) => ({ ...p, quantity: undefined }));
                }}
                disabled={form.quantity <= 1}
                className="w-10 h-10 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[#7b57fc]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setForm((p) => ({
                    ...p,
                    quantity: isNaN(v) ? 1 : Math.max(1, v),
                  }));
                  setErrors((p) => ({ ...p, quantity: undefined }));
                }}
                className={cn(
                  "w-24 text-center h-10 rounded-xl border-border/60 text-sm font-bold bg-muted/30",
                  errors.quantity && "border-red-400",
                )}
              />
              <Button
                variant={"ghost"}
                type="button"
                onClick={() => {
                  setForm((p) => ({ ...p, quantity: p.quantity + 1 }));
                  setErrors((p) => ({ ...p, quantity: undefined }));
                }}
                className="w-10 h-10 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[#7b57fc]/40 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {isAr ? "قطعة" : "pcs"}
              </span>
            </div>
          </Field>

          <Field
            icon={Globe}
            label={isAr ? "دولة الشحن" : "Shipping destination"}
            required
            error={errors.shippingCountry}
          >
            <CountryPicker
              value={form.shippingCountry}
              onChange={(v) => {
                setForm((p) => ({ ...p, shippingCountry: v }));
                setErrors((p) => ({ ...p, shippingCountry: undefined }));
              }}
              isAr={isAr}
              error={errors.shippingCountry}
            />
          </Field>

          <Field
            icon={Edit3}
            label={isAr ? "ملاحظات إضافية" : "Additional notes"}
          >
            <Textarea
              value={form.customNotes}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  customNotes: e.target.value.slice(0, 500),
                }))
              }
              rows={2}
              placeholder={
                isAr
                  ? "شهادات، تغليف خاص، نماذج، وقت التسليم…"
                  : "Certifications, custom packaging, samples, delivery time…"
              }
              className="rounded-xl border-border/60 focus-visible:ring-[#7b57fc]/25 text-sm resize-none bg-muted/30"
            />
            <p className="text-[10px] text-muted-foreground/40 text-right mt-1">
              {form.customNotes.length}/500
            </p>
          </Field>
        </div>

        <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <button
            onClick={onClose}
            className="h-11 px-5 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-all"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={() => {
              if (validate()) setStep("review");
            }}
            className="flex-1 group h-11 flex items-center justify-center gap-2 rounded-xl bg-[#7b57fc] text-white text-sm font-semibold shadow-md shadow-[#7b57fc]/20 hover:bg-[#6a48eb] transition-all"
          >
            {isAr ? "مراجعة الطلب" : "Review request"}
            <ChevronRight
              className={cn(
                "w-4 h-4 transition-transform group-hover:translate-x-0.5",
                isAr && "rotate-180",
              )}
            />
          </button>
        </div>
      </>
    );

  // ── STEP 2: Review ──────────────────────────────────────────────────────────
  if (step === "review")
    return (
      <>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {product && (
            <ProductBanner product={product} isAr={isAr} locale={locale} />
          )}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-400/20 bg-amber-400/5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              {isAr
                ? "راجع تفاصيل طلبك. بعد الإرسال سيرد فريقنا بعرض سعر خلال ٤٨ ساعة."
                : "Review your request carefully. After submitting, our team will reply with a quote within 48 hours."}
            </p>
          </div>
          <ReviewSummary
            form={form}
            isAr={isAr}
            onEdit={() => setStep("fill")}
          />
        </div>

        <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <button
            onClick={() => setStep("fill")}
            disabled={isPending}
            className="h-11 px-5 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-all disabled:opacity-40"
          >
            {isAr ? "تعديل" : "Edit"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className={cn(
              "flex-1 h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all",
              isPending
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-[#7b57fc] text-white shadow-md shadow-[#7b57fc]/20 hover:bg-[#6a48eb]",
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isAr ? "جاري الإرسال…" : "Submitting…"}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {isAr ? "إرسال الطلب" : "Submit request"}
              </>
            )}
          </button>
        </div>
      </>
    );

  // ── STEP 3: Done ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-10 flex flex-col items-center gap-5 text-center [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.45 }}
        className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/25"
      >
        <CheckCircle className="w-8 h-8 text-white" />
      </motion.div>

      <div className="space-y-2 max-w-xs">
        <h3 className="text-xl font-bold text-foreground">
          {isAr ? "تم إرسال طلبك! 🎉" : "Request submitted! 🎉"}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isAr
            ? "طلبك قيد المراجعة. ستستلم عرض سعر تفصيلياً خلال ٤٨ ساعة."
            : "Your request is under review. You'll receive a detailed quote within 48 hours."}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
          <Hash className="w-3 h-3" />
          {form.quantity.toLocaleString()} {isAr ? "قطعة" : "pcs"}
        </span>
        {(() => {
          const c = COUNTRIES.find((x) => x.code === form.shippingCountry);
          return c ? (
            <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border/50">
              <c.flag className="w-4 h-4 rounded-full" />
              {isAr ? c.ar : c.en}
            </span>
          ) : null;
        })()}
        <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          ⚡ {isAr ? "رد خلال ٤٨ ساعة" : "Reply in 48h"}
        </span>
      </div>

      {product && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap justify-center">
          <TrendingUp className="w-3 h-3 text-[#7b57fc]" />
          {isAr ? "مرتبط بـ " : "Linked from "}
          <span className="font-semibold text-foreground">
            {isAr && product.nameAr ? product.nameAr : product.name}
          </span>
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs pt-2">
        <button
          onClick={() => {
            onClose();
            router.push(`/${locale}/dashboard/requests`);
          }}
          className="group flex-1 flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-[#7b57fc] text-white text-sm font-semibold shadow-md shadow-[#7b57fc]/20 hover:bg-[#6a48eb] transition-all"
        >
          {isAr ? "عرض طلباتي" : "View my requests"}
          <ArrowRight
            className={cn(
              "w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5",
              isAr && "rotate-180",
            )}
          />
        </button>
        <button
          onClick={onClose}
          className="flex-1 flex items-center justify-center h-11 px-4 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-all"
        >
          {isAr ? "متابعة التصفح" : "Keep browsing"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RequestProductButton — exported trigger + shadcn Dialog with modern styling
// ─────────────────────────────────────────────────────────────────────────────

interface RequestProductButtonProps {
  product: ProductInfo;
  variant?: "card" | "detail";
  className?: string;
}

export function RequestProductButton({
  product,
  variant = "card",
  className,
}: RequestProductButtonProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("fill");

  const handleOpen = () => {
    setStep("fill");
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  return (
    <>
      {/* Trigger button */}
      {variant === "card" ? (
        <Button
          variant={"ghost"}
          onClick={handleOpen}
          className={cn(
            "w-full h-9 rounded-xl text-xs font-semibold transition-all duration-200",
            "flex items-center justify-center gap-1.5",
            "bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20",
            "hover:bg-[#7b57fc] hover:text-white hover:border-[#7b57fc]",
            className,
          )}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {isAr ? "اطلب الآن" : "Request Now"}
        </Button>
      ) : (
        <Button
          variant={"ghost"}
          onClick={handleOpen}
          className={cn(
            "flex items-center justify-center gap-2 h-12 px-8 rounded-2xl w-full",
            "bg-[#7b57fc] text-white text-sm font-semibold",
            "shadow-lg shadow-[#7b57fc]/25 hover:bg-[#6a48eb] hover:-translate-y-0.5 transition-all",
            className,
          )}
        >
          <ShoppingCart className="w-5 h-5" />
          {isAr ? "اطلب هذا المنتج" : "Request this product"}
          <TrendingUp className="w-4 h-4 opacity-70" />
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
        }}
      >
        <DialogContent
          className={cn(
            "w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0",
            "[&>button:last-child]:hidden",
          )}
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Custom header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0 bg-muted/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-[#7b57fc]" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-bold text-foreground leading-none">
                  {isAr ? "طلب منتج" : "Request Product"}
                </DialogTitle>
                {step !== "done" && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-50">
                    {isAr && product.nameAr ? product.nameAr : product.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {step !== "done" && <StepBar step={step} isAr={isAr} />}
              <Button
                variant={"ghost"}
                onClick={handleClose}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Body + footer (managed by RequestForm) */}
          <div className="flex flex-col flex-1 min-h-0">
            <RequestForm
              product={product}
              isAr={isAr}
              locale={locale}
              step={step}
              setStep={setStep}
              onClose={handleClose}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
