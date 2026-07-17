// ══════════════════════════════════════════════════════════════════════
// FILE 3: app/[locale]/(pages)/contact/_components/ContactForm.tsx
// ══════════════════════════════════════════════════════════════════════
"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  CheckCircle,
  Package,
  Video,
  MessageSquare,
  Truck,
  HelpCircle,
  PartyPopper,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitContactForm } from "../actions";

const SUBJECTS = [
  {
    value: "sourcing",
    icon: Package,
    labelEn: "Product Sourcing",
    labelAr: "استيراد المنتجات",
    color:
      "border-violet-500/40 bg-violet-500/5 text-violet-600 dark:text-violet-400",
  },
  {
    value: "booking",
    icon: Video,
    labelEn: "Video Booking",
    labelAr: "حجز جلسة فيديو",
    color: "border-blue-500/40 bg-blue-500/5 text-blue-600 dark:text-blue-400",
  },
  {
    value: "consulting",
    icon: MessageSquare,
    labelEn: "Business Consulting",
    labelAr: "استشارة تجارية",
    color:
      "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "shipping",
    icon: Truck,
    labelEn: "Shipping & Logistics",
    labelAr: "الشحن واللوجستيك",
    color:
      "border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  },
  {
    value: "other",
    icon: HelpCircle,
    labelEn: "Other",
    labelAr: "استفسار عام",
    color: "border-rose-500/40 bg-rose-500/5 text-rose-600 dark:text-rose-400",
  },
] as const;

export function ContactForm({
  isAr,
  locale,
}: {
  isAr: boolean;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    message: "",
    subject: "sourcing" as string,
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error(
        isAr
          ? "يرجى ملء الحقول المطلوبة"
          : "Please fill in all required fields",
      );
      return;
    }

    startTransition(async () => {
      const result = await submitContactForm({ ...form, locale });
      if (result.success) {
        setSent(true);
        toast.success(
          isAr ? "تم إرسال رسالتك بنجاح!" : "Message sent successfully!",
        );
      } else {
        toast.error(result.error);
      }
    });
  };

  // ── Success state ──────────────────────────────────────────────────
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-5 py-16 px-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center h-full min-h-100"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground ">
            {isAr ? "تم الإرسال بنجاح!" : "Message sent!"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
            {isAr
              ? "شكراً لتواصلك. سيرد فريقنا على بريدك الإلكتروني خلال ٢٤ ساعة."
              : "Thank you for reaching out. Our team will reply to your email within 24 hours."}
          </p>
        </div>
        <button
          onClick={() => {
            setSent(false);
            setForm({
              fullName: "",
              email: "",
              phone: "",
              company: "",
              message: "",
              subject: "sourcing",
            });
          }}
          className="text-sm text-[#7b57fc] hover:underline underline-offset-2"
        >
          {isAr ? "إرسال رسالة أخرى" : "Send another message"}
        </button>
      </motion.div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────
  const inputCls =
    "h-10 rounded-xl text-sm bg-background border-border focus:ring-[#7b57fc]/20 focus:border-[#7b57fc]/50";

  return (
    <motion.div
      initial={{ opacity: 0, x: isAr ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border/50 bg-card overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Form header */}
      <div className="px-6 py-5 border-b border-border/50 bg-muted/20">
        <h2 className="text-base font-bold text-foreground">
          {isAr ? "أرسل لنا رسالة" : "Send us a message"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isAr
            ? "الحقول المعلّمة بـ * إلزامية"
            : "Fields marked * are required"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Subject selector */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {isAr ? "موضوع الرسالة *" : "Subject *"}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {SUBJECTS.map(({ value, icon: Icon, labelEn, labelAr, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, subject: value }))}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-center transition-all text-xs font-semibold",
                  form.subject === value
                    ? cn(color, "ring-2 ring-[#7b57fc]/30")
                    : "border-border/50 bg-background text-muted-foreground hover:border-border",
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="leading-tight">
                  {isAr ? labelAr : labelEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Name + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {isAr ? "الاسم الكامل *" : "Full name *"}
            </Label>
            <Input
              value={form.fullName}
              onChange={set("fullName")}
              placeholder={isAr ? "اسمك الكامل" : "Your full name"}
              required
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {isAr ? "البريد الإلكتروني *" : "Email *"}
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              required
              className={inputCls}
            />
          </div>
        </div>

        {/* Phone + Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {isAr ? "رقم الهاتف" : "Phone"}
            </Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+966 5xx xxx xxx"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {isAr ? "اسم الشركة" : "Company"}
            </Label>
            <Input
              value={form.company}
              onChange={set("company")}
              placeholder={isAr ? "اختياري" : "Optional"}
              className={inputCls}
            />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            {isAr ? "رسالتك *" : "Message *"}
          </Label>
          <Textarea
            value={form.message}
            onChange={set("message")}
            placeholder={
              isAr
                ? "اشرح ما تحتاجه بتفصيل المنتج، الكمية، الوجهة، أو أي سؤال لديك…"
                : "Describe what you need  product, quantity, destination, or any questions you have…"
            }
            rows={5}
            required
            className="rounded-xl text-sm bg-background border-border focus:ring-[#7b57fc]/20 focus:border-[#7b57fc]/50 resize-none"
          />
          <p className="text-[10px] text-muted-foreground/60 text-right">
            {form.message.length} / 1000
          </p>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 font-semibold shadow-md shadow-[#7b57fc]/20 transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {isAr ? "جاري الإرسال…" : "Sending…"}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {isAr ? "إرسال الرسالة" : "Send message"}
            </>
          )}
        </Button>

        {/* Privacy note */}
        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
          {isAr
            ? "بإرسال هذه الرسالة، توافق على تلقي رد على بريدك الإلكتروني. لن نشارك معلوماتك مع أي طرف ثالث."
            : "By sending this message, you agree to receive a reply to your email. We never share your info with third parties."}
        </p>
      </form>
    </motion.div>
  );
}